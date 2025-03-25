import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import { useAnimatedRef, useScrollViewOffset, useAnimatedReaction } from 'react-native-reanimated';
import { dateToHours, hoursToDate, minutesToHours, SCREEN_HEIGHT } from './utils';
import styles from './styles';

// Import refactored utilities
import { calculateEventLayout } from './utils';
import { calculateInvalidZones, computeValidZonesByDuration } from './utils';

// Import custom hooks
import { useTooltip, useLayoutMeasurement } from './hooks';
import { useDragAnimations } from './animations';

// Import UI components
import { UnscheduledTasksSection, TimelineContent, DragActionButtons, Tooltip } from './components';

// Import task store and manager
import { useTaskStore } from '../../../../store/taskStore';
import { useTaskManager } from '../../../../hooks/useTaskManager';
// Import calendar store
import { useCalendarStore } from '../../../../store/calendarStore';

const TimelineComponent = ({ selectedDate }) => {
  // Get task manager for updating tasks
  const taskManager = useTaskManager();

  // Use a ref to track previous selectedDate to prevent unnecessary renders
  const previousDateRef = useRef(null);

  // Track if we're currently in the process of updating tasks
  const isUpdatingRef = useRef(false);

  // Get all tasks from the store to reduce selector recalculations
  const allTasks = useTaskStore((state) => state.tasks);
  const taskMapCache = useRef({});

  // Get all calendar events
  const allEvents = useCalendarStore((state) => state.events);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    // Convert selected date to string key (use ISO format for consistency)
    const dateKey = selectedDate.toISOString().split('T')[0];

    // Check if we already have this date cached
    if (taskMapCache.current[dateKey]) {
      console.log('Using cached tasks for date:', dateKey);
      return taskMapCache.current[dateKey];
    }

    console.log('Fetching tasks for date:', dateKey);

    // Get tasks for date using the store method (which has good error handling)
    const tasks = useTaskStore.getState().getTasksOnDate(selectedDate);

    // Store in cache for future use
    taskMapCache.current[dateKey] = tasks;

    return tasks;
  }, [selectedDate]);

  useEffect(() => {
    // Get the currently selected date key
    if (!selectedDate) return;
    const dateKey = selectedDate.toISOString().split('T')[0];

    // Update the cache for current date only
    const tasks = useTaskStore.getState().getTasksOnDate(selectedDate);
    taskMapCache.current[dateKey] = tasks;

    // limit cache size to prevent memory issues (keep last 10 dates)
    const keys = Object.keys(taskMapCache.current);
    if (keys.length > 10) {
      const oldestKey = keys[0];
      const newCache = { ...taskMapCache.current };
      delete newCache[oldestKey];
      taskMapCache.current = newCache;
    }
  }, [allTasks, selectedDate]);

  // Memoize events for selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate || !allEvents || allEvents.length === 0) return [];

    const selectedDateString = selectedDate.toDateString();

    return allEvents.filter((event) => {
      try {
        // Convert event startDate to same-day comparison
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === selectedDateString;
      } catch (e) {
        console.error('Error comparing dates in eventsForSelectedDate filter', e);
        return false;
      }
    });
  }, [allEvents, selectedDate]);

  // Only log when tasks or events actually change
  useEffect(() => {
    const currentDateString = selectedDate ? selectedDate.toDateString() : null;
    const prevDateString = previousDateRef.current ? previousDateRef.current.toDateString() : null;

    if (currentDateString !== prevDateString) {
      console.log('Tasks for selected date:', tasksForSelectedDate);
      console.log('Events for selected date:', eventsForSelectedDate);
      previousDateRef.current = selectedDate;
    }
  }, [tasksForSelectedDate, eventsForSelectedDate, selectedDate]);

  // Task state for the timeline
  const [tasks, setTasks] = useState([]);

  // Convert tasks from store format to timeline format when tasksForSelectedDate changes
  useEffect(() => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;

    const newTasks = tasksForSelectedDate.map((task) => ({
      id: task.id,
      title: `${task.title} (${task.priority})`, // Include priority in title for visibility
      duration: minutesToHours(task.duration), // Convert minutes to hours
      scheduled: !!task.scheduledTime,
      startTime: dateToHours(task.scheduledTime),
    }));

    // Only update if tasks have changed
    const areTasksEqual = JSON.stringify(tasks) === JSON.stringify(newTasks);

    if (!areTasksEqual) {
      setTasks(newTasks);
    }
  }, [tasksForSelectedDate, tasks]);

  // Set up hooks
  const { tooltipVisible, tooltipPosition, tooltipMessage, showTooltip, hideTooltip } =
    useTooltip();

  const dragAnimationValues = useDragAnimations();

  const {
    timelineLayoutRef,
    removeButtonRef,
    cancelButtonRef,
    timelineLayout,
    removeButtonLayout,
    cancelButtonLayout,
    timelineViewHeight,
    handleTimelineLayout,
    handleButtonLayout,
    measureButtons,
    layoutChanged,
    parentViewRef,
    parentViewLayout,
    handleParentViewLayout,
  } = useLayoutMeasurement();

  // Scroll handling
  const scrollViewRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);

  // Calculate event layout with memoization to prevent unnecessary recalculations
  const eventLayoutMap = useMemo(
    () => calculateEventLayout(eventsForSelectedDate),
    [eventsForSelectedDate],
  );

  // Calculate invalid and valid zones based on calendar events for the selected date
  const invalidZones = useMemo(
    () => calculateInvalidZones(eventsForSelectedDate),
    [eventsForSelectedDate],
  );

  // Calculate valid zones for task scheduling that don't conflict with events
  const validZonesByDuration = useMemo(
    () => computeValidZonesByDuration(tasks, invalidZones),
    [tasks, invalidZones],
  );

  // Effect to update timelineViewHeight after layout
  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, we can use window height as an approximation
      timelineViewHeight.value = SCREEN_HEIGHT * 0.85;
    }
  }, [timelineViewHeight]);

  // Set up animation reaction for layout changes
  useAnimatedReaction(
    () => layoutChanged.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        measureButtons();
      }
    },
    [measureButtons],
  );

  // Set up animation reaction for button measurements
  useAnimatedReaction(
    () => ({
      isDragging: dragAnimationValues.isDragging.value,
      isDraggingScheduled: dragAnimationValues.isDraggingScheduled.value,
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

  // Updated task state change handler that uses task manager
  const handleTaskStateChange = useCallback(
    async (taskId, isScheduled, newStartTime) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        // First update the local state for immediate feedback
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, scheduled: isScheduled, startTime: isScheduled ? newStartTime : null }
              : task,
          ),
        );

        // Find the original task in the tasks for the selected date
        const originalTask = tasksForSelectedDate.find((task) => task.id === taskId);

        // If we found the task, update it using the task manager
        if (originalTask) {
          console.log('Updating task:', originalTask.title, 'to scheduled:', isScheduled);
          try {
            // Convert start time to Date or null
            const scheduledTime = isScheduled ? hoursToDate(newStartTime, selectedDate) : null;

            // Edit the task with the task manager
            await taskManager.editExistingTask(
              taskId,
              originalTask.title,
              originalTask.priority,
              originalTask.dueDate,
              originalTask.duration, // Keep original duration in minutes
              scheduledTime,
            );
          } catch (error) {
            console.error('Failed to update task:', error);
          }
        }
      } finally {
        // Always reset the updating flag
        isUpdatingRef.current = false;
      }
    },
    [tasksForSelectedDate, selectedDate, taskManager],
  );

  // Group layout values for passing to subcomponents
  const layoutValues = {
    timelineLayout,
    removeButtonLayout,
    cancelButtonLayout,
    timelineViewHeight,
  };

  // Render the UI
  return (
    <View style={styles.container} ref={parentViewRef} onLayout={handleParentViewLayout}>
      {/* Tooltip */}
      <Tooltip
        message={tooltipMessage}
        position={tooltipPosition}
        isVisible={tooltipVisible}
        onDismiss={hideTooltip}
        parentViewLayout={parentViewLayout}
      />

      {/* Unscheduled Tasks Area */}
      <UnscheduledTasksSection
        tasks={tasks}
        onStateChange={handleTaskStateChange}
        scrollY={scrollY}
        timelineLayout={timelineLayout}
        dragAnimationValues={dragAnimationValues}
        layoutValues={layoutValues}
        validZonesByDuration={validZonesByDuration}
        onTapUnScheduled={showTooltip}
        onDismissTooltip={hideTooltip}
        scrollViewRef={scrollViewRef}
      />

      {/* Timeline */}
      <TimelineContent
        scrollViewRef={scrollViewRef}
        timelineLayoutRef={timelineLayoutRef}
        handleTimelineLayout={handleTimelineLayout}
        tasks={tasks}
        events={eventsForSelectedDate}
        eventLayoutMap={eventLayoutMap}
        dragAnimationValues={dragAnimationValues}
        layoutValues={layoutValues}
        onStateChange={handleTaskStateChange}
        scrollY={scrollY}
        validZonesByDuration={validZonesByDuration}
        onTapUnScheduled={showTooltip}
        onDismissTooltip={hideTooltip}
      />

      {/* Cancel and Remove Buttons */}
      <DragActionButtons
        isVisible={dragAnimationValues.isDragging}
        isDraggingScheduled={dragAnimationValues.isDraggingScheduled}
        removeButtonRef={removeButtonRef}
        cancelButtonRef={cancelButtonRef}
        onLayoutChange={handleButtonLayout}
        isRemoveHovered={dragAnimationValues.isRemoveHovered}
        isCancelHovered={dragAnimationValues.isCancelHovered}
      />
    </View>
  );
};

export default TimelineComponent;
