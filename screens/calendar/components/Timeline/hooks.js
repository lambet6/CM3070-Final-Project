import { useState, useCallback, useMemo } from 'react';
import {
  useSharedValue,
  withSpring,
  runOnJS,
  useAnimatedRef,
  runOnUI,
  measure,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { isPointInRect, timeToPosition, positionToTime } from './utils';
import { updatePreviewPosition, checkAutoScroll } from './animations';
import * as Haptics from 'expo-haptics';

// ========================================================================
// Layout and measurement hooks
// ========================================================================
export const useLayoutMeasurement = () => {
  const timelineLayoutRef = useAnimatedRef(null);
  const removeButtonRef = useAnimatedRef(null);
  const cancelButtonRef = useAnimatedRef(null);
  const parentViewRef = useAnimatedRef(null);

  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const parentViewLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const cancelButtonLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const removeButtonLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const timelineViewHeight = useSharedValue(0);
  const layoutChanged = useSharedValue(0);

  // Measure timeline layout
  const measureTimelineOnUI = useCallback(() => {
    'worklet';
    const measured = measureElementOnUI(timelineLayoutRef, timelineLayout);
    if (measured) {
      timelineViewHeight.value = measured.height;
    }
  }, [timelineLayoutRef, timelineLayout, timelineViewHeight]);

  // Measure parent view layout
  const measureParentViewOnUI = useCallback(() => {
    'worklet';
    measureElementOnUI(parentViewRef, parentViewLayout);
  }, [parentViewRef, parentViewLayout]);

  const measureCancelButtonOnUI = useCallback(() => {
    'worklet';
    measureElementOnUI(cancelButtonRef, cancelButtonLayout);
  }, [cancelButtonRef, cancelButtonLayout]);

  const measureRemoveButtonOnUI = useCallback(() => {
    'worklet';
    measureElementOnUI(removeButtonRef, removeButtonLayout);
  }, [removeButtonRef, removeButtonLayout]);

  // Create layout handlers using the factory
  const handleTimelineLayout = useCreateLayoutHandler(measureTimelineOnUI, layoutChanged);
  const handleParentViewLayout = useCreateLayoutHandler(measureParentViewOnUI, layoutChanged);
  const handleCancelButtonLayout = useCreateLayoutHandler(measureCancelButtonOnUI, layoutChanged);
  const handleRemoveButtonLayout = useCreateLayoutHandler(measureRemoveButtonOnUI, layoutChanged);

  return {
    timelineLayoutRef,
    removeButtonRef,
    cancelButtonRef,
    parentViewRef,
    cancelButtonLayout,
    removeButtonLayout,
    timelineLayout,
    parentViewLayout,
    timelineViewHeight,
    layoutChanged,
    handleTimelineLayout,
    handleParentViewLayout,
    handleCancelButtonLayout,
    handleRemoveButtonLayout,
  };
};

// ========================================================================
// Tooltip hook
// ========================================================================
export const useTooltip = () => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipMessage, setTooltipMessage] = useState('');

  const showTooltip = useCallback((position, message) => {
    setTooltipPosition(position);
    setTooltipMessage(message);
    setTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  return {
    tooltipVisible,
    tooltipPosition,
    tooltipMessage,
    showTooltip,
    hideTooltip,
  };
};

// ========================================================================
// Task gesture hook
// ========================================================================
/**
 * Custom hook to create and manage gesture handlers for task items
 */
export function useTaskGestures({
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
  cancelButtonLayout,
  removeButtonLayout,
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
  taskHeight,
}) {
  // Function to trigger haptic feedback
  const triggerHaptic = useCallback((type) => {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        break;
    }
  }, []);

  // Tap gesture for non-schedulable tasks
  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onStart((event) => {
        if (!onTapUnScheduled || task.scheduled) return;

        // Calculate position for the tooltip
        const position = {
          x: event.absoluteX - event.x,
          y: event.absoluteY - event.y,
        };

        // Select appropriate message based on schedulability
        const message = !isSchedulable
          ? 'This task is too long for your available time slots'
          : 'Drag to schedule this task';

        runOnJS(onTapUnScheduled)(position, message);
      }),
    [isSchedulable, onTapUnScheduled, task.scheduled],
  );

  // Handle gesture start
  const handleGestureStart = useCallback(
    (event) => {
      'worklet';
      if (onDismissTooltip) {
        runOnJS(onDismissTooltip)();
      }

      // Trigger light haptic when drag starts (after longpress)
      runOnJS(triggerHaptic)('light');

      // Update animation states
      animations.isPressed.value = true;
      animations.scale.value = withSpring(task.scheduled ? 1.05 : 1.2);
      animations.resetAnimationValues();

      // Update global states
      if (task.scheduled) {
        isDragging.value = true;
        isDraggingScheduled.value = true;
      }
      isRemoveHovered.value = false;
      isCancelHovered.value = false;

      // Set initial validity
      if (isPreviewValid) isPreviewValid.value = true;

      // Store original position
      animations.originalPosition.value = {
        x: event.absoluteX - event.x,
        y: event.absoluteY - event.y,
      };

      // Initialize preview for scheduled tasks
      if (task.scheduled) {
        const position = timeToPosition(animations.taskTime.value);
        previewVisible.value = true;
        previewPosition.value = position;
        previewHeight.value = taskHeight;

        // Show ghost at original position
        ghostVisible.value = true;
        ghostPosition.value = position;
        ghostHeight.value = taskHeight;
      } else {
        previewVisible.value = false;
      }
    },
    [
      onDismissTooltip,
      animations,
      task.scheduled,
      isDragging,
      isRemoveHovered,
      isCancelHovered,
      isPreviewValid,
      isDraggingScheduled,
      previewVisible,
      previewPosition,
      previewHeight,
      taskHeight,
      ghostVisible,
      ghostPosition,
      ghostHeight,
      triggerHaptic,
    ],
  );

  // Handle gesture end
  const handleGestureEnd = useCallback(
    (event) => {
      'worklet';
      // Reset animation values
      animations.resetAnimationValues();
      animations.scrollDirection.value = 0;
      animations.scrollSpeed.value = 0;
      autoScrollActive.value = false;
      isRemoveHovered.value = false;
      isCancelHovered.value = false;

      const isOverRemove = isPointInRect(
        event.absoluteX,
        event.absoluteY,
        removeButtonLayout.value,
      );

      const isOverCancel =
        cancelButtonLayout &&
        isPointInRect(event.absoluteX, event.absoluteY, cancelButtonLayout.value);

      // Handle ending over remove button
      if (isOverRemove) {
        runOnJS(onStateChange)(task.id, false, null);
        previewVisible.value = false;
        animations.translateX.value = withSpring(0);
        animations.translateY.value = withSpring(0);
        if (task.scheduled) {
          ghostVisible.value = false;
        } else {
          animations.isOverTimeline.value = false;
        }

        // Trigger warning haptic for removing a task
        runOnJS(triggerHaptic)('warning');
      }
      // Handle ending over cancel button
      else if (isOverCancel) {
        animations.translateX.value = 0;
        animations.translateY.value = 0;
        previewVisible.value = false;
        if (task.scheduled) {
          ghostVisible.value = false;
        } else {
          animations.isOverTimeline.value = false;
        }

        // Trigger medium haptic for canceling
        runOnJS(triggerHaptic)('medium');
      }
      // Handle task scheduling/rescheduling
      else if (task.scheduled) {
        if (isPreviewValid && isPreviewValid.value) {
          const newTime = positionToTime(previewPosition.value);
          animations.taskTime.value = newTime;
          runOnJS(onStateChange)(task.id, true, newTime);

          // Task successfully rescheduled - trigger success haptic
          runOnJS(triggerHaptic)('success');
        } else {
          // Failed to reschedule - trigger warning haptic
          runOnJS(triggerHaptic)('warning');
        }
        animations.translateY.value = 0;
        animations.translateX.value = 0;
        previewVisible.value = false;
        ghostVisible.value = false;
      }
      // Handle unscheduled task
      else {
        if (animations.isOverTimeline.value && isPreviewValid && isPreviewValid.value) {
          const newTime = positionToTime(previewPosition.value);
          runOnJS(onStateChange)(task.id, true, newTime);

          // Task successfully scheduled - trigger success haptic
          runOnJS(triggerHaptic)('success');
        } else {
          animations.translateX.value = withSpring(0);
          animations.translateY.value = withSpring(0);
          animations.isOverTimeline.value = false;

          // Failed to schedule - trigger warning haptic
          runOnJS(triggerHaptic)('warning');
        }
        previewVisible.value = false;
      }

      // Reset visual states
      animations.scale.value = withSpring(1);
      animations.isPressed.value = false;
      isDragging.value = false;
      isDraggingScheduled.value = false;
    },
    [
      animations,
      autoScrollActive,
      isRemoveHovered,
      isCancelHovered,
      removeButtonLayout,
      cancelButtonLayout,
      task.scheduled,
      task.id,
      isDragging,
      isDraggingScheduled,
      onStateChange,
      previewVisible,
      ghostVisible,
      isPreviewValid,
      previewPosition,
      triggerHaptic,
    ],
  );

  // Pan gesture with unified logic
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSchedulable)
        .activateAfterLongPress(300)
        .onStart(handleGestureStart)
        .onUpdate((event) => {
          // Check button interaction
          const { isOverRemove, isOverCancel } = handleButtonInteraction(
            event,
            removeButtonLayout.value,
            cancelButtonLayout.value,
            isRemoveHovered,
            isCancelHovered,
          );

          // Hide preview if over any buttons
          if (isOverRemove || isOverCancel) {
            previewVisible.value = false;
            animations.scrollDirection.value = 0;
            // return;
          }

          // Handle task position updates based on drag
          handleTaskMovement(event, task, animations, {
            timelineLayout,
            scrollY,
            previewPosition,
            previewVisible,
            previewHeight,
            isPreviewValid,
            validZones,
            timelineViewHeight,
            isDragging,
          });

          // Check for auto-scroll based on task type
          const shouldCheckScroll =
            task.scheduled ||
            animations.isOverTimeline.value ||
            animations.hasBeenOverTimeline.value;

          checkAutoScroll({
            absoluteY: event.absoluteY,
            shouldCheckScroll,
            timelineLayout,
            timelineViewHeight,
            pointerPositionY: animations.pointerPositionY,
            previousY: animations.previousY,
            dragStartY: animations.dragStartY,
            autoScrollIntent: animations.autoScrollIntent,
            consecutiveDirectionSamples: animations.consecutiveDirectionSamples,
            scrollDirection: animations.scrollDirection,
            scrollSpeed: animations.scrollSpeed,
          });
        })
        .onEnd(handleGestureEnd),
    [
      isSchedulable,
      handleGestureStart,
      handleGestureEnd,
      removeButtonLayout,
      cancelButtonLayout,
      isRemoveHovered,
      isCancelHovered,
      task,
      animations,
      timelineLayout,
      scrollY,
      previewPosition,
      previewVisible,
      previewHeight,
      isPreviewValid,
      validZones,
      timelineViewHeight,
      isDragging,
    ],
  );

  // Compose gesture handlers
  return useMemo(() => Gesture.Exclusive(panGesture, tapGesture), [panGesture, tapGesture]);
}

