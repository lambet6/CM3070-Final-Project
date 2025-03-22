// Function to calculate event layout for handling overlaps
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
