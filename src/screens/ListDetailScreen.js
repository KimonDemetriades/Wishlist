import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import TaskItem from '../components/TaskItem';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useTheme } from '../context/ThemeContext';

export default function ListDetailScreen({ route, navigation }) {
  const { listId } = route.params;
  const { lists, addItem, clearCompleted, updateItem, reorderItems } = useData();
  const list = lists.find(l => l.id === listId);

  const { theme } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDueDate, setItemDueDate] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('default');
  const [menuVisible, setMenuVisible] = useState(false);

  const [itemPriority, setItemPriority] = useState('medium');

  const priorityColors = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#4CAF50',
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name || 'List',
      headerStyle: { backgroundColor: theme.card },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text, fontWeight: 'bold'},
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={theme.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, list, theme]);

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>List not found</Text>
      </View>
    );
  }

  const handleAddOrEditItem = () => {
    if (itemTitle.trim()) {
      if (editingItemId) {
        updateItem(listId, editingItemId, {
          title: itemTitle.trim(),
          description: itemDescription.trim(),
          dueDate: itemDueDate,
          priority: itemPriority,
        });
        setEditingItemId(null);
      } else {
        addItem(
          listId,
          itemTitle.trim(),
          itemDescription.trim(),
          itemDueDate,
          itemPriority
        );
      }

      setItemTitle('');
      setItemDescription('');
      setItemDueDate(null);
      setItemPriority('medium');
      setModalVisible(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemTitle(item.title);
    setItemDescription(item.description || '');
    setItemDueDate(item.dueDate);
    setItemPriority(item.priority || 'medium');
    setModalVisible(true);
  };

  const handleClearCompleted = () => {
    const completedCount = list.items.filter(item => item.completed).length;
    if (completedCount === 0) {
      Alert.alert('No Completed Items', 'There are no completed items to clear.');
      return;
    }
    Alert.alert(
      'Clear Completed',
      `Delete ${completedCount} completed item${completedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            clearCompleted(listId);
            setMenuVisible(false);
          },
        },
      ]
    );
  };

  const getFilteredItems = () => {
    let filtered = [...list.items];

    if (filterMode === 'active') {
      filtered = filtered.filter(item => !item.completed);
    } else if (filterMode === 'completed') {
      filtered = filtered.filter(item => item.completed);
    }

    if (sortMode === 'alpha') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'date') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortMode === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => {
        const aP = priorityOrder[a.priority || 'medium'];
        const bP = priorityOrder[b.priority || 'medium'];
        return aP - bP;
      });
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const stats = {
    total: list.items.length,
    active: list.items.filter(item => !item.completed).length,
    completed: list.items.filter(item => item.completed).length,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Stats Bar */}
      <View
        style={[
          styles.statsBar,
          { backgroundColor: theme.card, borderBottomColor: theme.border }
        ]}
      >
        {['all', 'active', 'completed'].map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.statButton,
              filterMode === mode && { backgroundColor: theme.primary }
            ]}
            onPress={() => setFilterMode(mode)}
          >
            <Text
              style={[
                styles.statText,
                { color: filterMode === mode ? '#fff' : theme.text }
              ]}
            >
              {mode === 'all'
                ? `All (${stats.total})`
                : mode === 'active'
                ? `Active (${stats.active})`
                : `Done (${stats.completed})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort Bar */}
      <View
        style={[
          styles.sortContainer,
          { backgroundColor: theme.card, borderBottomColor: theme.border }
        ]}
      >
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>
          Sort:
        </Text>

        {[
          { key: 'default', label: 'Default' },
          { key: 'alpha', label: 'A-Z' },
          { key: 'date', label: 'Date' },
          { key: 'priority', label: 'Priority' },
        ].map(btn => (
          <TouchableOpacity
            key={btn.key}
            style={[
              styles.sortButton,
              { borderColor: theme.border },
              sortMode === btn.key && {
                backgroundColor: theme.primary + '22',
                borderColor: theme.primary,
              }
            ]}
            onPress={() => setSortMode(btn.key)}
          >
            <Text
              style={[
                styles.sortText,
                { color: sortMode === btn.key ? theme.primary : theme.text }
              ]}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Draggable List */}
      <DraggableFlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        onDragEnd={({ data }) => reorderItems(listId, data)}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, drag, isActive }) => (
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={[
              isActive && styles.dragging,
              isActive && { backgroundColor: theme.card }
            ]}
          >
            <TaskItem
              item={item}
              listId={listId}
              onEdit={() => handleEditItem(item)}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {filterMode === 'completed'
                ? 'No completed items'
                : filterMode === 'active'
                ? 'No active items'
                : 'No items yet'}
            </Text>
            {filterMode === 'all' && (
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Tap the + button to add one
              </Text>
            )}
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.success }]}
        onPress={() => {
          setEditingItemId(null);
          setItemTitle('');
          setItemDescription('');
          setItemDueDate(null);
          setItemPriority('medium');
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingItemId ? 'Edit Item' : 'New Item'}
            </Text>

            {/* Priority Selector */}
            <View style={styles.prioritySection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Priority:
              </Text>
              <View style={styles.priorityButtons}>
                {['high', 'medium', 'low'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      { borderColor: priorityColors[p] },
                      itemPriority === p && { backgroundColor: theme.border + '33' }
                    ]}
                    onPress={() => setItemPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        { color: priorityColors[p] }
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="Title"
              placeholderTextColor={theme.textSecondary}
              value={itemTitle}
              onChangeText={setItemTitle}
              autoFocus
            />

            <TextInput
              style={[
                styles.modalInput,
                styles.descriptionInput,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textSecondary}
              value={itemDescription}
              onChangeText={setItemDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: theme.border + '33' }
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setItemTitle('');
                  setItemDescription('');
                  setItemDueDate(null);
                  setItemPriority('medium');
                  setEditingItemId(null);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  { backgroundColor: theme.success }
                ]}
                onPress={handleAddOrEditItem}
              >
                <Text style={[styles.createButtonText, { color: '#fff' }]}>
                  {editingItemId ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu */}
      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContent, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleClearCompleted}
            >
              <Ionicons name="trash-outline" size={24} color={theme.danger} />
              <Text style={[styles.menuText, { color: theme.danger }]}>
                Clear Completed
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 10,
  },

  /* Stats Bar */
  statsBar: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
  },
  statButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* Sort Bar */
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: 5,
    borderBottomWidth: 1,
  },
  sortLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 13,
  },

  listContainer: {
    padding: 15,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  /* Priority UI */
  prioritySection: {
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
  },
  createButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  /* Menu */
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingRight: 10,
  },
  menuContent: {
    borderRadius: 10,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },

  /* Dragging */
  dragging: {
    opacity: 0.5,
  },
});
