import { useSharedValue } from 'react-native-reanimated';
import { MIN_HOUR } from '../utils/timelineHelpers';

/**
 * Custom hook to manage all animation-related shared values for task items
 */
export default function useTaskAnimations(task) {
  // Basic task animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPressed = useSharedValue(false);
  const isOverTimeline = useSharedValue(false);
  const originalPosition = useSharedValue({ x: 0, y: 0 });
  const hasBeenOverTimeline = useSharedValue(false);

  // Auto-scroll related values
  const pointerPositionY = useSharedValue(0);
  const scrollDirection = useSharedValue(0);
  const scrollSpeed = useSharedValue(0);
  const rawTranslationY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const accumulatedScrollOffset = useSharedValue(0);
  const initialDragDirection = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const previousY = useSharedValue(0);
  const autoScrollIntent = useSharedValue(false);
  const consecutiveDirectionSamples = useSharedValue(0);

  // Task-specific animation value
  const taskTime = useSharedValue(task.startTime || MIN_HOUR);

  // Reset all animation values
  const resetAnimationValues = () => {
    'worklet';
    accumulatedScrollOffset.value = 0;
    scrollDirection.value = 0;
    scrollSpeed.value = 0;
    initialDragDirection.value = 0;
    dragStartY.value = 0;
    previousY.value = 0;
    autoScrollIntent.value = false;
    consecutiveDirectionSamples.value = 0;
    hasBeenOverTimeline.value = false;
    rawTranslationY.value = 0;
    scrollOffset.value = 0;
  };

  return {
    // Basic animation values
    translateX,
    translateY,
    scale,
    opacity,
    isPressed,
    isOverTimeline,
    originalPosition,
    hasBeenOverTimeline,

    // Auto-scroll values
    pointerPositionY,
    scrollDirection,
    scrollSpeed,
    rawTranslationY,
    scrollOffset,
    accumulatedScrollOffset,
    initialDragDirection,
    dragStartY,
    previousY,
    autoScrollIntent,
    consecutiveDirectionSamples,

    // Task-specific values
    taskTime,

    // Helper functions
    resetAnimationValues,
  };
}
