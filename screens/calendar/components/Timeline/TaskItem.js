import React, { memo, useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styles from './styles';
import {
  HOUR_HEIGHT,
  TASK_ITEM_HEIGHT,
  TASK_ITEM_WIDTH,
  QUARTER_HEIGHT,
  timeToPosition,
  formatTimeFromDecimal,
} from './utils/timelineHelpers';

// Import custom hooks
import useTaskAnimations from './hooks/useTaskAnimations';
import useTaskGestures from './hooks/useTaskGestures';
import useAutoScroll from './hooks/useAutoScroll';

const TaskItem = ({
  task,
  index,
  onStateChange,
  scrollY,
  timelineLayout,
  previewVisible,
  previewPosition,
  previewHeight,
  isDragging,
  isDraggingScheduled,
  removeButtonLayout,
  cancelButtonLayout,
  ghostVisible,
  ghostPosition,
  ghostHeight,
  isRemoveHovered,
  isCancelHovered,
  autoScrollActive,
  scrollViewRef,
  timelineViewHeight,
  validZones,
  isPreviewValid,
  isSchedulable = true,
  onTapUnScheduled,
  onDismissTooltip,
}) => {
  // Use custom hooks for animations and state management
  const animations = useTaskAnimations(task);

  // Calculate height based on duration
  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = task.scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;

  // Set up auto-scrolling
  useAutoScroll({
    isPressed: animations.isPressed,
    isOverTimeline: animations.isOverTimeline,
    task,
    hasBeenOverTimeline: animations.hasBeenOverTimeline,
    pointerPositionY: animations.pointerPositionY,
    scrollDirection: animations.scrollDirection,
    scrollSpeed: animations.scrollSpeed,
    accumulatedScrollOffset: animations.accumulatedScrollOffset,
    autoScrollActive,
    scrollY,
    timelineLayout,
    scrollViewRef,
    timelineViewHeight,
  });

  // Create gesture handlers
  const composedGestures = useTaskGestures({
    task,
    animations,
    onStateChange,
    scrollY,
    timelineLayout,
    previewVisible,
    previewPosition,
    previewHeight,
    isDragging,
    isDraggingScheduled,
    removeButtonLayout,
    cancelButtonLayout,
    ghostVisible,
    ghostPosition,
    ghostHeight,
    isRemoveHovered,
    isCancelHovered,
    autoScrollActive,
    scrollViewRef,
    timelineViewHeight,
    validZones,
    isPreviewValid,
    isSchedulable,
    onTapUnScheduled,
    onDismissTooltip,
    taskHeight,
  });

  // Define static styles outside of the worklet for better performance
  const scheduledStaticStyles = useMemo(
    () => ({
      position: 'absolute',
      left: 0,
      right: 0,
      marginHorizontal: 5,
      backgroundColor: '#a8e6cf',
      height: taskHeight,
    }),
    [taskHeight],
  );

  const unscheduledStaticStyles = useMemo(
    () => ({
      width: TASK_ITEM_WIDTH / 2,
      height: TASK_ITEM_HEIGHT / 2,
      padding: 5,
    }),
    [],
  );

  const nonSchedulableStaticStyles = useMemo(
    () =>
      !isSchedulable
        ? {
            borderWidth: 1,
            borderColor: '#bdbdbd',
            borderStyle: 'dashed',
          }
        : {},
    [isSchedulable],
  );

  // Optimized animated styles - only compute what changes during animation
  const animatedStyles = useAnimatedStyle(() => {
    // Common transform properties extracted to reduce calculation in worklet
    const commonTransform = {
      transform: [
        { translateX: animations.translateX.value },
        { translateY: animations.translateY.value },
        { scale: animations.scale.value },
      ],
    };

    if (task.scheduled) {
      return {
        ...commonTransform,
        top: timeToPosition(animations.taskTime.value),
        zIndex: animations.isPressed.value ? 1000 : index + 1,
      };
    } else {
      return {
        ...commonTransform,
        opacity: !isSchedulable ? 0.5 : animations.opacity.value,
        backgroundColor: animations.isOverTimeline.value
          ? '#a8e6cf'
          : !isSchedulable
            ? '#e0e0e0'
            : '#ffd3b6',
        zIndex: animations.isPressed.value ? 1000 : 1,
      };
    }
  });

  // Render task item
  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View
        style={[
          styles.taskItem,
          task.scheduled ? scheduledStaticStyles : unscheduledStaticStyles,
          !task.scheduled && nonSchedulableStaticStyles,
          animatedStyles,
        ]}>
        <Text
          style={task.scheduled ? styles.scheduledTaskTitle : styles.unscheduledTaskTitle}
          numberOfLines={1}>
          {task.title}
        </Text>

        {task.scheduled ? (
          // Scheduled task details with time display
          <View style={styles.scheduledTaskDetails}>
            <Text style={styles.scheduledTaskTime}>{formatTimeFromDecimal(task.startTime)}</Text>
            <Text style={styles.scheduledTaskDuration}>{task.duration}h</Text>
            {!isSchedulable && (
              <Text style={styles.nonSchedulableText}>No time slots available</Text>
            )}
          </View>
        ) : (
          // Unscheduled task just shows duration
          <Text style={styles.unscheduledTaskDuration}>{task.duration}h</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(TaskItem, (prevProps, nextProps) => {
  // Only re-render for important changes
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.scheduled === nextProps.task.scheduled &&
    prevProps.task.startTime === nextProps.task.startTime
  );
});
