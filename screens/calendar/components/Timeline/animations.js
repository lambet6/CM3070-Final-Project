/**
 * TimelineView/animations.js
 *
 * This file contains all animation-related code for the Timeline feature.
 * It includes shared animation values, styles, and utility functions used
 * across various timeline components.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  scrollTo,
  runOnJS,
} from 'react-native-reanimated';

import {
  HOUR_HEIGHT,
  QUARTER_HEIGHT,
  TASK_ITEM_HEIGHT,
  TASK_ITEM_WIDTH,
  MIN_HOUR,
  timeToPosition,
  TIMELINE_HEIGHT,
} from './utils';
import { useTheme } from 'react-native-paper';

// ========================================================================
// MODULE: ANIMATION CONSTANTS
// ========================================================================

const AnimationConstants = {
  /**
   * Standard animation durations in milliseconds
   */
  DURATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  /**
   * Spring animation configuration presets
   */
  SPRING_PRESETS: {
    BOUNCY: {
      damping: 10,
      stiffness: 150,
      mass: 1,
    },
    GENTLE: {
      damping: 20,
      stiffness: 100,
      mass: 1,
    },
    RIGID: {
      damping: 30,
      stiffness: 300,
      mass: 1,
    },
  },

  /**
   * Auto-scroll related constants
   */
  SCROLL: {
    EDGE_THRESHOLD: 100, // Distance from edge to trigger auto-scroll
    MAX_SCROLL_SPEED: 8, // Maximum scroll speed
    DIRECTION_SAMPLES_NEEDED: 3, // Consecutive samples needed to start auto-scrolling
    SNAP_THRESHOLD: 150, // Snapping threshold in pixels
  },
};

// ========================================================================
// MODULE: DRAG & PREVIEW ANIMATIONS
// ========================================================================

/**
 * Creates and manages all shared values related to dragging and preview states
 */
export const useDragAnimations = () => {
  // Drag state
  const isDragging = useSharedValue(false);
  const isDraggingScheduled = useSharedValue(false);

  // Preview state
  const previewVisible = useSharedValue(false);
  const previewPosition = useSharedValue(0);
  const previewHeight = useSharedValue(0);
  const isPreviewValid = useSharedValue(true);

  // Ghost state (original position indicator)
  const ghostVisible = useSharedValue(false);
  const ghostPosition = useSharedValue(0);
  const ghostHeight = useSharedValue(0);

  // Hover states for action buttons
  const isRemoveHovered = useSharedValue(false);
  const isCancelHovered = useSharedValue(false);

  // Auto-scroll state
  const autoScrollActive = useSharedValue(false);

  return {
    // Drag state values
    isDragging,
    isDraggingScheduled,

    // Preview values
    previewVisible,
    previewPosition,
    previewHeight,
    isPreviewValid,

    // Ghost values
    ghostVisible,
    ghostPosition,
    ghostHeight,

    // Hover states
    isRemoveHovered,
    isCancelHovered,

    // Auto-scroll state
    autoScrollActive,
  };
};

/**
 * Creates animated styles for the timeline indicator (preview of task placement)
 */
export const useTimelineIndicatorStyle = (visible, position, height, style, isValid) => {
  const theme = useTheme();
  return useAnimatedStyle(() => {
    // Dynamic styling based on position validity
    const validStyle = {
      backgroundColor: 'rgba(0, 123, 255, 0.4)',
      borderColor: 'rgba(0, 123, 255, 0.6)',
    };

    const invalidStyle = {
      backgroundColor: 'rgba(255, 0, 0, 0.4)',
      borderColor: 'rgba(255, 0, 0, 0.6)',
    };

    // Apply color based on validity
    const colorStyle = isValid && isValid.value ? validStyle : invalidStyle;

    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 1 : 0,
      zIndex: 500,
      borderRadius: 8,
      borderWidth: 2,
      ...colorStyle,
      ...style,
    };
  });
};

/**
 * Creates animated styles for the ghost square (original position indicator)
 */
