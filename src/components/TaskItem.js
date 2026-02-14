import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';

export default function TaskItem({ item, listId, onEdit }) {
  const { toggleItem, deleteItem } = useData();

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(listId, item.id),
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !item.completed;
  };

  // 🔥 NEW: Priority colors
  const priorityColors = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#4CAF50',
  };

  return (
    <View style={styles.container}>
      {/* 🔥 NEW: Priority bar */}
      <View
        style={[
          styles.priorityBar,
          { backgroundColor: priorityColors[item.priority || 'medium'] }
        ]}
      />

      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleItem(listId, item.id)}
      >
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={item.completed ? '#4CAF50' : '#999'}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            item.completed && styles.completedText,
          ]}
        >
          {item.title}
        </Text>
        
        {item.description ? (
          <Text
            style={[
              styles.description,
              item.completed && styles.completedText,
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}

        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isOverdue(item.dueDate) ? '#FF3B30' : '#666'}
            />
            <Text
              style={[
                styles.dueDate,
                isOverdue(item.dueDate) && styles.overdue,
              ]}
            >
              {formatDate(item.dueDate)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Ionicons name="pencil" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    paddingLeft: 16, // 🔥 NEW: space for priority bar
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // 🔥 NEW: Priority bar style
  priorityBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },

  checkbox: {
    paddingTop: 2,
    paddingRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  overdue: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
});