// ========================================================================
// Helper functions
// ========================================================================

// Generic measurement function for any ref
const measureElementOnUI = (ref, layoutValue) => {
  'worklet';
  try {
    const measured = measure(ref);
    if (measured) {
      layoutValue.value = {
        x: measured.pageX,
        y: measured.pageY,
        width: measured.width,
        height: measured.height,
      };
      return measured;
    }
  } catch (e) {
    console.log('Measurement error:', e);
  }
  return null;
};

// Generic layout handler factory
const useCreateLayoutHandler = (measureFn, layoutChanged) => {
  return useCallback(() => {
    if (layoutChanged) layoutChanged.value += 1;

    if (Platform.OS === 'ios') {
      requestAnimationFrame(() => {
        runOnUI(measureFn)();
      });
    } else {
      runOnUI(measureFn)();
    }
  }, [measureFn, layoutChanged]);
};

// Handle drag over buttons
const handleButtonInteraction = (
  event,
  removeButtonLayout,
  cancelButtonLayout,
  isRemoveHovered,
  isCancelHovered,
) => {
  'worklet';

  if (!removeButtonLayout || !cancelButtonLayout)
    return { isOverRemove: false, isOverCancel: false };

  const isOverRemove = isPointInRect(event.absoluteX, event.absoluteY, removeButtonLayout);
  const isOverCancel = isPointInRect(event.absoluteX, event.absoluteY, cancelButtonLayout);

  isRemoveHovered.value = isOverRemove;
  isCancelHovered.value = isOverCancel;

  return { isOverRemove, isOverCancel };
};

