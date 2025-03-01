import React from 'react';
import { Animated, Text, View, TouchableHighlight, StyleSheet } from 'react-native';
import { createAnimatedStyles } from '../../../utilities/animation-utils';
import { MaterialIcons } from '@expo/vector-icons';

const TaskItem = ({ item, animVal, onToggleComplete, onLongPress, selected, selectionMode }) => {
  return (
    <Animated.View style={[styles.rowFront, createAnimatedStyles(animVal, false)]}>
      <TouchableHighlight
        onPress={onToggleComplete}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        underlayColor="#d4d4d4"
        style={{ flex: 1 }}>
        <View
          style={[
            styles.taskItem,
            item.completed && styles.completedTask,
            selected && styles.selectedTask,
          ]}>
          {selectionMode && (
            <View style={styles.checkbox}>
              {selected ? (
                <MaterialIcons name="check-circle" size={24} color="#2196F3" />
              ) : (
                <MaterialIcons name="radio-button-unchecked" size={24} color="#999" />
              )}
            </View>
          )}
          <Text
            style={[
              styles.taskText,
              item.completed && styles.strikethrough,
              selectionMode && styles.taskTextWithSelection,
            ]}>
            {item.title} — {new Date(item.dueDate).toDateString()}
          </Text>
        </View>
      </TouchableHighlight>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rowFront: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  taskItem: {
    backgroundColor: '#eee',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedTask: {
    backgroundColor: '#d3d3d3',
  },
  selectedTask: {
    backgroundColor: '#E3F2FD',
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
  taskTextWithSelection: {
    marginLeft: 8,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  checkbox: {
    marginRight: 8,
  },
});

export default TaskItem;
