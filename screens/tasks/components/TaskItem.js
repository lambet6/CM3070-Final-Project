import React from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAnimatedStyles } from '../../../utilities/animation-utils';

const TaskItem = ({ item, animVal, onToggleComplete }) => {
  const animatedStyles = createAnimatedStyles(animVal, false);

  return (
    <Animated.View style={animatedStyles}>
      <Pressable
        onPress={() => {
          onToggleComplete(item.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        style={[styles.taskItem, item.completed && styles.completedTask]}>
        <View>
          <Text style={[styles.taskText, item.completed && styles.strikethrough]}>
            {item.title} — {new Date(item.dueDate).toDateString()}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#eee',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
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
