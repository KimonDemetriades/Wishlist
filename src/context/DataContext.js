import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever lists change
  useEffect(() => {
    if (!loading) {
      saveData();
    }
  }, [lists]);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@ListHappens_data');
      if (jsonValue != null) {
        setLists(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      const jsonValue = JSON.stringify(lists);
      await AsyncStorage.setItem('@ListHappens_data', jsonValue);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  };

  // Create a new list
  const createList = (name) => {
    const newList = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      items: [],
    };
    setLists([...lists, newList]);
    return newList.id;
  };

  // Delete a list
  const deleteList = (listId) => {
    setLists(lists.filter(list => list.id !== listId));
  };

  // Rename a list
  const renameList = (listId, newName) => {
    setLists(lists.map(list =>
      list.id === listId ? { ...list, name: newName } : list
    ));
  };

  // Add item to a list — supports priority
  const addItem = (
    listId,
    title,
    description = '',
    dueDate = null,
    priority = 'medium'
  ) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        const newItem = {
          id: Date.now().toString(),
          title,
          description,
          completed: false,
          createdAt: Date.now(),
          dueDate,
          priority,
        };
        return { ...list, items: [...list.items, newItem] };
      }
      return list;
    }));
  };

  // Update item
  const updateItem = (listId, itemId, updates) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        };
      }
      return list;
    }));
  };

  // Toggle item completion
  const toggleItem = (listId, itemId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return list;
    }));
  };

  // Delete item
  const deleteItem = (listId, itemId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.filter(item => item.id !== itemId),
        };
      }
      return list;
    }));
  };

  // Clear completed items
  const clearCompleted = (listId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.filter(item => !item.completed),
        };
      }
      return list;
    }));
  };

  // 🔥 NEW: Reorder items (drag & drop)
  const reorderItems = (listId, newItemsOrder) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return { ...list, items: newItemsOrder };
      }
      return list;
    }));
  };

  const value = {
    lists,
    loading,
    createList,
    deleteList,
    renameList,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    reorderItems, // 🔥 Make available to UI
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
