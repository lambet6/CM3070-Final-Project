import React from 'react';
import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  runOnJS,
  scrollTo,
} from 'react-native-reanimated';
import styles from './styles';
import {
  TASK_ITEM_HEIGHT,
  TASK_ITEM_WIDTH,
  QUARTER_HEIGHT,
  MIN_HOUR,
  timeToPosition,
  positionToTime,
  isPointInRect,
  formatTimeFromDecimal,
} from './utils/timelineHelpers';

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
  // Auto-scrolling props
  autoScrollActive,
  scrollViewRef,
  timelineViewHeight,
}) => {
  // Shared animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPressed = useSharedValue(false);
  const isOverTimeline = useSharedValue(false);
  const originalPosition = useSharedValue({ x: 0, y: 0 });

  // Auto-scroll values
  const pointerPositionY = useSharedValue(0);
  const scrollDirection = useSharedValue(0);
  const scrollSpeed = useSharedValue(0);
  const rawTranslationY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const accumulatedScrollOffset = useSharedValue(0);

  // Task-specific animation value that represents its time position
  const taskTime = useSharedValue(task.startTime || MIN_HOUR);

  // Calculate height based on duration
  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = task.scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;

  // Auto-scroll logic
  useAnimatedReaction(
    () => {
      return {
        isActive: isPressed.value && (isOverTimeline.value || task.scheduled),
        pointerY: pointerPositionY.value,
        direction: scrollDirection.value,
        speed: scrollSpeed.value,
      };
    },
    (current, previous) => {
      if (current.isActive && current.direction !== 0) {
        // Apply auto-scrolling
        autoScrollActive.value = true;

        // Calculate the new scroll position
        const currentScrollY = scrollY.value;
        const scrollAmount = current.speed * current.direction;

        // Get the content height and calculate the maximum possible scroll
        const timelineHeight = 13 * 80; // HOURS.length * HOUR_HEIGHT
        const maxScrollY = Math.max(0, timelineHeight - timelineViewHeight.value);

        // Check scroll boundaries before applying scroll
        let newScrollY = currentScrollY;
        if (current.direction < 0 && currentScrollY > 0) {
          // Scrolling up is only allowed if not at the top
          newScrollY = Math.max(0, currentScrollY + scrollAmount);
        } else if (current.direction > 0 && currentScrollY < maxScrollY) {
          // Scrolling down is only allowed if not at the bottom
          newScrollY = Math.min(maxScrollY, currentScrollY + scrollAmount);
        }

        // Only scroll if there's a change in position
        if (newScrollY !== currentScrollY) {
          // Perform the scroll
          scrollTo(scrollViewRef, 0, newScrollY, false);

          if (task.scheduled) {
            // For scheduled tasks, accumulate the scroll offset
            accumulatedScrollOffset.value += newScrollY - currentScrollY;
          }
        }
      } else {
        autoScrollActive.value = false;
      }
    },
    [scrollY, timelineLayout],
  );

  // Update preview position during drag with boundary constraints
  const updatePreviewPosition = (rawPosition, isDraggingOnTimeline) => {
    'worklet';
    if (!isDraggingOnTimeline) return;

    // Calculate the total timeline height
    const timelineHeight = (21 - 8) * 80; // (MAX_HOUR - MIN_HOUR) * HOUR_HEIGHT

    // Calculate quarter position (snap to nearest quarter)
    const totalQuarters = Math.round(rawPosition / QUARTER_HEIGHT);

    // Calculate the snapped position
    let snappedPosition = totalQuarters * QUARTER_HEIGHT;

    // Calculate the maximum allowed position based on preview height
    // This ensures the end of the preview doesn't go past the end of the timeline
    const maxPosition = timelineHeight - previewHeight.value;

    // Constrain the position to stay within the timeline boundaries
    if (snappedPosition < 0) {
      // Don't allow preview to go above the start of the timeline
      snappedPosition = 0;
    } else if (snappedPosition > maxPosition) {
      // Don't allow preview to go below the end of the timeline
      snappedPosition = maxPosition;
    }

    // Update preview values
    previewPosition.value = snappedPosition;
    previewHeight.value = durationQuarters * QUARTER_HEIGHT;
    previewVisible.value = true;
  };

  // Check if near edges and should trigger auto-scroll
  const checkAutoScroll = (absoluteY, isOverTimeline) => {
    'worklet';
    if (!isOverTimeline || !timelineLayout.value) return;

    const timelineTop = timelineLayout.value.y;
    const timelineBottom = timelineTop + timelineViewHeight.value;
    const EDGE_THRESHOLD = 100; // Distance from edge to trigger auto-scroll
    const MAX_SCROLL_SPEED = 8; // Maximum scroll speed

    // Store the current pointer position for use in the animation
    pointerPositionY.value = absoluteY;

    // Check if near top edge
    if (absoluteY < timelineTop + EDGE_THRESHOLD) {
      // Near top edge, calculate scroll up speed
      const distanceFromEdge = absoluteY - timelineTop;
      const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / EDGE_THRESHOLD));

      scrollDirection.value = -1; // Scroll up
      scrollSpeed.value = MAX_SCROLL_SPEED * (1 - normalizedDistance);
    }
    // Check if near bottom edge
    else if (absoluteY > timelineBottom - EDGE_THRESHOLD) {
      // Near bottom edge, calculate scroll down speed
      const distanceFromEdge = timelineBottom - absoluteY;
      const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / EDGE_THRESHOLD));

      scrollDirection.value = 1; // Scroll down
      scrollSpeed.value = MAX_SCROLL_SPEED * (1 - normalizedDistance);
    }
    // Not near any edge
    else {
      scrollDirection.value = 0;
      scrollSpeed.value = 0;
    }
  };

  // Pan gesture with unified logic for both scheduled and unscheduled tasks
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      isPressed.value = true;
      scale.value = withSpring(task.scheduled ? 1.05 : 1.1);
      isDragging.value = true;
      isDraggingScheduled.value = task.scheduled;

      // Reset hover states
      isRemoveHovered.value = false;
      isCancelHovered.value = false;

      // Reset accumulated scroll offset
      accumulatedScrollOffset.value = 0;

      // Reset auto-scroll values
      scrollDirection.value = 0;
      scrollSpeed.value = 0;

      // Store original position for cancel action
      originalPosition.value = {
        x: event.absoluteX - event.x,
        y: event.absoluteY - event.y,
      };

      // Initialize preview for scheduled tasks
      if (task.scheduled) {
        const position = timeToPosition(taskTime.value);
        previewVisible.value = true;
        previewPosition.value = position;
        previewHeight.value = taskHeight;

        // Show ghost square at original position
        ghostVisible.value = true;
        ghostPosition.value = position;
        ghostHeight.value = taskHeight;
      } else {
        previewVisible.value = false;
      }
    })
    .onUpdate((event) => {
      // Check if hovering over remove/cancel buttons...
      const isOverRemove = isPointInRect(
        event.absoluteX,
        event.absoluteY,
        removeButtonLayout.value,
      );
      const isOverCancel = isPointInRect(
        event.absoluteX,
        event.absoluteY,
        cancelButtonLayout.value,
      );

      // Update hover states
      isRemoveHovered.value = isOverRemove;
      isCancelHovered.value = isOverCancel;

      // The crucial fix: Add accumulated scroll offset to translation
      translateX.value = event.translationX;

      if (task.scheduled) {
        // For scheduled tasks, adjust for accumulated scroll
        translateY.value = event.translationY + accumulatedScrollOffset.value;
      } else {
        // For unscheduled tasks, no adjustment needed
        translateY.value = event.translationY;
      }

      // Hide preview if hovering over any action button
      if (isOverRemove || isOverCancel) {
        previewVisible.value = false;
        scrollDirection.value = 0; // Stop auto-scrolling
      } else if (task.scheduled) {
        // Update preview position based on current task time and adjusted translation
        const basePosition = timeToPosition(taskTime.value);
        const newPosition = basePosition + translateY.value;
        updatePreviewPosition(newPosition, true);

        // Check for auto-scroll
        checkAutoScroll(event.absoluteY, true);
      } else {
        // Check if over timeline...
        if (timelineLayout && timelineLayout.value) {
          const isOver =
            event.absoluteY >= timelineLayout.value.y &&
            event.absoluteY <= timelineLayout.value.y + timelineViewHeight.value &&
            event.absoluteX >= timelineLayout.value.x &&
            event.absoluteX <= timelineLayout.value.x + timelineLayout.value.width;

          if (isOver !== isOverTimeline.value) {
            isOverTimeline.value = isOver;
            scale.value = withSpring(isOver ? 1.2 : 1.1);
          }

          // Show preview when over timeline
          if (isOver) {
            const relativePosition = event.absoluteY - timelineLayout.value.y + scrollY.value;
            updatePreviewPosition(relativePosition, true);

            // Check for auto-scroll
            checkAutoScroll(event.absoluteY, isOver);
          } else {
            previewVisible.value = false;
            scrollDirection.value = 0; // Stop auto-scrolling
          }
        }
      }
    })
    .onEnd((event) => {
      // Reset accumulated scroll offset
      accumulatedScrollOffset.value = 0;

      // Stop auto-scrolling
      scrollDirection.value = 0;
      scrollSpeed.value = 0;
      autoScrollActive.value = false;

      // Reset hover states
      isRemoveHovered.value = false;
      isCancelHovered.value = false;

      // Reset tracking values
      rawTranslationY.value = 0;
      scrollOffset.value = 0;

      // Check if drag ended over remove button
      if (isPointInRect(event.absoluteX, event.absoluteY, removeButtonLayout.value)) {
        // Unschedule task - removed from timeline
        runOnJS(onStateChange)(task.id, false, null);
        previewVisible.value = false;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        if (task.scheduled) {
          // Hide ghost square
          ghostVisible.value = false;
        } else {
          isOverTimeline.value = false;
        }
      }
      // Check if drag ended over cancel button
      else if (isPointInRect(event.absoluteX, event.absoluteY, cancelButtonLayout.value)) {
        // Cancel drag action - return to original position
        translateX.value = 0;
        translateY.value = 0;
        previewVisible.value = false;
        if (task.scheduled) {
          // Hide ghost square
          ghostVisible.value = false;
        } else {
          isOverTimeline.value = false;
        }
      } else if (task.scheduled) {
        // Calculate new time from preview position
        const newTime = positionToTime(previewPosition.value);

        // Update task's time value
        taskTime.value = newTime;

        // Update task state
        runOnJS(onStateChange)(task.id, true, newTime);

        // Reset translation since we updated the base position
        translateY.value = 0;
        translateX.value = 0;

        previewVisible.value = false;
        ghostVisible.value = false;
      } else {
        // Unscheduled task logic
        if (isOverTimeline.value) {
          // Calculate time from preview position
          const newTime = positionToTime(previewPosition.value);

          // Schedule task with the calculated time
          runOnJS(onStateChange)(task.id, true, newTime);
        } else {
          // Snap back to original position
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }

        // Hide preview
        previewVisible.value = false;
      }

      scale.value = withSpring(1);
      isPressed.value = false;
      isDragging.value = false; // Reset dragging state to hide action buttons
    });

  // Unified animated styles
  const animatedStyles = useAnimatedStyle(() => {
    if (task.scheduled) {
      // Calculate position from task time
      const position = timeToPosition(taskTime.value);

      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        height: taskHeight,
        top: position,
        zIndex: isPressed.value ? 1000 : index + 1,
        backgroundColor: '#a8e6cf',
        position: 'absolute',
        left: 0,
        right: 0,
        marginHorizontal: 5,
      };
    } else {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        opacity: opacity.value,
        width: TASK_ITEM_WIDTH,
        height: TASK_ITEM_HEIGHT,
        backgroundColor: isOverTimeline.value ? '#a8e6cf' : '#ffd3b6',
        zIndex: isPressed.value ? 1000 : 1,
      };
    }
  });

  // Render task item
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskItem, animatedStyles]}>
        <Text
          style={task.scheduled ? styles.scheduledTaskTitle : styles.taskTitle}
          numberOfLines={1}>
          {task.title}
        </Text>

        {task.scheduled ? (
          // Scheduled task details with time display
          <View style={styles.scheduledTaskDetails}>
            <Text style={styles.scheduledTaskTime}>{formatTimeFromDecimal(task.startTime)}</Text>
            <Text style={styles.scheduledTaskDuration}>{task.duration}h</Text>
          </View>
        ) : (
          // Unscheduled task just shows duration
          <Text style={styles.taskDuration}>{task.duration}h</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export default TaskItem;