export const useGhostSquareStyle = (visible, position, height, style) => {
  return useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 0.5 : 0,
      zIndex: 400,
      backgroundColor: 'rgba(156, 156, 156, 0.43)',
      borderRadius: 8,
      ...style,
    };
  });
};

/**
 * Updates the preview position with threshold-based snapping to valid zones
 */
export const updatePreviewPosition = (
  rawPosition,
  isDraggingOnTimeline,
  { task, validZones, previewPosition, previewHeight, previewVisible, isPreviewValid },
) => {
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
  if (minDistance <= AnimationConstants.SCROLL.SNAP_THRESHOLD) {
    // Snap to quarter-hour increments
    const quarterSnapped = Math.round(bestPosition / QUARTER_HEIGHT) * QUARTER_HEIGHT;
    previewPosition.value = quarterSnapped;
    if (isPreviewValid) isPreviewValid.value = true;
  } else {
    // Otherwise, keep the preview at the current position (showing it's invalid)
    // BUT constrain it within the timeline boundaries
    const timelineHeight = 13 * HOUR_HEIGHT; // HOURS.length * HOUR_HEIGHT
    const constrainedPosition = Math.max(0, Math.min(timelineHeight - taskHeight, snappedPosition));
    previewPosition.value = constrainedPosition;
    if (isPreviewValid) isPreviewValid.value = false;
  }

  previewHeight.value = taskHeight;
  previewVisible.value = true;
};

// ========================================================================
// MODULE: TASK ANIMATIONS
// ========================================================================

/**
 * Creates and manages animation values for individual task items
 */
export const useTaskAnimations = (task) => {
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
};

// ========================================================================
// MODULE: UI COMPONENT ANIMATIONS
// ========================================================================

/**
 * Creates animated styles for drag action buttons
 */
export const useDragActionButtonsStyles = (isRemoveHovered, isCancelHovered) => {
  const theme = useTheme();
  // Cancel button style
  const cancelButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: isCancelHovered.value ? theme.colors.onPrimary : 'transparent',
  }));

  // Remove button style
  const removeButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: isRemoveHovered.value ? theme.colors.onPrimary : 'transparent',
  }));

  // Text styles
  const removeButtonTextStyle = useAnimatedStyle(() => ({
    color: isRemoveHovered.value ? theme.colors.primary : theme.colors.onPrimary,
  }));

  const cancelButtonTextStyle = useAnimatedStyle(() => ({
    color: isCancelHovered.value ? theme.colors.primary : theme.colors.onPrimary,
  }));

  return {
    cancelButtonStyle,
    removeButtonStyle,
    removeButtonTextStyle,
    cancelButtonTextStyle,
  };
};

/**
 * Creates animated styles for the tooltip
 */
export const useTooltipStyles = (
  tooltipWidth,
  tooltipHeight,
  position,
  arrowPosition,
  hasLayout,
  parentViewLayout,
  screenWidth,
) => {
  // Main tooltip style
  const tooltipStyle = useAnimatedStyle(() => {
    // Calculate offsets based on actual dimensions
    const horizontalOffset = tooltipWidth.value / 2;
    const verticalOffset = tooltipHeight.value / 2 + TASK_ITEM_HEIGHT / 2;

    // Default positions (when no parentViewLayout is available)
    let tooltipX = position.x - horizontalOffset; // Center tooltip horizontally
    let tooltipY = position.y - verticalOffset; // Position above finger

    // If parentViewLayout is available, adjust position
    if (parentViewLayout) {
      const parentLayout = parentViewLayout.value;
      if (parentLayout) {
        // Adjust tooltip position based on parent view layout
        tooltipX = position.x - horizontalOffset + TASK_ITEM_WIDTH / 4;
        tooltipY = position.y - parentLayout.y - verticalOffset;
      }
    }

    // Calculate the center point for the arrow before boundary adjustments
    const targetX = tooltipX + horizontalOffset;

    // Ensure tooltip stays within screen boundaries
    // Horizontal boundaries
    const rightEdge = tooltipX + tooltipWidth.value;
    if (rightEdge > screenWidth - 10) {
      tooltipX = screenWidth - tooltipWidth.value - 10; // 10px padding from edge
    }
    if (tooltipX < 10) {
      tooltipX = 10; // 10px padding from left edge
    }

    // Set arrow position relative to the tooltip's adjusted position
    arrowPosition.value = targetX - tooltipX;

    return {
      position: 'absolute',
      left: tooltipX,
      top: tooltipY,
      opacity: hasLayout ? 1 : 0,
    };
  });

  // Arrow style
  const arrowStyle = useAnimatedStyle(() => ({
    left: arrowPosition.value - 10, // -10 to center the 20px wide arrow
  }));

  return {
    tooltipStyle,
    arrowStyle,
  };
};

