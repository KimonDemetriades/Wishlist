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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Image } from 'react-native';
import { useColorScheme } from 'react-native';



export default function HomeScreen({ navigation }) {
  const { lists, createList, deleteList, renameList } = useData();
  const { theme, isDark, toggleTheme } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [listName, setListName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const colorScheme = isDark ? 'dark' : 'light';
  //console.log("🔄 Theme changed:", colorScheme);
  const logoSource = colorScheme === 'dark'
    ? require('../../assets/icon_bar_white.png')
    : require('../../assets/icon_bar_v0.png');


  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Lists',
      headerStyle: { backgroundColor: theme.card },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text, fontWeight: 'bold'},
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme} style={{ paddingRight: 12 }}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ paddingRight: 12 }}>
            <Ionicons name="ellipsis-vertical" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme, isDark]);

  const handleCreateList = () => {
    if (listName.trim()) {
      if (editingListId) {
        renameList(editingListId, listName.trim());
        setEditingListId(null);
      } else {
        createList(listName.trim());
      }
      setListName('');
      setModalVisible(false);
    }
  };

  const handleEditList = (list) => {
    setEditingListId(list.id);
    setListName(list.name);
    setModalVisible(true);
  };

  const handleDeleteList = (listId) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteList(listId) },
      ]
    );
  };

  const getListStats = (list) => {
    const total = list.items.length;
    const completed = list.items.filter(item => item.completed).length;
    return { total, completed };
  };

  const filteredLists = lists.filter(list => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      list.name.toLowerCase().includes(query) ||
      list.items.some(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
    );
  });

  const renderListItem = ({ item }) => {
    const stats = getListStats(item);
    return (
      <TouchableOpacity
        style={[
          styles.listCard,
          { backgroundColor: theme.card, borderColor: theme.border }
        ]}
        onPress={() => navigation.navigate('ListDetail', { listId: item.id })}
      >
        <View style={styles.listCardContent}>
          <View style={styles.listHeader}>
            <Text style={[styles.listName, { color: theme.text }]}>
              {item.name}
            </Text>

            <View style={styles.listActions}>
              <TouchableOpacity
                onPress={() => handleEditList(item)}
                style={styles.iconButton}
              >
                <Ionicons name="pencil" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteList(item.id)}
                style={styles.iconButton}
              >
                <Ionicons name="trash" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: theme.textSecondary }]}>
              {stats.completed}/{stats.total} completed
            </Text>

            {stats.total > 0 && (
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: theme.border }
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(stats.completed / stats.total) * 100}%`,
                      backgroundColor: theme.success,
                    }
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

	  {/* In-app logo (below header, above search bar) */}
	  <View style={{ alignItems: 'center', marginTop: 20 }}>
	    <Image
		  source={logoSource}
		  style={{
		    width: 200,          // or any width you want
		    height: undefined,   // let RN calculate height
		    aspectRatio: 4,      // match your logo’s real ratio
		  }}
		  resizeMode="contain"
	    />
	  </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.card, shadowColor: theme.isDark ? '#000' : '#000' }
        ]}
      >
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />

        <TextInput
          style={[
            styles.searchInput,
            { color: theme.text }
          ]}
          placeholder="Search lists and items..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Lists */}
      <FlatList
        data={filteredLists}
        renderItem={renderListItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={80} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No lists yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Tap the + button to create one
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          setEditingListId(null);
          setListName('');
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Create/Edit List Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingListId ? 'Rename List' : 'New List'}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                }
              ]}
              placeholder="List name"
              placeholderTextColor={theme.textSecondary}
              value={listName}
              onChangeText={setListName}
              autoFocus
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
                  setListName('');
                  setEditingListId(null);
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
                  { backgroundColor: theme.primary }
                ]}
                onPress={handleCreateList}
              >
                <Text style={[styles.createButtonText, { color: '#fff' }]}>
                  {editingListId ? 'Save' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
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
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('About');
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>About & Privacy</Text>
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

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  listContainer: {
    padding: 15,
    paddingTop: 5,
  },

  listCard: {
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listCardContent: {
    padding: 15,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  listActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },

  statsContainer: {
    marginTop: 5,
  },
  statsText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
  },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  // Menu styles
  menuContent: {
    position: 'absolute',
    top: 60,
    right: 10,
    borderRadius: 8,
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
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});