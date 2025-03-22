/**
 * Utility functions for managing timeline auto-scrolling
 */

// Determines if the user intends to auto-scroll based on direction
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

// Check if near edges and should trigger auto-scroll
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
  directionSamplesNeeded = 3,
}) => {
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
