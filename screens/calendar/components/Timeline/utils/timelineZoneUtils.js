import { HOUR_HEIGHT, timeToPosition, dateToDecimalHours, HOURS } from './timelineHelpers';

// Calculate invalid zones from events
export const calculateInvalidZones = (eventsData) => {
  const zones = eventsData.map((event) => ({
    start: timeToPosition(dateToDecimalHours(event.startDate)),
    end: timeToPosition(dateToDecimalHours(event.endDate)),
  }));

  // Sort by start time
  return zones.sort((a, b) => a.start - b.start);
};

// Calculate valid zones for a specific task duration
export const calculateValidZonesForDuration = (taskDuration, invalidZones) => {
  const taskDurationInPixels = taskDuration * HOUR_HEIGHT;
  const timelineHeight = HOURS.length * HOUR_HEIGHT; // Total timeline height

  const validZones = [];

  // Check if we can fit at the beginning of the day
  if (invalidZones.length === 0 || invalidZones[0].start >= taskDurationInPixels) {
    validZones.push({
      start: 0,
      end: invalidZones.length === 0 ? timelineHeight : invalidZones[0].start,
    });
  }

  // Check gaps between events
  for (let i = 0; i < invalidZones.length - 1; i++) {
    const currentZone = invalidZones[i];
    const nextZone = invalidZones[i + 1];
    const gapSize = nextZone.start - currentZone.end;

    if (gapSize >= taskDurationInPixels) {
      validZones.push({
        start: currentZone.end,
        end: nextZone.start,
      });
    }
  }

  // Check if we can fit at the end of the day
  if (
    invalidZones.length === 0 ||
    invalidZones[invalidZones.length - 1].end + taskDurationInPixels <= timelineHeight
  ) {
    const lastEventEnd = invalidZones.length === 0 ? 0 : invalidZones[invalidZones.length - 1].end;
    validZones.push({
      start: lastEventEnd,
      end: timelineHeight,
    });
  }

  return validZones;
};

// Compute valid zones for all tasks with unique durations
export const computeValidZonesByDuration = (tasks, invalidZones) => {
  const uniqueDurations = [...new Set(tasks.map((task) => task.duration))];
  const result = {};

  uniqueDurations.forEach((duration) => {
    result[duration] = calculateValidZonesForDuration(duration, invalidZones);
  });

  return result;
};
