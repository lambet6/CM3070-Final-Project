import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import { useAnimatedRef, useScrollViewOffset, useAnimatedReaction } from 'react-native-reanimated';
import { dateToHours, hoursToDate, minutesToHours, SCREEN_HEIGHT } from './utils';
import { useTimelineStyles } from './styles';

// Import refactored utilities
import { calculateEventLayout } from './utils';
import { calculateInvalidZones, computeValidZonesByDuration } from './utils';

// Import custom hooks
import { useTooltip, useLayoutMeasurement } from './hooks';
import { useDragAnimations } from './animations';

// Import UI components
import { UnscheduledTasksSection, TimelineContent, Tooltip } from './components';

// Import task store and manager
import { useTaskStore } from '../../../../store/taskStore';
import { useTaskManager } from '../../../../hooks/useTaskManager';
// Import calendar store
import { useCalendarStore } from '../../../../store/calendarStore';
import { Divider } from 'react-native-paper';

const TimelineComponent = ({ selectedDate }) => {
  // Get task manager for updating tasks
  const taskManager = useTaskManager();

  // Use a ref to track previous selectedDate to prevent unnecessary renders
  const previousDateRef = useRef(null);

  // Track if we're currently in the process of updating tasks
  const isUpdatingRef = useRef(false);

  // Get all tasks from the store to reduce selector recalculations
  const allTasks = useTaskStore((state) => state.tasks);

  // Get all calendar events
  const allEvents = useCalendarStore((state) => state.events);

  // Get tasks for the selected date directly from the store with caching
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return useTaskStore.getState().getTasksOnDate(selectedDate);
  }, [selectedDate, allTasks]);

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

  useEffect(() => {
    const currentDateString = selectedDate ? selectedDate.toDateString() : null;
    const prevDateString = previousDateRef.current ? previousDateRef.current.toDateString() : null;

    if (currentDateString !== prevDateString) {
      previousDateRef.current = selectedDate;
    }
  }, [tasksForSelectedDate, eventsForSelectedDate, selectedDate, allTasks]);

  // Task state for the timeline
  const [tasks, setTasks] = useState([]);

  // Convert tasks from store format to timeline format when tasksForSelectedDate changes
  useEffect(() => {
    // Skip if we're already in the middle of an update
    if (isUpdatingRef.current) return;

    const newTasks = tasksForSelectedDate.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      duration: minutesToHours(task.duration),
      scheduled: !!task.scheduledTime,
      startTime: dateToHours(task.scheduledTime),
      completed: task.completed,
    }));

    setTasks(newTasks);
  }, [tasksForSelectedDate, selectedDate, allTasks]);

  // Filter tasks by completion status
  const uncompletedTasks = useMemo(() => {
    return tasks.filter((task) => !task.completed);
  }, [tasks]);

  // Filter tasks for unscheduled tasks section (uncompleted & unscheduled)
  const unscheduledTasks = useMemo(() => {
    return uncompletedTasks.filter((task) => !task.scheduled);
  }, [uncompletedTasks]);

  // Filter tasks for timeline (scheduled tasks, both completed and uncompleted)
  const scheduledTasks = useMemo(() => {
    return tasks.filter((task) => task.scheduled);
  }, [tasks]);

  // Set up hooks
  const { tooltipVisible, tooltipPosition, tooltipMessage, showTooltip, hideTooltip } =
    useTooltip();

  const dragAnimationValues = useDragAnimations();

  const {
    timelineLayoutRef,
    removeButtonRef,
    cancelButtonRef,
    cancelButtonLayout,
    removeButtonLayout,
    timelineLayout,
    timelineViewHeight,
    handleTimelineLayout,
    layoutChanged,
    parentViewRef,
    parentViewLayout,
    handleParentViewLayout,
    handleCancelButtonLayout,
    handleRemoveButtonLayout,
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
        // We don't need to measure buttons anymore
      }
    },
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
              originalTask.duration,
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

  const handleTaskCompletion = useCallback(
    async (taskId) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        // First update local state for immediate feedback
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
        );

        // Find the original task in tasksForSelectedDate
        const originalTask = tasksForSelectedDate.find((task) => task.id === taskId);

        if (originalTask) {
          console.log('Toggling task completion:', originalTask.title, originalTask.completed);
          try {
            // Edit the task with the task manager
            await taskManager.toggleTaskCompletion(taskId);
          } catch (error) {
            console.error('Failed to update task completion:', error);
          }
        }
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [tasksForSelectedDate, taskManager],
  );

  const styles = useTimelineStyles();

  // Group layout values for passing to subcomponents
  const layoutValues = {
    timelineLayout,
    timelineViewHeight,
    cancelButtonLayout,
    removeButtonLayout,
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
        tasks={unscheduledTasks}
        onStateChange={handleTaskStateChange}
        scrollY={scrollY}
        timelineLayout={timelineLayout}
        dragAnimationValues={dragAnimationValues}
        layoutValues={layoutValues}
        validZonesByDuration={validZonesByDuration}
        onTapUnScheduled={showTooltip}
        onDismissTooltip={hideTooltip}
        scrollViewRef={scrollViewRef}
        removeButtonRef={removeButtonRef}
        cancelButtonRef={cancelButtonRef}
        isRemoveHovered={dragAnimationValues.isRemoveHovered}
        isCancelHovered={dragAnimationValues.isCancelHovered}
        handleRemoveButtonLayout={handleRemoveButtonLayout}
        handleCancelButtonLayout={handleCancelButtonLayout}
      />

      {/* Timeline */}
      <TimelineContent
        scrollViewRef={scrollViewRef}
        timelineLayoutRef={timelineLayoutRef}
        handleTimelineLayout={handleTimelineLayout}
        tasks={scheduledTasks}
        events={eventsForSelectedDate}
        eventLayoutMap={eventLayoutMap}
        dragAnimationValues={dragAnimationValues}
        layoutValues={layoutValues}
        onStateChange={handleTaskStateChange}
        onTaskComplete={handleTaskCompletion}
        scrollY={scrollY}
        validZonesByDuration={validZonesByDuration}
        onTapUnScheduled={showTooltip}
        onDismissTooltip={hideTooltip}
      />
    </View>
  );
};

export default TimelineComponent;
