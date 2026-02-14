import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import TaskItem from '../components/TaskItem';

export default function ListDetailScreen({ route, navigation }) {
  const { listId } = route.params;
  const { lists, addItem, clearCompleted, updateItem } = useData();
  const list = lists.find(l => l.id === listId);

  const [modalVisible, setModalVisible] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDueDate, setItemDueDate] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [filterMode, setFilterMode] = useState('all'); // 'all', 'active', 'completed'
  const [sortMode, setSortMode] = useState('default'); // 'default', 'alpha', 'date', 'priority'
  const [menuVisible, setMenuVisible] = useState(false);

  // 🔥 NEW: Priority state
  const [itemPriority, setItemPriority] = useState('medium');

  // 🔥 NEW: Priority colors
  const priorityColors = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#4CAF50',
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name || 'List',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#2196F3" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, list]);

  if (!list) {
    return (
      <View style={styles.container}>
        <Text>List not found</Text>
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
          priority: itemPriority, // 🔥 NEW
        });
        setEditingItemId(null);
      } else {
        addItem(
          listId,
          itemTitle.trim(),
          itemDescription.trim(),
          itemDueDate,
          itemPriority // 🔥 NEW
        );
      }

      setItemTitle('');
      setItemDescription('');
      setItemDueDate(null);
      setItemPriority('medium'); // 🔥 NEW
      setModalVisible(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemTitle(item.title);
    setItemDescription(item.description || '');
    setItemDueDate(item.dueDate);
    setItemPriority(item.priority || 'medium'); // 🔥 NEW
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

  // Filter + Sort
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
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <TouchableOpacity
          style={[styles.statButton, filterMode === 'all' && styles.statButtonActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text style={[styles.statText, filterMode === 'all' && styles.statTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statButton, filterMode === 'active' && styles.statButtonActive]}
          onPress={() => setFilterMode('active')}
        >
          <Text style={[styles.statText, filterMode === 'active' && styles.statTextActive]}>
            Active ({stats.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statButton, filterMode === 'completed' && styles.statButtonActive]}
          onPress={() => setFilterMode('completed')}
        >
          <Text style={[styles.statText, filterMode === 'completed' && styles.statTextActive]}>
            Done ({stats.completed})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort:</Text>

        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'default' && styles.sortButtonActive]}
          onPress={() => setSortMode('default')}
        >
          <Text style={[styles.sortText, sortMode === 'default' && styles.sortTextActive]}>
            Default
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'alpha' && styles.sortButtonActive]}
          onPress={() => setSortMode('alpha')}
        >
          <Text style={[styles.sortText, sortMode === 'alpha' && styles.sortTextActive]}>
            A-Z
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'date' && styles.sortButtonActive]}
          onPress={() => setSortMode('date')}
        >
          <Text style={[styles.sortText, sortMode === 'date' && styles.sortTextActive]}>
            Date
          </Text>
        </TouchableOpacity>

        {/* 🔥 NEW: Priority sort */}
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'priority' && styles.sortButtonActive]}
          onPress={() => setSortMode('priority')}
        >
          <Text style={[styles.sortText, sortMode === 'priority' && styles.sortTextActive]}>
            Priority
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            listId={listId}
            onEdit={() => handleEditItem(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {filterMode === 'completed'
                ? 'No completed items'
                : filterMode === 'active'
                ? 'No active items'
                : 'No items yet'}
            </Text>
            {filterMode === 'all' && (
              <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
            )}
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingItemId(null);
          setItemTitle('');
          setItemDescription('');
          setItemDueDate(null);
          setItemPriority('medium'); // 🔥 NEW
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItemId ? 'Edit Item' : 'New Item'}
            </Text>

            {/* 🔥 NEW: Priority Selector */}
            <View style={styles.prioritySection}>
              <Text style={styles.sectionLabel}>Priority:</Text>
              <View style={styles.priorityButtons}>
                {['high', 'medium', 'low'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      itemPriority === p && styles.priorityButtonActive,
                      { borderColor: priorityColors[p] }
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
              style={styles.modalInput}
              placeholder="Title"
              value={itemTitle}
              onChangeText={setItemTitle}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, styles.descriptionInput]}
              placeholder="Description (optional)"
              value={itemDescription}
              onChangeText={setItemDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setItemTitle('');
                  setItemDescription('');
                  setItemDueDate(null);
                  setItemPriority('medium'); // 🔥 NEW
                  setEditingItemId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleAddOrEditItem}
              >
                <Text style={styles.createButtonText}>
                  {editingItemId ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleClearCompleted}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.menuText, { color: '#FF3B30' }]}>
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
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    padding: 10,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statButtonActive: {
    backgroundColor: '#2196F3',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    paddingTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  sortText: {
    fontSize: 13,
    color: '#666',
  },
  sortTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },

  /* 🔥 NEW PRIORITY UI STYLES */
  prioritySection: {
    marginBottom: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
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
  priorityButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingRight: 10,
  },
  menuContent: {
    backgroundColor: '#fff',
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
});

//export default ListDetailScreen;
