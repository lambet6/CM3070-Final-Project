import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { withSpring, runOnJS } from 'react-native-reanimated';
import { isPointInRect, timeToPosition, positionToTime } from '../../../utils/timelineHelpers';
import { updatePreviewPosition } from '../utils/previewUtils';
import { checkAutoScroll } from '../utils/autoScrollUtils';
import { TASK_ITEM_HEIGHT } from '../../../utils/timelineHelpers';

/**
 * Custom hook to create and manage gesture handlers for task items
 */
export default function useTaskGestures({
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
  // Tap gesture for non-schedulable tasks - now memoized
  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onStart((event) => {
        // Calculate position for the tooltip
        const position = {
          x: event.absoluteX - event.x,
          y: event.absoluteY - event.y,
        };
        if (!isSchedulable && onTapUnScheduled) {
          // Call the handler with position info
          runOnJS(onTapUnScheduled)(
            position,
            'This task is too long for your available time slots',
          );
        } else if (isSchedulable && onTapUnScheduled) {
          runOnJS(onTapUnScheduled)(position, 'Drag to schedule this task');
        }
      }),
    [isSchedulable, onTapUnScheduled, taskHeight],
  );

  // Pan gesture with unified logic - now memoized
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSchedulable) // Disable gesture if not schedulable
        .onStart((event) => {
          if (onDismissTooltip) {
            runOnJS(onDismissTooltip)();
          }

          animations.isPressed.value = true;
          animations.scale.value = withSpring(task.scheduled ? 1.05 : 1.2);
          isDragging.value = true;
          isDraggingScheduled.value = task.scheduled;

          // Reset hover states
          isRemoveHovered.value = false;
          isCancelHovered.value = false;

          // Reset all animation values
          animations.resetAnimationValues();

          // Default to valid position initially
          if (isPreviewValid) isPreviewValid.value = true;

          // Store original position for cancel action
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
          animations.translateX.value = event.translationX;

          if (task.scheduled) {
            // For scheduled tasks, adjust for accumulated scroll
            animations.translateY.value =
              event.translationY + animations.accumulatedScrollOffset.value;
          } else {
            // For unscheduled tasks, no adjustment needed
            animations.translateY.value = event.translationY;
          }

          // Hide preview if hovering over any action button
          if (isOverRemove || isOverCancel) {
            previewVisible.value = false;
            animations.scrollDirection.value = 0; // Stop auto-scrolling
          } else if (task.scheduled) {
            // Update preview position based on current task time and adjusted translation
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

            // Check for auto-scroll (scheduled tasks always auto-scroll)
            checkAutoScroll({
              absoluteY: event.absoluteY,
              shouldCheckScroll: true,
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
          } else {
            // Check if over timeline...
            if (timelineLayout && timelineLayout.value) {
              const isOver =
                event.absoluteY >= timelineLayout.value.y &&
                event.absoluteY <= timelineLayout.value.y + timelineViewHeight.value &&
                event.absoluteX >= timelineLayout.value.x &&
                event.absoluteX <= timelineLayout.value.x + timelineLayout.value.width;

              // If we're over the timeline, set the flag that will persist
              if (isOver) {
                animations.hasBeenOverTimeline.value = true;
              }

              if (isOver !== animations.isOverTimeline.value) {
                animations.isOverTimeline.value = isOver;
                animations.scale.value = withSpring(isOver ? 1.6 : 1.2);
              }

              // Show preview when over timeline
              if (isOver) {
                // Adjust the relative position by subtracting the offset
                const relativePosition =
                  event.absoluteY - timelineLayout.value.y + scrollY.value - event.y;

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

              // Check for auto-scroll with updated condition
              // Once the task has been over the timeline, keep auto-scrolling active
              checkAutoScroll({
                absoluteY: event.absoluteY,
                shouldCheckScroll: isOver || animations.hasBeenOverTimeline.value,
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
            }
          }
        })
        .onEnd((event) => {
          // Reset all animation values
          animations.resetAnimationValues();

          // Stop auto-scrolling
          animations.scrollDirection.value = 0;
          animations.scrollSpeed.value = 0;
          autoScrollActive.value = false;

          // Reset hover states
          isRemoveHovered.value = false;
          isCancelHovered.value = false;

          // Check if drag ended over remove button
          if (isPointInRect(event.absoluteX, event.absoluteY, removeButtonLayout.value)) {
            // Unschedule task - removed from timeline
            runOnJS(onStateChange)(task.id, false, null);
            previewVisible.value = false;
            animations.translateX.value = withSpring(0);
            animations.translateY.value = withSpring(0);
            if (task.scheduled) {
              // Hide ghost square
              ghostVisible.value = false;
            } else {
              animations.isOverTimeline.value = false;
            }
          }
          // Check if drag ended over cancel button
          else if (isPointInRect(event.absoluteX, event.absoluteY, cancelButtonLayout.value)) {
            // Cancel drag action - return to original position
            animations.translateX.value = 0;
            animations.translateY.value = 0;
            previewVisible.value = false;
            if (task.scheduled) {
              // Hide ghost square
              ghostVisible.value = false;
            } else {
              animations.isOverTimeline.value = false;
            }
          } else if (task.scheduled) {
            // Only update if position is valid
            if (isPreviewValid && isPreviewValid.value) {
              // Calculate new time from preview position
              const newTime = positionToTime(previewPosition.value);

              // Update task's time value
              animations.taskTime.value = newTime;

              // Update task state
              runOnJS(onStateChange)(task.id, true, newTime);
            }

            // Reset translation since we updated the base position
            animations.translateY.value = 0;
            animations.translateX.value = 0;

            previewVisible.value = false;
            ghostVisible.value = false;
          } else {
            // Unscheduled task logic
            if (animations.isOverTimeline.value && isPreviewValid && isPreviewValid.value) {
              // Calculate time from preview position
              const newTime = positionToTime(previewPosition.value);

              // Schedule task with the calculated time
              runOnJS(onStateChange)(task.id, true, newTime);
            } else {
              // Snap back to original position
              animations.translateX.value = withSpring(0);
              animations.translateY.value = withSpring(0);
              // Reset the timeline flag so the color changes back
              animations.isOverTimeline.value = false;
            }

            // Hide preview
            previewVisible.value = false;
          }

          animations.scale.value = withSpring(1);
          animations.isPressed.value = false;
          isDragging.value = false; // Reset dragging state to hide action buttons
        }),
    [
      isSchedulable,
      onDismissTooltip,
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
      timelineLayout,
      timelineViewHeight,
      scrollY,
      validZones,
      onStateChange,
      autoScrollActive,
      removeButtonLayout,
      cancelButtonLayout,
      taskHeight,
    ],
  );

  // Compose pan and tap gestures - also memoized
  return useMemo(() => Gesture.Exclusive(panGesture, tapGesture), [panGesture, tapGesture]);
}
