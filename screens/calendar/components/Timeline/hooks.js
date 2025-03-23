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
  const isOverRemove = isPointInRect(event.absoluteX, event.absoluteY, removeButtonLayout.value);
  const isOverCancel = isPointInRect(event.absoluteX, event.absoluteY, cancelButtonLayout.value);

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
    if (isOver) animations.hasBeenOverTimeline.value = true;

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

// ========================================================================
// Layout and measurement hooks
// ========================================================================
export const useLayoutMeasurement = () => {
  const timelineLayoutRef = useAnimatedRef();
  const removeButtonRef = useAnimatedRef();
  const cancelButtonRef = useAnimatedRef();
  const parentViewRef = useAnimatedRef();

  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const removeButtonLayout = useSharedValue(null);
  const cancelButtonLayout = useSharedValue(null);
  const parentViewLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
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

  // Measure buttons layout
  const measureButtons = useCallback(() => {
    'worklet';
    measureElementOnUI(removeButtonRef, removeButtonLayout);
    measureElementOnUI(cancelButtonRef, cancelButtonLayout);
  }, [removeButtonRef, cancelButtonRef, removeButtonLayout, cancelButtonLayout]);

  // Measure parent view layout
  const measureParentViewOnUI = useCallback(() => {
    'worklet';
    measureElementOnUI(parentViewRef, parentViewLayout);
  }, [parentViewRef, parentViewLayout]);

  // Create layout handlers using the factory
  const handleTimelineLayout = useCreateLayoutHandler(measureTimelineOnUI, layoutChanged);
  const handleButtonLayout = useCreateLayoutHandler(measureButtons);
  const handleParentViewLayout = useCreateLayoutHandler(measureParentViewOnUI, layoutChanged);

  return {
    timelineLayoutRef,
    removeButtonRef,
    cancelButtonRef,
    parentViewRef,
    timelineLayout,
    removeButtonLayout,
    cancelButtonLayout,
    parentViewLayout,
    timelineViewHeight,
    layoutChanged,
    handleTimelineLayout,
    handleButtonLayout,
    handleParentViewLayout,
    measureButtons,
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
  taskHeight,
}) {
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
    [isSchedulable, onTapUnScheduled],
  );

  // Handle gesture start
  const handleGestureStart = useCallback(
    (event) => {
      'worklet';
      if (onDismissTooltip) {
        runOnJS(onDismissTooltip)();
      }

      // Update animation states
      animations.isPressed.value = true;
      animations.scale.value = withSpring(task.scheduled ? 1.05 : 1.2);
      animations.resetAnimationValues();

      // Update global states
      isDragging.value = true;
      isDraggingScheduled.value = task.scheduled;
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
      animations,
      task,
      isDragging,
      isDraggingScheduled,
      isRemoveHovered,
      isCancelHovered,
      previewVisible,
      previewPosition,
      previewHeight,
      ghostVisible,
      ghostPosition,
      ghostHeight,
      isPreviewValid,
      onDismissTooltip,
      taskHeight,
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
      const isOverCancel = isPointInRect(
        event.absoluteX,
        event.absoluteY,
        cancelButtonLayout.value,
      );

      // Handle ending over remove button
      if (isOverRemove) {
        runOnJS(onStateChange)(task.id, false, null);
        previewVisible.value = false;
        animations.translateX.value = withSpring(0);
        animations.translateY.value = withSpring(0);
        task.scheduled ? (ghostVisible.value = false) : (animations.isOverTimeline.value = false);
      }
      // Handle ending over cancel button
      else if (isOverCancel) {
        animations.translateX.value = 0;
        animations.translateY.value = 0;
        previewVisible.value = false;
        task.scheduled ? (ghostVisible.value = false) : (animations.isOverTimeline.value = false);
      }
      // Handle task scheduling/rescheduling
      else if (task.scheduled) {
        if (isPreviewValid && isPreviewValid.value) {
          const newTime = positionToTime(previewPosition.value);
          animations.taskTime.value = newTime;
          runOnJS(onStateChange)(task.id, true, newTime);
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
        } else {
          animations.translateX.value = withSpring(0);
          animations.translateY.value = withSpring(0);
          animations.isOverTimeline.value = false;
        }
        previewVisible.value = false;
      }

      // Reset visual states
      animations.scale.value = withSpring(1);
      animations.isPressed.value = false;
      isDragging.value = false;
    },
    [
      animations,
      task,
      previewVisible,
      previewPosition,
      ghostVisible,
      isDragging,
      removeButtonLayout,
      cancelButtonLayout,
      isPreviewValid,
      onStateChange,
      isRemoveHovered,
      isCancelHovered,
      autoScrollActive,
    ],
  );

  // Pan gesture with unified logic
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSchedulable)
        .onStart(handleGestureStart)
        .onUpdate((event) => {
          // Check button interaction
          const { isOverRemove, isOverCancel } = handleButtonInteraction(
            event,
            removeButtonLayout,
            cancelButtonLayout,
            isRemoveHovered,
            isCancelHovered,
          );

          // Hide preview if over any buttons
          if (isOverRemove || isOverCancel) {
            previewVisible.value = false;
            animations.scrollDirection.value = 0;
            return;
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
      animations,
      task,
      removeButtonLayout,
      cancelButtonLayout,
      isRemoveHovered,
      isCancelHovered,
      previewVisible,
      previewPosition,
      previewHeight,
      timelineLayout,
      timelineViewHeight,
      scrollY,
      validZones,
      isPreviewValid,
    ],
  );

  // Compose gesture handlers
  return useMemo(() => Gesture.Exclusive(panGesture, tapGesture), [panGesture, tapGesture]);
}
