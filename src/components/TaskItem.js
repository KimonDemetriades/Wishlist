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
import { useTheme } from '../context/ThemeContext';

export default function TaskItem({ item, listId, onEdit, onLongPress }) {
  const { toggleItem, deleteItem } = useData();
  const { theme } = useTheme();

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

  // Priority colors stay bright in both themes
  const priorityColors = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#4CAF50',
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.isDark ? '#000' : '#000',
        },
      ]}
    >
        {/* Priority bar */}
        <View
          style={[
            styles.priorityBar,
            { backgroundColor: priorityColors[item.priority || 'medium'] }
          ]}
        />

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleItem(listId, item.id)}
        >
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={
              item.completed
                ? theme.success
                : theme.textSecondary
            }
          />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.text },
              item.completed && { color: theme.textSecondary, textDecorationLine: 'line-through' }
            ]}
          >
            {item.title}
          </Text>

          {item.description ? (
            <Text
              style={[
                styles.description,
                { color: theme.textSecondary },
                item.completed && { color: theme.textSecondary, textDecorationLine: 'line-through' }
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
                color={isOverdue(item.dueDate) ? theme.danger : theme.textSecondary}
              />
              <Text
                style={[
                  styles.dueDate,
                  { color: theme.textSecondary },
                  isOverdue(item.dueDate) && { color: theme.danger, fontWeight: '600' }
                ]}
              >
                {formatDate(item.dueDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            onLongPress={onLongPress}
            delayLongPress={200}
            style={styles.actionButton}
          >
            <Ionicons name="reorder-three" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash" size={20} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
    paddingLeft: 16, // space for priority bar
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

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
    fontWeight: '500',
    marginBottom: 4,
  },

  description: {
    fontSize: 14,
    marginBottom: 6,
  },

  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  dueDate: {
    fontSize: 12,
    marginLeft: 4,
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