// Handle task movement
const handleTaskMovement = (event, task, animations, params) => {
  'worklet';
  const {
    timelineLayout,
    scrollY,
    previewPosition,
    previewVisible,
    previewHeight,
    isPreviewValid,
    validZones,
    timelineViewHeight,
    isDragging,
  } = params;

  // Update translation values
  animations.translateX.value = event.translationX;
  animations.translateY.value =
    event.translationY + (task.scheduled ? animations.accumulatedScrollOffset.value : 0);

  // Handle scheduled task movement
  if (task.scheduled) {
    const basePosition = timeToPosition(animations.taskTime.value);
    const newPosition = basePosition + animations.translateY.value;

    updatePreviewPosition(newPosition, true, {
      task,
      validZones,
      previewPosition,
      previewHeight,
      previewVisible,
      isPreviewValid,
    });
  }
  // Handle unscheduled task movement
  else if (timelineLayout && timelineLayout.value) {
    const isOver = isPointInRect(event.absoluteX, event.absoluteY, {
      ...timelineLayout.value,
      height: timelineViewHeight.value,
    });

    // Track if we've been over timeline during this gesture
    if (isOver) {
      animations.hasBeenOverTimeline.value = true;
      isDragging.value = true;
    }

    // Update scale based on whether we're over timeline
    if (isOver !== animations.isOverTimeline.value) {
      animations.isOverTimeline.value = isOver;
      animations.scale.value = withSpring(isOver ? 1.6 : 1.2);
    }

    // Show/update preview when over timeline
    if (isOver) {
      const relativePosition = event.absoluteY - timelineLayout.value.y + scrollY.value - event.y;
      updatePreviewPosition(relativePosition, true, {
        task,
        validZones,
        previewPosition,
        previewHeight,
        previewVisible,
        isPreviewValid,
      });
    } else {
      previewVisible.value = false;
    }
  }
};
