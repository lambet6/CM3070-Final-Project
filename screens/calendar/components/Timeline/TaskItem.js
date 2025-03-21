import React, { memo, useEffect } from 'react';
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
  HOUR_HEIGHT,
  TASK_ITEM_HEIGHT,
  TASK_ITEM_WIDTH,
  QUARTER_HEIGHT,
  MIN_HOUR,
  dateToDecimalHours,
  timeToPosition,
  positionToTime,
  isPointInRect,
  formatTimeFromDecimal,
} from './utils/timelineHelpers';

// Define snapping threshold in pixels
const SNAP_THRESHOLD = 150;

const TaskItem = ({
  task,
  index,
  events,
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
}) => {
  // Shared animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPressed = useSharedValue(false);
  const isOverTimeline = useSharedValue(false);
  const originalPosition = useSharedValue({ x: 0, y: 0 });

  // track if unscheduled task should auto-scroll
  const hasBeenOverTimeline = useSharedValue(false);

  // Auto-scroll values
  const pointerPositionY = useSharedValue(0);
  const scrollDirection = useSharedValue(0);
  const scrollSpeed = useSharedValue(0);
  const rawTranslationY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const accumulatedScrollOffset = useSharedValue(0);

  const initialDragDirection = useSharedValue(0); // 0 = undetermined, 1 = down, -1 = up
  const dragStartY = useSharedValue(0);
  const previousY = useSharedValue(0);
  const autoScrollIntent = useSharedValue(false);
  const consecutiveDirectionSamples = useSharedValue(0);
  const directionSamplesNeeded = 3; // Number of consistent direction samples need

  // Task-specific animation value that represents its time position
  const taskTime = useSharedValue(task.startTime || MIN_HOUR);

  // Calculate height based on duration
  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = task.scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;

  // Create a shared value for processed events
  const processedEvents = useSharedValue([]);

  // Process events when they change
  useEffect(() => {
    if (events) {
      const processed = events.map((event) => ({
        id: event.id,
        title: event.title,
        startTime: dateToDecimalHours(event.startDate),
        endTime: dateToDecimalHours(event.endDate),
      }));
      processedEvents.value = processed;
    }
  }, [events, processedEvents]);

  // Auto-scroll logic
  useAnimatedReaction(
    () => {
      return {
        // MODIFIED: Include hasBeenOverTimeline in the condition
        isActive:
          isPressed.value && (isOverTimeline.value || task.scheduled || hasBeenOverTimeline.value),
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

  // MODIFIED: updatePreviewPosition function with threshold-based snapping
  const updatePreviewPosition = (rawPosition, isDraggingOnTimeline) => {
    'worklet';
    if (!isDraggingOnTimeline) return;

    // Calculate task duration in pixels
    const taskDurationInPixels = task.duration * HOUR_HEIGHT;
    const durationQuarters = Math.round(task.duration * 4);
    const taskHeight = durationQuarters * QUARTER_HEIGHT;

    // Use the precomputed valid zones from props
    const zoneList = validZones || [];

    // Snap to quarter-hour increments initially
    const totalQuarters = Math.round(rawPosition / QUARTER_HEIGHT);
    const snappedPosition = totalQuarters * QUARTER_HEIGHT;

    // Check if the current position is already within a valid zone
    let isWithinValidZone = false;
    for (let i = 0; i < zoneList.length && !isWithinValidZone; i++) {
      const zone = zoneList[i];
      if (snappedPosition >= zone.start && snappedPosition <= zone.end - taskDurationInPixels) {
        isWithinValidZone = true;
      }
    }

    // If the position is already valid, use it and mark as valid
    if (isWithinValidZone) {
      previewPosition.value = snappedPosition;
      previewHeight.value = taskHeight;
      previewVisible.value = true;
      if (isPreviewValid) isPreviewValid.value = true;
      return;
    }

    // If we're not in a valid zone, find the closest valid position
    let bestPosition = 0;
    let minDistance = Infinity;
    let validPositionFound = false;

    // Iterate through all valid zones to find the closest valid position
    for (let i = 0; i < zoneList.length; i++) {
      const zone = zoneList[i];

      // Calculate possible positions within this zone
      // 1. At the start of the zone
      const startPos = zone.start;
      const startDistance = Math.abs(snappedPosition - startPos);

      // 2. At the latest possible position within the zone where task still fits
      const endPos = zone.end - taskDurationInPixels;
      const endDistance = Math.abs(snappedPosition - endPos);

      // Check if either boundary is closer than our current best
      if (startDistance < minDistance) {
        minDistance = startDistance;
        bestPosition = startPos;
        validPositionFound = true;
      }

      if (endDistance < minDistance) {
        minDistance = endDistance;
        bestPosition = endPos;
        validPositionFound = true;
      }
    }

    // If we didn't find any valid positions, default to the start of the day
    if (!validPositionFound) {
      bestPosition = 0;
      minDistance = Infinity; // Ensure we don't snap
    }

    // Only snap to the best position if it's within the threshold
    if (minDistance <= SNAP_THRESHOLD) {
      // Snap to quarter-hour increments
      const quarterSnapped = Math.round(bestPosition / QUARTER_HEIGHT) * QUARTER_HEIGHT;
      previewPosition.value = quarterSnapped;
      if (isPreviewValid) isPreviewValid.value = true;
    } else {
      // Otherwise, keep the preview at the current position (showing it's invalid)
      previewPosition.value = snappedPosition;
      if (isPreviewValid) isPreviewValid.value = false;
    }

    previewHeight.value = taskHeight;
    previewVisible.value = true;
  };

  // Determines if the user intends to auto-scroll based on direction
  const determineScrollIntent = (currentY, previousY, edgeDirection) => {
    'worklet';

    // If not near an edge, no intent
    if (edgeDirection === 0) return false;

    // Calculate the drag direction: positive = moving down, negative = moving up
    const moveDirection = currentY > previousY ? 1 : currentY < previousY ? -1 : 0;

    // If movement is in the same direction as the edge (e.g., moving down near bottom edge)
    // then the user likely intends to scroll
    return moveDirection === edgeDirection;
  };

  // Check if near edges and should trigger auto-scroll
  const checkAutoScroll = (absoluteY, shouldCheckScroll) => {
    'worklet';
    if (!shouldCheckScroll || !timelineLayout.value) return;

    const timelineTop = timelineLayout.value.y;
    const timelineBottom = timelineTop + timelineViewHeight.value;
    const EDGE_THRESHOLD = 100; // Distance from edge to trigger auto-scroll
    const MAX_SCROLL_SPEED = 8; // Maximum scroll speed

    // Store the current pointer position for use in the animation
    pointerPositionY.value = absoluteY;

    // Determine edge proximity and direction
    let nearEdgeDirection = 0; // 0 = not near edge, 1 = near bottom, -1 = near top

    // Check if near top edge
    if (absoluteY < timelineTop + EDGE_THRESHOLD) {
      nearEdgeDirection = -1; // Near top edge
    }
    // Check if near bottom edge
    else if (absoluteY > timelineBottom - EDGE_THRESHOLD) {
      nearEdgeDirection = 1; // Near bottom edge
    }

    // If the drag just started, initialize the direction tracking
    if (previousY.value === 0) {
      previousY.value = absoluteY;
      dragStartY.value = absoluteY;
      return; // Skip the first frame to establish direction
    }

    // Determine if the user intends to scroll based on their drag direction
    const hasScrollIntent = determineScrollIntent(absoluteY, previousY.value, nearEdgeDirection);

    // If direction is consistent with previous frame, increment counter
    if (hasScrollIntent && autoScrollIntent.value) {
      consecutiveDirectionSamples.value += 1;
    } else {
      consecutiveDirectionSamples.value = hasScrollIntent ? 1 : 0;
    }

    // Update intent for next frame
    autoScrollIntent.value = hasScrollIntent;

    // Store current position for next comparison
    previousY.value = absoluteY;

    // Only activate auto-scroll if we have consistent directional intent
    const shouldActivateScroll = consecutiveDirectionSamples.value >= directionSamplesNeeded;

    // Now set the scroll direction and speed based on edge proximity and intent
    if (nearEdgeDirection === -1 && shouldActivateScroll) {
      // Near top edge with intent
      const distanceFromEdge = absoluteY - timelineTop;
      const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / EDGE_THRESHOLD));

      scrollDirection.value = -1; // Scroll up
      scrollSpeed.value = MAX_SCROLL_SPEED * (1 - normalizedDistance);
    } else if (nearEdgeDirection === 1 && shouldActivateScroll) {
      // Near bottom edge with intent
      const distanceFromEdge = timelineBottom - absoluteY;
      const normalizedDistance = Math.max(0, Math.min(1, distanceFromEdge / EDGE_THRESHOLD));

      scrollDirection.value = 1; // Scroll down
      scrollSpeed.value = MAX_SCROLL_SPEED * (1 - normalizedDistance);
    } else {
      // Not near any edge or no consistent intent
      scrollDirection.value = 0;
      scrollSpeed.value = 0;
    }
  };

  // Pan gesture with unified logic for both scheduled and unscheduled tasks
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      isPressed.value = true;
      scale.value = withSpring(task.scheduled ? 1.05 : 1.2);
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

      // Reset direction tracking
      initialDragDirection.value = 0;
      dragStartY.value = 0;
      previousY.value = 0;
      autoScrollIntent.value = false;
      consecutiveDirectionSamples.value = 0;

      // Reset the hasBeenOverTimeline flag
      hasBeenOverTimeline.value = false;

      // Default to valid position initially
      if (isPreviewValid) isPreviewValid.value = true;

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

        // Check for auto-scroll (scheduled tasks always auto-scroll)
        checkAutoScroll(event.absoluteY, true);
      } else {
        // Check if over timeline...
        if (timelineLayout && timelineLayout.value) {
          const isOver =
            event.absoluteY >= timelineLayout.value.y &&
            event.absoluteY <= timelineLayout.value.y + timelineViewHeight.value &&
            event.absoluteX >= timelineLayout.value.x &&
            event.absoluteX <= timelineLayout.value.x + timelineLayout.value.width;

          // IMPORTANT: If we're over the timeline, set the flag that will persist
          if (isOver) {
            hasBeenOverTimeline.value = true;
          }

          if (isOver !== isOverTimeline.value) {
            isOverTimeline.value = isOver;
            scale.value = withSpring(isOver ? 1.6 : 1.2);
          }

          // Show preview when over timeline
          if (isOver) {
            const relativePosition = event.absoluteY - timelineLayout.value.y + scrollY.value;
            updatePreviewPosition(relativePosition, true);
          } else {
            previewVisible.value = false;
          }

          // Check for auto-scroll with updated condition
          // Once the task has been over the timeline, keep auto-scrolling active
          checkAutoScroll(event.absoluteY, isOver || hasBeenOverTimeline.value);
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

      // Reset direction tracking
      initialDragDirection.value = 0;
      dragStartY.value = 0;
      previousY.value = 0;
      autoScrollIntent.value = false;
      consecutiveDirectionSamples.value = 0;

      // Reset the flag for the next drag
      hasBeenOverTimeline.value = false;

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
        // Only update if position is valid
        if (isPreviewValid && isPreviewValid.value) {
          // Calculate new time from preview position
          const newTime = positionToTime(previewPosition.value);

          // Update task's time value
          taskTime.value = newTime;

          // Update task state
          runOnJS(onStateChange)(task.id, true, newTime);
        }

        // Reset translation since we updated the base position
        translateY.value = 0;
        translateX.value = 0;

        previewVisible.value = false;
        ghostVisible.value = false;
      } else {
        // Unscheduled task logic
        if (isOverTimeline.value && isPreviewValid && isPreviewValid.value) {
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
        width: TASK_ITEM_WIDTH / 2, // Make width half the original size
        height: TASK_ITEM_HEIGHT / 2, // Make height half the original size
        backgroundColor: isOverTimeline.value ? '#a8e6cf' : '#ffd3b6',
        zIndex: isPressed.value ? 1000 : 1,
        padding: 5, // Smaller padding for the reduced size
      };
    }
  });

  // Render task item
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskItem, animatedStyles]}>
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
