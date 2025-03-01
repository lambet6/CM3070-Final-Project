import React from 'react';
import { Animated, Text, View, TouchableHighlight, StyleSheet } from 'react-native';
import { createAnimatedStyles } from '../../../utilities/animation-utils';

const TaskItem = ({ item, animVal, onToggleComplete }) => {
  return (
    <Animated.View style={[styles.rowFront, createAnimatedStyles(animVal, false)]}>
      <TouchableHighlight
        onPress={() => onToggleComplete(item.id)}
        activeOpacity={0.8}
        underlayColor="#d4d4d4"
        style={{ flex: 1 }}>
        <View style={[styles.taskItem, item.completed && styles.completedTask]}>
          <Text style={[styles.taskText, item.completed && styles.strikethrough]}>
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
  },
  completedTask: {
    backgroundColor: '#d3d3d3',
  },
  taskText: {
    fontSize: 16,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
});

export default TaskItem;
