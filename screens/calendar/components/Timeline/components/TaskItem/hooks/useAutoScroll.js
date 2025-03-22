import { useAnimatedReaction, scrollTo } from 'react-native-reanimated';
import { TIMELINE_HEIGHT } from '../../../utils/timelineHelpers';

/**
 * Custom hook to handle auto-scrolling behavior for tasks
 */
export default function useAutoScroll({
  isPressed,
  isOverTimeline,
  task,
  hasBeenOverTimeline,
  pointerPositionY,
  scrollDirection,
  scrollSpeed,
  accumulatedScrollOffset,
  autoScrollActive,
  scrollY,
  timelineLayout,
  scrollViewRef,
  timelineViewHeight,
}) {
  // Auto-scroll logic
  useAnimatedReaction(
    () => {
      return {
        // Include hasBeenOverTimeline in the condition
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
        const maxScrollY = Math.max(0, TIMELINE_HEIGHT - timelineViewHeight.value);

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
}
