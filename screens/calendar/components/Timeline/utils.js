import { Dimensions } from 'react-native';

// ========================================================================
// Constants
// ========================================================================
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const HOUR_HEIGHT = 80;
export const QUARTER_HEIGHT = HOUR_HEIGHT / 4;
export const TASK_ITEM_HEIGHT = 75;
export const TASK_ITEM_WIDTH = 120;
export const TIMELINE_OFFSET = SCREEN_WIDTH * 0.25;
export const MIN_HOUR = 8; // 8 AM
export const MAX_HOUR = 21; // 9 PM
export const TIMELINE_HEIGHT = 13 * HOUR_HEIGHT;
export const QUARTERS = ['00', '15', '30', '45'];

export const HOURS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  // 12 PM is noon, hours after noon are PM
  return hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
});

// ========================================================================
// Time conversion helpers
// ========================================================================
export const dateToDecimalHours = (date) => {
  return date.getHours() + date.getMinutes() / 60;
};

// Helper function to format time from decimal hour
export const formatTimeFromDecimal = (decimalHour) => {
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Conversion functions between time and position
export const timeToPosition = (time) => {
  'worklet';
  return (time - MIN_HOUR) * HOUR_HEIGHT;
};

export const positionToTime = (position) => {
  'worklet';
  const totalQuarters = Math.round(position / QUARTER_HEIGHT);
  return MIN_HOUR + totalQuarters / 4;
};

// Helper function to check if a point is inside a rectangle
export const isPointInRect = (pointX, pointY, rect) => {
  'worklet';
  return (
    rect &&
    pointX >= rect.x &&
    pointX <= rect.x + rect.width &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.height
  );
};

export const minutesToHours = (minutes) => minutes / 60;

export const dateToHours = (date) => {
  if (!date) return null;
  return date.getHours() + date.getMinutes() / 60;
};

export const hoursToDate = (hours, selectedDate) => {
  if (hours === null) return null;
  const date = new Date(selectedDate);
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  date.setHours(wholeHours, minutes, 0, 0);
  return date;
};

// ========================================================================
// Event layout utilities
// ========================================================================
// Function for handling overlaps
export const calculateEventLayout = (events) => {
  if (!events.length) return new Map();

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Find overlapping event clusters
  const clusters = [];
  const eventToClusterMap = new Map();

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const eventStartTime = new Date(event.startDate).getTime();
    const eventEndTime = new Date(event.endDate).getTime();

    // Find all overlapping events
    const overlappingEvents = sortedEvents.filter((otherEvent, otherIndex) => {
      if (otherEvent.id === event.id) return false;

      const otherStartTime = new Date(otherEvent.startDate).getTime();
      const otherEndTime = new Date(otherEvent.endDate).getTime();

      return eventStartTime < otherEndTime && eventEndTime > otherStartTime;
    });

    if (overlappingEvents.length === 0) {
      // This event doesn't overlap with any other - it gets full width
      continue;
    }

    // Check if this event already belongs to a cluster
    const existingClusterIndex = eventToClusterMap.get(event.id);

    if (existingClusterIndex !== undefined) {
      // Add all overlapping events to this existing cluster
      const cluster = clusters[existingClusterIndex];

      overlappingEvents.forEach((overlappingEvent) => {
        if (!cluster.includes(overlappingEvent.id)) {
          cluster.push(overlappingEvent.id);
          eventToClusterMap.set(overlappingEvent.id, existingClusterIndex);
        }
      });
    } else {
      // Create a new cluster with this event and all its overlapping events
      const newCluster = [event.id, ...overlappingEvents.map((e) => e.id)];
      const clusterIndex = clusters.length;
      clusters.push(newCluster);

      // Map all events in this cluster to the cluster index
      newCluster.forEach((eventId) => {
        eventToClusterMap.set(eventId, clusterIndex);
      });
    }
  }

  // Process each cluster to assign columns
  const eventLayoutMap = new Map();

  // First, assign all non-clustered events to full width
  sortedEvents.forEach((event) => {
    if (!eventToClusterMap.has(event.id)) {
      eventLayoutMap.set(event.id, {
        isFullWidth: true,
        width: 100,
        leftPosition: 0,
      });
    }
  });

  // Then process each cluster
  clusters.forEach((cluster, clusterIndex) => {
    const clusterEvents = cluster
      .map((eventId) => sortedEvents.find((e) => e.id === eventId))
      .filter(Boolean);

    // Create cluster columns
    const columns = [];

    // Assign columns within this cluster
    clusterEvents
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .forEach((event) => {
        const eventStartTime = new Date(event.startDate).getTime();
        const eventEndTime = new Date(event.endDate).getTime();

        // Find the first available column
        let columnIndex = 0;
        while (true) {
          // Check if this column is already taken
          const isColumnTaken = columns[columnIndex]?.some((existingEvent) => {
            const existingStartTime = new Date(existingEvent.startDate).getTime();
            const existingEndTime = new Date(existingEvent.endDate).getTime();

            // Check if events overlap in time
            return eventStartTime < existingEndTime && eventEndTime > existingStartTime;
          });

          if (!isColumnTaken) break;
          columnIndex++;
        }

        // Initialize column array if it doesn't exist
        if (!columns[columnIndex]) {
          columns[columnIndex] = [];
        }

        // Add event to this column
        columns[columnIndex].push(event);

        // Store column assignment for this event
        eventLayoutMap.set(event.id, {
          column: columnIndex,
          isFullWidth: false,
        });
      });

    // Calculate width and left position for each event in this cluster
    const columnCount = columns.length;

    clusterEvents.forEach((event) => {
      const layout = eventLayoutMap.get(event.id);
      const column = layout.column;

      eventLayoutMap.set(event.id, {
        ...layout,
        columnCount,
        width: 100 / columnCount,
        leftPosition: (column * 100) / columnCount,
      });
    });
  });

  return eventLayoutMap;
};

// ========================================================================
// Zone calculation utilities
// ========================================================================
export const calculateInvalidZones = (eventsData) => {
  const zones = eventsData.map((event) => ({
    start: timeToPosition(dateToDecimalHours(event.startDate)),
    end: timeToPosition(dateToDecimalHours(event.endDate)),
  }));

  // Sort by start time
  return zones.sort((a, b) => a.start - b.start);
};

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

export const computeValidZonesByDuration = (tasks, invalidZones) => {
  const uniqueDurations = [...new Set(tasks.map((task) => task.duration))];
  const result = {};

  uniqueDurations.forEach((duration) => {
    result[duration] = calculateValidZonesForDuration(duration, invalidZones);
  });

  return result;
};