// ========================================================================
// MODULE: AUTO-SCROLL ANIMATIONS
// ========================================================================

/**
 * Determines if the user intends to auto-scroll based on direction
 */
export const determineScrollIntent = (currentY, previousY, edgeDirection) => {
  'worklet';

  // If not near an edge, no intent
  if (edgeDirection === 0) return false;

  // Calculate the drag direction: positive = moving down, negative = moving up
  const moveDirection = currentY > previousY ? 1 : currentY < previousY ? -1 : 0;

  // If movement is in the same direction as the edge (e.g., moving down near bottom edge)
  // then the user likely intends to scroll
  return moveDirection === edgeDirection;
};

/**
 * Check if near edges and should trigger auto-scroll
 */
export const checkAutoScroll = ({
  absoluteY,
  shouldCheckScroll,
  timelineLayout,
  timelineViewHeight,
  pointerPositionY,
  previousY,
  dragStartY,
  autoScrollIntent,
  consecutiveDirectionSamples,
  scrollDirection,
  scrollSpeed,
  directionSamplesNeeded = AnimationConstants.SCROLL.DIRECTION_SAMPLES_NEEDED,
}) => {
  'worklet';
  if (!shouldCheckScroll || !timelineLayout.value) return;

  const timelineTop = timelineLayout.value.y;
  const timelineBottom = timelineTop + timelineViewHeight.value;

  // Store the current pointer position for use in the animation
  pointerPositionY.value = absoluteY;

  // Determine edge proximity and direction
  let nearEdgeDirection = 0; // 0 = not near edge, 1 = near bottom, -1 = near top

  // Check if near top edge
  if (absoluteY < timelineTop + AnimationConstants.SCROLL.EDGE_THRESHOLD) {
    nearEdgeDirection = -1; // Near top edge
  }
  // Check if near bottom edge
  else if (absoluteY > timelineBottom - AnimationConstants.SCROLL.EDGE_THRESHOLD) {
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
    const normalizedDistance = Math.max(
      0,
      Math.min(1, distanceFromEdge / AnimationConstants.SCROLL.EDGE_THRESHOLD),
    );

    scrollDirection.value = -1; // Scroll up
    scrollSpeed.value = AnimationConstants.SCROLL.MAX_SCROLL_SPEED * (1 - normalizedDistance);
  } else if (nearEdgeDirection === 1 && shouldActivateScroll) {
    // Near bottom edge with intent
    const distanceFromEdge = timelineBottom - absoluteY;
    const normalizedDistance = Math.max(
      0,
      Math.min(1, distanceFromEdge / AnimationConstants.SCROLL.EDGE_THRESHOLD),
    );

    scrollDirection.value = 1; // Scroll down
    scrollSpeed.value = AnimationConstants.SCROLL.MAX_SCROLL_SPEED * (1 - normalizedDistance);
  } else {
    // Not near any edge or no consistent intent
    scrollDirection.value = 0;
    scrollSpeed.value = 0;
  }
};

/**
 * Sets up auto-scrolling behavior for tasks
 */
export const useAutoScroll = ({
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
}) => {
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
};
