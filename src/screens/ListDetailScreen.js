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
  const [bulkModalVisible, setBulkModalVisible] = useState(false);

  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDueDate, setItemDueDate] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [bulkText, setBulkText] = useState('');
  const [stagedItems, setStagedItems] = useState([]);

  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleAddOrEditItem = () => {
    if (!itemTitle.trim()) return;

    if (editingItemId) {
      updateItem(listId, editingItemId, {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        dueDate: itemDueDate,
      });
      setEditingItemId(null);
    } else {
      addItem(listId, itemTitle.trim(), itemDescription.trim(), itemDueDate);
    }

    setItemTitle('');
    setItemDescription('');
    setItemDueDate(null);
    setModalVisible(false);
  };

  // Parse pasted text into a staged preview list
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

  // Accept staged items and persist them
  // NOTE: items are added sequentially to avoid ID collisions  
  const acceptBulkAdd = () => {
    stagedItems.forEach(title => {
      addItem(listId, title, '', null, 'medium');
    });

    setBulkText('');
    setStagedItems([]);
    setBulkModalVisible(false);
  };

  // Cancel bulk add safely
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


  // Reject staged items
  const rejectBulkAdd = () => {
    setBulkText('');
    setStagedItems([]);
    setBulkModalVisible(false);
  };

  // Remove a single staged item when tapped
  const removeStagedItem = (index) => {
    setStagedItems(items => items.filter((_, i) => i !== index));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <DraggableFlatList
        data={list.items}
        keyExtractor={item => item.id}
        onDragEnd={({ data }) => reorderItems(listId, data)}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, drag, isActive }) => (
          <TouchableOpacity onLongPress={drag} disabled={isActive}>
            <TaskItem item={item} listId={listId} />
          </TouchableOpacity>
        )}
      />

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
                    },
                  ]}
                  placeholder="One item per line"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  value={bulkText}
                  onChangeText={setBulkText}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={parseBulkText}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Preview Items
                  </Text>
                </TouchableOpacity>				
				
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelBulkAdd}
                >
                  <Text style={{ color: theme.text }}>Cancel</Text>
				</TouchableOpacity>
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

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={rejectBulkAdd}
                  >
                    <Text style={{ color: theme.text }}>Reject</Text>
                  </TouchableOpacity>

				  <TouchableOpacity
					style={[styles.modalButton, styles.cancelButton]}
					onPress={cancelBulkAdd}
				  >
					<Text style={{ color: theme.text }}>Cancel</Text>
				  </TouchableOpacity>
				  
				  <TouchableOpacity
					style={[styles.modalButton, { backgroundColor: theme.primary }]}
					onPress={cleanStagedItems}
				  >
					<Text style={{ color: theme.text }}>Clean</Text>
				  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.success }]}
                    onPress={acceptBulkAdd}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
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
  listContainer: { padding: 15 },
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    backgroundColor: '#ccc',
  },
});
