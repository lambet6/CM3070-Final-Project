import { QUARTER_HEIGHT, HOUR_HEIGHT } from '../../../utils/timelineHelpers';

// Define snapping threshold in pixels
export const SNAP_THRESHOLD = 150;

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
  if (minDistance <= SNAP_THRESHOLD) {
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
