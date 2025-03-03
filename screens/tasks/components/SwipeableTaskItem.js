import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

function RightAction({ prog, drag, onEdit, onDelete }) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 150 }],
    };
  });

  const tapDelete = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete();
    });

  const tapEdit = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onEdit();
    });

  return (
    <Reanimated.View style={[styleAnimation, styles.rightButtonContainer]}>
      <GestureDetector gesture={tapEdit}>
        <View style={styles.editButton}>
          <Text style={styles.backTextWhite}>Edit</Text>
        </View>
      </GestureDetector>
      <GestureDetector gesture={tapDelete}>
        <View style={styles.deleteButton}>
          <Text style={styles.backTextWhite}>Delete</Text>
        </View>
      </GestureDetector>
    </Reanimated.View>
  );
}

export default function SwipeableTaskItem({
  task,
  onEdit,
  onDelete,
  onTap,
  onLongPress,
  selected = false,
  selectionMode = false,
}) {
  // Define a tap gesture that blocks external gestures when active.
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      onTap(task);
      console.log('Tapped!');
    });

  const longPress = Gesture.LongPress()
    .runOnJS(true)
    .onStart((e) => {
      onLongPress(task);
      console.log(`Long pressed for ${e.duration} ms!`);
    });

  const taskGestures = Gesture.Exclusive(longPress, tap);

  // Format the date string properly
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get the appropriate background color based on priority
  const getBackgroundColor = () => {
    if (selected) return '#e6f2ff'; // Light blue when selected

    const priorityColors = {
      High: '#FF5252', // Red for high priority
      Medium: '#FFD740', // Yellow for medium priority
      Low: '#4CAF50', // Green for low priority
    };
    return priorityColors[task.priority] || '#f5f5f5';
  };

  return (
    <ReanimatedSwipeable
      containerStyle={styles.swipeable}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      childrenContainerStyle={styles.taskItemContainer}
      enabled={!selectionMode}
      renderRightActions={(prog, drag) => (
        <RightAction prog={prog} drag={drag} onEdit={onEdit} onDelete={onDelete} />
      )}>
      <GestureDetector gesture={taskGestures}>
        <View collapsable={false} style={styles.contentContainer}>
          <View style={[styles.priorityIndicator, { backgroundColor: getBackgroundColor() }]} />
          <View style={styles.taskContent}>
            <Text
              style={[styles.taskTitle, task.completed && styles.completedTask]}
              numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.taskDueDate}>{formatDate(task.dueDate)}</Text>
          </View>

          {selectionMode && (
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  swipeable: {
    flex: 1,
    marginBottom: 8,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    height: 64,
    overflow: 'hidden',
  },
  taskItemContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  taskDueDate: {
    fontSize: 12,
    color: 'gray',
    marginTop: 3,
  },
  rightButtonContainer: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#4CD964',
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 75,
    backgroundColor: 'red',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  priorityIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
  },
});
