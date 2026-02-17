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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import TaskItem from '../components/TaskItem';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ListDetailScreen({ route, navigation }) {
  const { listId } = route.params;
  const { lists, addItem, clearCompleted, updateItem, reorderItems, deleteItem, toggleItem, selectAll } = useData();
  const list = lists.find(l => l.id === listId);

  const { theme } = useTheme();

  // Single add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDueDate, setItemDueDate] = useState(null);
  const [itemPriority, setItemPriority] = useState('medium');
  const [editingItemId, setEditingItemId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Bulk add modal state
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [stagedItems, setStagedItems] = useState([]);
  
  // Menu and filter state
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'active', 'completed'
  const [sortMode, setSortMode] = useState('default'); // 'default', 'alpha', 'date', 'priority'
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  useLayoutEffect(() => {
    navigation.setOptions({
      title: list?.name || 'List',
      headerStyle: { backgroundColor: theme.card },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text, fontWeight: 'bold' },
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

  // SINGLE ITEM FUNCTIONS
  const handleAddOrEditItem = () => {
    if (!itemTitle.trim()) return;

    if (editingItemId) {
      updateItem(listId, editingItemId, {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        dueDate: itemDueDate,
        priority: itemPriority,
      });
      setEditingItemId(null);
    } else {
      addItem(listId, itemTitle.trim(), itemDescription.trim(), itemDueDate, itemPriority);
    }

    setItemTitle('');
    setItemDescription('');
    setItemDueDate(null);
    setItemPriority('medium');
    setModalVisible(false);
  };

  // Open edit modal for an item
  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setItemTitle(item.title);
    setItemDescription(item.description || '');
    setItemDueDate(item.dueDate);
    setItemPriority(item.priority || 'medium');
    setModalVisible(true);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // BULK ADD FUNCTIONS
  const parseBulkText = () => {
    const parsed = bulkText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    if (parsed.length === 0) {
      Alert.alert('Nothing to preview', 'Enter one item per line.');
      return;
    }

    setStagedItems(parsed);
  };

  const acceptBulkAdd = () => {
    stagedItems.forEach(title => {
      addItem(listId, title, '', null, 'medium');
    });

    setBulkText('');
    setStagedItems([]);
    setBulkModalVisible(false);
  };

  const cancelBulkAdd = () => {
    setBulkText('');
    setStagedItems([]);
    setBulkModalVisible(false);
  };

  const cleanStagedItems = () => {
    const pattern = new RegExp('^(\\[[^\\]]*\\]\\s*)+', 'g');
    const cleaned = stagedItems.map(item => 
      item.trimStart().replace(pattern, '') 
    );
    setStagedItems(cleaned);
  };

  const rejectBulkAdd = () => {
    setBulkText('');
    setStagedItems([]);
    setBulkModalVisible(false);
  };

  const removeStagedItem = (index) => {
    setStagedItems(items => items.filter((_, i) => i !== index));
  };

  // MENU FUNCTIONS
  const handleSelectAll = () => {
    const incompleteCount = list.items.filter(item => !item.completed).length;
  
    if (incompleteCount === 0) {
      Alert.alert('All Complete', 'All items are already marked as completed.');
      setMenuVisible(false);
      return;
    }

    Alert.alert(
      'Select All',
      `Mark ${incompleteCount} item${incompleteCount !== 1 ? 's' : ''} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => {
            selectAll(listId);
            setMenuVisible(false);
          },
        },
      ]
    );
  };
  
  const handleClearCompleted = () => {
    const completedCount = list.items.filter(item => item.completed).length;
    
    if (completedCount === 0) {
      Alert.alert('No completed items', 'There are no completed items to clear.');
      setMenuVisible(false);
      return;
    }

    Alert.alert(
      'Clear Completed',
      `Remove ${completedCount} completed item${completedCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearCompleted(listId);
            setMenuVisible(false);
          },
        },
      ]
    );
  };

  // FILTER FUNCTIONS
  const getFilteredItems = () => {
    let filtered = [...list.items];
    
    // Apply completion filter (all/active/completed)
    if (filterMode === 'active') {
      filtered = filtered.filter(item => !item.completed);
    } else if (filterMode === 'completed') {
      filtered = filtered.filter(item => item.completed);
    }
    
    // Apply priority filter (from priority buttons)
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    // Apply sort
    if (sortMode === 'alpha') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'date') {
      //filtered.sort((a, b) => b.createdAt - a.createdAt);
	  filtered.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
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
  
  //const getFilteredItems = () => {
  //  if (priorityFilter === 'all') {
  //    return list.items;
  //  }
  //  return list.items.filter(item => item.priority === priorityFilter);
  //};
  //const filteredItems = getFilteredItems();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
    
      {/* STATS BAR - ADD THIS */}
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

      {/* SORT BAR - ADD THIS */}
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
	  
      {/* PRIORITY FILTER BUTTONS */}
      <View style={[styles.filterContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              priorityFilter === 'all' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setPriorityFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: priorityFilter === 'all' ? '#fff' : theme.text }
            ]}>
              All ({list.items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              priorityFilter === 'high' && { backgroundColor: '#ef4444' },
            ]}
            onPress={() => setPriorityFilter('high')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: priorityFilter === 'high' ? '#fff' : theme.text }
            ]}>
              High ({list.items.filter(i => i.priority === 'high').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              priorityFilter === 'medium' && { backgroundColor: '#f59e0b' },
            ]}
            onPress={() => setPriorityFilter('medium')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: priorityFilter === 'medium' ? '#fff' : theme.text }
            ]}>
              Medium ({list.items.filter(i => i.priority === 'medium').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              priorityFilter === 'low' && { backgroundColor: '#10b981' },
            ]}
            onPress={() => setPriorityFilter('low')}
          >
            <Text style={[
              styles.filterButtonText,
              { color: priorityFilter === 'low' ? '#fff' : theme.text }
            ]}>
              Low ({list.items.filter(i => i.priority === 'low').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* TASK LIST - Scrollable Container */}
      <View style={styles.listWrapper}>
        <DraggableFlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          onDragEnd={({ data }) => reorderItems(listId, data)}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, drag, isActive }) => (
            <View style={isActive && { opacity: 0.5 }}>
              <TaskItem 
                item={item} 
                listId={listId} 
                onEdit={() => handleEditItem(item)}
                onLongPress={drag}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No items in this list
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Tap + to add an item
              </Text>
            </View>
          }
        />
      </View>

      {/* BULK ADD FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: 95,
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.primary,
          },
        ]}
        onPress={() => setBulkModalVisible(true)}
      >
        <Ionicons name="list-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* SINGLE ADD FAB */}
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

      {/* MENU MODAL */}
      <Modal
        transparent
        animationType="fade"
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
              onPress={handleSelectAll}
            >
              <Ionicons name="checkmark-done-outline" size={20} color={theme.success} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                Select All
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />		  

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleClearCompleted}
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
              <Text style={[styles.menuItemText, { color: theme.danger }]}>
                Clear Completed
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SINGLE ADD/EDIT MODAL */}
      <Modal transparent animationType="slide" visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingItemId ? 'Edit Item' : 'Add Item'}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
              placeholder="Item title"
              placeholderTextColor={theme.textSecondary}
              value={itemTitle}
              onChangeText={setItemTitle}
              autoFocus
            />

            <TextInput
              style={[
                styles.modalInput,
                {
                  height: 80,
                  textAlignVertical: 'top',
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={itemDescription}
              onChangeText={setItemDescription}
            />

            {/* PRIORITY SELECTOR */}
            <Text style={[styles.priorityLabel, { color: theme.text }]}>Priority:</Text>
            <View style={styles.priorityContainer}>
              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  itemPriority === 'high' && styles.priorityButtonActive,
                  itemPriority === 'high' && { backgroundColor: '#ef4444' },
                ]}
                onPress={() => setItemPriority('high')}
              >
                <Text style={[
                  styles.priorityButtonText,
                  { color: itemPriority === 'high' ? '#fff' : theme.text }
                ]}>
                  High
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  itemPriority === 'medium' && styles.priorityButtonActive,
                  itemPriority === 'medium' && { backgroundColor: '#f59e0b' },
                ]}
                onPress={() => setItemPriority('medium')}
              >
                <Text style={[
                  styles.priorityButtonText,
                  { color: itemPriority === 'medium' ? '#fff' : theme.text }
                ]}>
                  Medium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.priorityButton,
                  itemPriority === 'low' && styles.priorityButtonActive,
                  itemPriority === 'low' && { backgroundColor: '#10b981' },
                ]}
                onPress={() => setItemPriority('low')}
              >
                <Text style={[
                  styles.priorityButtonText,
                  { color: itemPriority === 'low' ? '#fff' : theme.text }
                ]}>
                  Low
                </Text>
              </TouchableOpacity>
            </View>

            {/* DUE DATE PICKER */}
            <Text style={[styles.priorityLabel, { color: theme.text }]}>Due Date:</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.dateButtonText, { color: itemDueDate ? theme.text : theme.textSecondary }]}>
                {itemDueDate ? formatDate(itemDueDate) : 'No due date'}
              </Text>
              {itemDueDate && (
                <TouchableOpacity onPress={() => setItemDueDate(null)} style={styles.clearDateButton}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={itemDueDate ? new Date(itemDueDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setItemDueDate(selectedDate.getTime());
                  }
                }}
              />
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingItemId(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton, { backgroundColor: theme.success }]}
                onPress={handleAddOrEditItem}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {editingItemId ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BULK ADD MODAL */}
      <Modal transparent animationType="slide" visible={bulkModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Bulk Add Items
            </Text>

            {stagedItems.length === 0 ? (
              <>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      height: 160,
                      textAlignVertical: 'top',
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  placeholder="One item per line"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  value={bulkText}
                  onChangeText={setBulkText}
                  autoFocus
                />

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={cancelBulkAdd}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.primaryButton, { backgroundColor: theme.primary }]}
                    onPress={parseBulkText}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                      Preview Items
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: theme.textSecondary, marginBottom: 10 }}>
                  Tap an item to remove it before adding
                </Text>

                <ScrollView
                  style={{
                    maxHeight: 180,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 8,
                    padding: 10,
                    backgroundColor: theme.background,
                  }}
                >
                  {stagedItems.map((item, idx) => (
                    <TouchableOpacity
                      key={`${item}-${idx}`}
                      onPress={() => removeStagedItem(idx)}
                      style={{ paddingVertical: 6 }}
                    >
                      <Text style={{ color: theme.text }}>• {item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.bulkButtonGrid}>
                  <TouchableOpacity
                    style={[styles.bulkButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={rejectBulkAdd}
                  >
                    <Text style={[styles.bulkButtonText, { color: theme.text }]}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bulkButton, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={cancelBulkAdd}
                  >
                    <Text style={[styles.bulkButtonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bulkButton, styles.primaryButton, { backgroundColor: theme.primary }]}
                    onPress={cleanStagedItems}
                  >
                    <Text style={[styles.bulkButtonText, { color: '#fff' }]}>Clean</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bulkButton, styles.primaryButton, { backgroundColor: theme.success }]}
                    onPress={acceptBulkAdd}
                  >
                    <Text style={[styles.bulkButtonText, { color: '#fff' }]}>
                      Add {stagedItems.length}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { padding: 10 },

  // ADD THESE STATS BAR STYLES
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

  // ADD THESE SORT BAR STYLES
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
  
  // Filter styles
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // List wrapper (constrains list height for scrolling)
  listWrapper: {
    flex: 1,
    marginBottom: 150, // Space for FAB buttons
  },

  // List styles (your existing code continues)
  listContainer: { 
    padding: 15,
    flexGrow: 1,
  },

  // List styles
  listContainer: { 
    padding: 15,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },

  // FAB styles
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 60,
    paddingRight: 10,
  },
  menuContent: {
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  // Priority selector styles
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  priorityButtonActive: {
    borderColor: 'transparent',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Date picker styles
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },
  clearDateButton: {
    padding: 4,
  },

  // Modal button styles
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },

  // Bulk button styles
  bulkButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    },
  bulkButton: {
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

});