import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import {
  useAnimatedRef,
  useScrollViewOffset,
  useSharedValue,
  useAnimatedReaction,
  runOnUI,
  measure,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Icon, MD3Colors } from 'react-native-paper';

import styles from './styles';
import TaskItem from './TaskItem';
import EventItem from './EventItem'; // Import the new EventItem component
import { TimelineIndicator, GhostSquare } from './TimelineIndicator';
import DragActionButtons from './DragActionButtons';
import Tooltip from './ToolTip'; // Import the Tooltip component
import {
  INITIAL_TASKS,
  INITIAL_EVENTS, // Import the events data
  HOURS,
  QUARTERS,
  HOUR_HEIGHT,
  QUARTER_HEIGHT,
  SCREEN_HEIGHT,
  timeToPosition,
  dateToDecimalHours,
} from './utils/timelineHelpers';
import { BaseButton } from 'react-native-gesture-handler';

// Function to calculate event layout for handling overlaps
const calculateEventLayout = (events) => {
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

const TimelineComponent = () => {
  // Single array of tasks
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  // We don't need state for events since they're fixed and not interactive
  const events = useMemo(() => INITIAL_EVENTS, []);

  // Calculate event layout to handle overlapping events
  const eventLayoutMap = useMemo(() => calculateEventLayout(events), [events]);

  // Add tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipMessage, setTooltipMessage] = useState('');

  const scrollViewRef = useAnimatedRef();
  const timelineLayoutRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);
  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const layoutChanged = useSharedValue(0);

  // Shared value for the visible timeline height (may be less than total height)
  const timelineViewHeight = useSharedValue(0);

  // Auto-scroll active flag
  const autoScrollActive = useSharedValue(false);

  // Preview animation values
  const previewVisible = useSharedValue(false);
  const previewPosition = useSharedValue(0);
  const previewHeight = useSharedValue(0);
  const ghostVisible = useSharedValue(false);
  const ghostPosition = useSharedValue(0);
  const ghostHeight = useSharedValue(0);

  // NEW: Add shared value to track if preview position is valid
  const isPreviewValid = useSharedValue(true);

  // Drag action buttons related values
  const isDragging = useSharedValue(false);
  const isDraggingScheduled = useSharedValue(false);
  const removeButtonRef = useAnimatedRef();
  const cancelButtonRef = useAnimatedRef();
  const removeButtonLayout = useSharedValue(null);
  const cancelButtonLayout = useSharedValue(null);

  // New shared values for button hover states
  const isRemoveHovered = useSharedValue(false);
  const isCancelHovered = useSharedValue(false);

  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  // Function to toggle unscheduled tasks expansion
  const toggleTasksExpanded = useCallback(() => {
    setIsTasksExpanded((prev) => !prev);
  }, []);

  // Function to show tooltip for non-schedulable tasks
  const showTooltip = useCallback((position, message) => {
    setTooltipPosition(position);
    setTooltipMessage(message);
    setTooltipVisible(true);
  }, []);

  // Function to hide tooltip
  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  // Effect to update timelineViewHeight after layout
  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, we can use window height as an approximation
      timelineViewHeight.value = SCREEN_HEIGHT * 0.85; // Assuming timeline is 85% of screen height
    }
  }, [timelineViewHeight]);

  // Measure buttons layout
  const measureButtons = useCallback(() => {
    'worklet';
    try {
      const removeMeasured = measure(removeButtonRef);
      const cancelMeasured = measure(cancelButtonRef);

      if (removeMeasured) {
        removeButtonLayout.value = {
          x: removeMeasured.pageX,
          y: removeMeasured.pageY,
          width: removeMeasured.width,
          height: removeMeasured.height,
        };
      }

      if (cancelMeasured) {
        cancelButtonLayout.value = {
          x: cancelMeasured.pageX,
          y: cancelMeasured.pageY,
          width: cancelMeasured.width,
          height: cancelMeasured.height,
        };
      }
    } catch (e) {
      console.log('Button measurement error:', e);
    }
  }, [removeButtonRef, cancelButtonRef, removeButtonLayout, cancelButtonLayout]);

  // Handle button layout - now this will be called for each individual button
  const handleButtonLayout = useCallback(() => {
    if (Platform.OS === 'ios') {
      requestAnimationFrame(() => {
        runOnUI(measureButtons)();
      });
    } else {
      runOnUI(measureButtons)();
    }
  }, [measureButtons]);

  // Measure timeline layout
  const measureTimelineOnUI = useCallback(() => {
    'worklet';
    try {
      const measured = measure(timelineLayoutRef);
      if (measured) {
        timelineLayout.value = {
          x: measured.pageX,
          y: measured.pageY,
          width: measured.width,
          height: measured.height,
        };

        // Update the visible height of the timeline
        timelineViewHeight.value = measured.height;
      }
    } catch (e) {
      console.log('Measurement error:', e);
    }
  }, [timelineLayoutRef, timelineLayout, timelineViewHeight]);

  // Handle layout events
  const handleTimelineLayout = useCallback(
    (event) => {
      layoutChanged.value += 1;
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          runOnUI(measureTimelineOnUI)();
        });
      } else {
        runOnUI(measureTimelineOnUI)();
      }
    },
    [measureTimelineOnUI, layoutChanged],
  );

  // Animated reaction to layout changes
  useAnimatedReaction(
    () => layoutChanged.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        measureTimelineOnUI();
      }
    },
    [measureTimelineOnUI],
  );

  useAnimatedReaction(
    () => ({
      isDragging: isDragging.value,
      isDraggingScheduled: isDraggingScheduled.value,
    }),
    (current, previous) => {
      if (
        !previous ||
        current.isDragging !== previous.isDragging ||
        current.isDraggingScheduled !== previous.isDraggingScheduled
      ) {
        measureButtons();
      }
    },
    [measureButtons],
  );

  // Task state change handler
  const handleTaskStateChange = useCallback((taskId, isScheduled, newStartTime) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, scheduled: isScheduled, startTime: isScheduled ? newStartTime : null }
          : task,
      ),
    );
  }, []);

  // Calculate invalid zones from events
  const calculateInvalidZones = useCallback((eventsData) => {
    const zones = eventsData.map((event) => ({
      start: timeToPosition(dateToDecimalHours(event.startDate)),
      end: timeToPosition(dateToDecimalHours(event.endDate)),
    }));

    // Sort by start time
    return zones.sort((a, b) => a.start - b.start);
  }, []);

  // Pre-compute invalid zones once when events change
  const invalidZones = useMemo(
    () => calculateInvalidZones(events),
    [events, calculateInvalidZones],
  );

  // NEW: Calculate valid zones for a specific task duration
  const calculateValidZonesForDuration = useCallback(
    (taskDuration) => {
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
        const lastEventEnd =
          invalidZones.length === 0 ? 0 : invalidZones[invalidZones.length - 1].end;
        validZones.push({
          start: lastEventEnd,
          end: timelineHeight,
        });
      }

      return validZones;
    },
    [invalidZones],
  );

  // NEW: Precompute valid zones for all unique task durations
  const validZonesByDuration = useMemo(() => {
    const uniqueDurations = [...new Set(tasks.map((task) => task.duration))];
    const result = {};

    uniqueDurations.forEach((duration) => {
      result[duration] = calculateValidZonesForDuration(duration);
    });

    return result;
  }, [tasks, calculateValidZonesForDuration]);

  // Render hour markers
  const hourMarkers = useMemo(() => {
    return HOURS.flatMap((hour, hourIndex) => {
      const markers = [
        <View key={`hour-${hourIndex}`} style={styles.hourContainer}>
          <Text style={styles.hourText}>{hour}</Text>
          <View style={styles.hourLine} />
        </View>,
      ];
      if (hourIndex < HOURS.length - 1) {
        markers.push(
          ...QUARTERS.slice(1).map((quarter, qIndex) => (
            <View
              key={`hour-${hourIndex}-q-${qIndex}`}
              style={[
                styles.quarterContainer,
                { top: hourIndex * HOUR_HEIGHT + (qIndex + 1) * QUARTER_HEIGHT },
              ]}>
              <Text style={styles.quarterText}>{quarter}</Text>
              <View style={styles.quarterLine} />
            </View>
          )),
        );
      }
      return markers;
    });
  }, []);

  const scheduledTasks = useMemo(() => tasks.filter((task) => task.scheduled), [tasks]);

  // Render the UI
  return (
    <View style={styles.container}>
      {/* Tooltip for non-schedulable tasks */}
      <Tooltip
        message={tooltipMessage}
        position={tooltipPosition}
        isVisible={tooltipVisible}
        onDismiss={hideTooltip}
      />

      {/* Unscheduled Tasks Area */}
      <View style={styles.unscheduledArea}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <View
          style={
            isTasksExpanded
              ? styles.unscheduledTasksContainerExpanded
              : styles.unscheduledTasksContainer
          }>
          {tasks
            .filter((task) => !task.scheduled)
            .map((task, idx) => {
              const hasValidZones = validZonesByDuration[task.duration]?.length > 0;
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={idx}
                  onStateChange={handleTaskStateChange}
                  scrollY={scrollY}
                  timelineLayout={timelineLayout}
                  previewVisible={previewVisible}
                  previewPosition={previewPosition}
                  previewHeight={previewHeight}
                  isDragging={isDragging}
                  isDraggingScheduled={isDraggingScheduled}
                  removeButtonLayout={removeButtonLayout}
                  cancelButtonLayout={cancelButtonLayout}
                  isRemoveHovered={isRemoveHovered}
                  isCancelHovered={isCancelHovered}
                  autoScrollActive={autoScrollActive}
                  scrollViewRef={scrollViewRef}
                  timelineViewHeight={timelineViewHeight}
                  validZones={validZonesByDuration[task.duration]}
                  isPreviewValid={isPreviewValid}
                  isSchedulable={hasValidZones}
                  onTapUnScheduled={(position, message) => showTooltip(position, message)}
                  onDismissTooltip={hideTooltip}
                />
              );
            })}
        </View>
        <BaseButton
          style={styles.expandButton}
          onPress={() => setIsTasksExpanded(!isTasksExpanded)}>
          <Text style={styles.expandButtonText}>{isTasksExpanded ? '∧' : '∨'}</Text>
        </BaseButton>
      </View>

      {/* Timeline */}
      <Animated.View
        ref={timelineLayoutRef}
        style={styles.timelineContainer}
        onLayout={handleTimelineLayout}>
        <Animated.ScrollView ref={scrollViewRef} scrollEventThrottle={16}>
          <View style={styles.timelineSideBar}>{hourMarkers}</View>
          <View style={styles.timelineContent}>
            {/* Fixed events - render before tasks so they appear behind tasks */}
            {events.map((event) => (
              <EventItem key={event.id} event={event} layout={eventLayoutMap.get(event.id)} />
            ))}

            {/* Preview component*/}
            <TimelineIndicator
              visible={previewVisible}
              position={previewPosition}
              height={previewHeight}
              isValid={isPreviewValid}
              style={{
                borderRadius: 8,
                borderWidth: 2,
              }}
            />

            {/* Ghost square component */}
            <GhostSquare visible={ghostVisible} position={ghostPosition} height={ghostHeight} />

            {scheduledTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onStateChange={handleTaskStateChange}
                scrollY={scrollY}
                timelineLayout={timelineLayout}
                previewVisible={previewVisible}
                previewPosition={previewPosition}
                previewHeight={previewHeight}
                isDragging={isDragging}
                isDraggingScheduled={isDraggingScheduled}
                removeButtonLayout={removeButtonLayout}
                cancelButtonLayout={cancelButtonLayout}
                ghostVisible={ghostVisible}
                ghostPosition={ghostPosition}
                ghostHeight={ghostHeight}
                isRemoveHovered={isRemoveHovered}
                isCancelHovered={isCancelHovered}
                autoScrollActive={autoScrollActive}
                scrollViewRef={scrollViewRef}
                timelineViewHeight={timelineViewHeight}
                validZones={validZonesByDuration[task.duration]}
                isPreviewValid={isPreviewValid}
                onTapUnScheduled={(position, message) => showTooltip(position, message)}
                onDismissTooltip={hideTooltip}
              />
            ))}
          </View>
        </Animated.ScrollView>
      </Animated.View>

      {/* Cancel and Remove Buttons */}
      <DragActionButtons
        isVisible={isDragging}
        isDraggingScheduled={isDraggingScheduled}
        removeButtonRef={removeButtonRef}
        cancelButtonRef={cancelButtonRef}
        onLayoutChange={handleButtonLayout}
        isRemoveHovered={isRemoveHovered}
        isCancelHovered={isCancelHovered}
      />
    </View>
  );
};

export default TimelineComponent;
