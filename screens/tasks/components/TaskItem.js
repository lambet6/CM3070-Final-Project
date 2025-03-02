import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TaskItem = ({ item, onToggleComplete, onLongPress, selected, selectionMode }) => {
  // Get the appropriate priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#FF5252'; // Red for high priority
      case 'Medium':
        return '#FFD740'; // Yellow for medium priority
      case 'Low':
        return '#4CAF50'; // Green for low priority
      default:
        return '#757575'; // Grey as fallback
    }
  };

  return (
    <Pressable
      onPress={onToggleComplete}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      underlayColor="#d4d4d4"
      style={styles.rowFront}>
      <View
        style={[
          styles.taskItem,
          item.completed && styles.completedTask,
          selected && styles.selectedTask,
        ]}>
        {selectionMode ? (
          <View style={styles.checkbox}>
            {selected ? (
              <MaterialIcons name="check-circle" size={24} color="#2196F3" />
            ) : (
              <MaterialIcons name="radio-button-unchecked" size={24} color="#999" />
            )}
          </View>
        ) : (
          <View
            style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]}
          />
        )}

        <View style={styles.taskContent}>
          <Text numberOfLines={1} style={[styles.taskText, item.completed && styles.strikethrough]}>
            {item.title}
          </Text>
          <Text style={styles.dateText}>{new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>

        {item.completed && (
          <MaterialIcons
            name="check-circle"
            size={20}
            color="#4CAF50"
            style={styles.completedIcon}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowFront: {
    marginBottom: 8,
    borderRadius: 15,
    // overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    alignItems: 'stretch',
    alignContent: 'stretch',
    height: 64,
  },
  taskItem: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    marginLeft: 10,
  },
  completedTask: {
    backgroundColor: '#e0e0e0',
  },
  selectedTask: {
    backgroundColor: '#E3F2FD',
  },
  taskText: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  checkbox: {
    marginRight: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  completedIcon: {
    marginLeft: 8,
  },
});

export default TaskItem;
