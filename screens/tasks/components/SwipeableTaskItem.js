import React, { useRef, useMemo, useCallback } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Memoized RightAction component to prevent unnecessary recreations
const RightAction = React.memo(({ prog, drag, onEdit, onDelete, swipeableRef }) => {
  // Create animated style using worklet for better performance
  const styleAnimation = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: drag.value + 150 }],
    };
  });

  // Memoize gestures to avoid recreating them on each render
  const tapDelete = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }),
    [onDelete],
  );

  const tapEdit = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          swipeableRef.current?.close();
          onEdit();
        }),
    [onEdit, swipeableRef],
  );

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
});
RightAction.displayName = 'RightAction';

// Format date function moved outside component to avoid recreation
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Mapping priority to colors
const PRIORITY_COLORS = {
  High: '#FF5252', // Red for high priority
  Medium: '#FFD740', // Yellow for medium priority
  Low: '#4CAF50', // Green for low priority
};

const SwipeableTaskItem = ({
  task,
  onEdit,
  onDelete,
  onTap,
  onLongPress,
  selected = false,
  selectionMode = false,
}) => {
  const swipeableRef = useRef(null);

  // Memoize gestures to prevent recreation on each render
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          onTap(task);
        }),
    [onTap, task],
  );

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .runOnJS(true)
        .onStart(() => {
          onLongPress(task);
        }),
    [onLongPress, task],
  );

  const taskGestures = useMemo(() => Gesture.Exclusive(longPress, tap), [longPress, tap]);

  // Get background color based on priority and selection state
  const getBackgroundColor = useCallback(() => {
    if (selected) return '#e6f2ff'; // Light blue when selected
    return PRIORITY_COLORS[task.priority] || '#f5f5f5';
  }, [selected, task.priority]);

  // Pre-compute values used in the render
  const backgroundColor = getBackgroundColor();
  const formattedDate = formatDate(task.dueDate);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      containerStyle={styles.swipeable}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      childrenContainerStyle={styles.taskItemContainer}
      enabled={!selectionMode}
      renderRightActions={(prog, drag) => (
        <RightAction
          prog={prog}
          drag={drag}
          onEdit={onEdit}
          onDelete={onDelete}
          swipeableRef={swipeableRef}
        />
      )}>
      <GestureDetector gesture={taskGestures}>
        <View collapsable={false} style={styles.contentContainer}>
          <View style={[styles.priorityIndicator, { backgroundColor }]} />
          <View style={styles.taskContent}>
            <Text
              style={[styles.taskTitle, task.completed && styles.completedTask]}
              numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.taskDueDate}>{formattedDate}</Text>
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
};

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

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SwipeableTaskItem);
