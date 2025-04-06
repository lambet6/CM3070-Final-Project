import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import {
  useAnimatedRef,
  useScrollViewOffset,
  useAnimatedReaction,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { dateToHours, hoursToDate, minutesToHours, SCREEN_HEIGHT } from './utils';
import { useTimelineStyles } from './styles';

// Utilities and helper functions
import { calculateEventLayout } from './utils';
import { calculateInvalidZones, computeValidZonesByDuration } from './utils';

// Custom hooks
import { useTooltip, useLayoutMeasurement } from './hooks';
import { useDragAnimations } from './animations';

// UI components
import { UnscheduledTasksSection, TimelineContent, Tooltip } from './components';

// State management
import { useTaskStore } from '../../../../store/taskStore';
import { useTaskManager } from '../../../../hooks/useTaskManager';
import { useCalendarStore } from '../../../../store/calendarStore';

/**
 * Timeline Component
 *
 * Displays a time-based view of tasks and calendar events for a selected date.
 * Allows for drag and drop scheduling of tasks and completion status updates.
 */
const TimelineComponent = ({ selectedDate, setIsScrolled }) => {
  const styles = useTimelineStyles();
  const taskManager = useTaskManager();

  // Refs for tracking state and preventing redundant operations
  const previousDateRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // ======== Data Fetching and Processing ========

  // Get tasks for the selected date from store
  const tasksForSelectedDate = useTaskStore(
    useCallback(
      (state) => {
        if (!selectedDate) return [];
        return state.getTasksOnDate(selectedDate);
      },
      [selectedDate],
    ),
  );

  // Get all calendar events from store
  const allEvents = useCalendarStore((state) => state.events);

  // Filter events for the selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate || !allEvents || allEvents.length === 0) return [];

    const selectedDateString = selectedDate.toDateString();

    return allEvents.filter((event) => {
      try {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === selectedDateString;
      } catch (e) {
        console.error('Error comparing dates in eventsForSelectedDate filter', e);
        return false;
      }
    });
  }, [allEvents, selectedDate]);

  // Update previous date ref on date change
  useEffect(() => {
    const currentDateString = selectedDate ? selectedDate.toDateString() : null;
    const prevDateString = previousDateRef.current ? previousDateRef.current.toDateString() : null;

    if (currentDateString !== prevDateString) {
      previousDateRef.current = selectedDate;
    }
  }, [tasksForSelectedDate, eventsForSelectedDate, selectedDate]);

  // ======== Task State Management ========

  // Local task state for the timeline
  const [tasks, setTasks] = useState([]);

  // Transform tasks from store format to timeline format
  useEffect(() => {
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
  }, [tasksForSelectedDate]);

  // Derived task lists
  const uncompletedTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);

  const unscheduledTasks = useMemo(
    () => uncompletedTasks.filter((task) => !task.scheduled),
    [uncompletedTasks],
  );

  const scheduledTasks = useMemo(() => tasks.filter((task) => task.scheduled), [tasks]);

  // ======== UI Hooks Setup ========

  // Tooltip state and handlers
  const { tooltipVisible, tooltipPosition, tooltipMessage, showTooltip, hideTooltip } =
    useTooltip();

  // Animation values for drag interactions
  const dragAnimationValues = useDragAnimations();

  // Layout measurement for positioning and interactions
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

  // ======== Scroll Handling ========

  const scrollViewRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);

  // Track scroll position for parent component
  const isScrolledValue = useDerivedValue(() => scrollY.value > 10);

  useAnimatedReaction(
    () => isScrolledValue.value,
    (isCurrentlyScrolled, wasScrolled) => {
      if (isCurrentlyScrolled !== wasScrolled) {
        runOnJS(setIsScrolled)(!isCurrentlyScrolled);
      }
    },
  );

  // ======== Layout Calculations ========

  // Calculate positions for events in the timeline
  const eventLayoutMap = useMemo(
    () => calculateEventLayout(eventsForSelectedDate),
    [eventsForSelectedDate],
  );

  // Calculate time zones that are unavailable due to existing events
  const invalidZones = useMemo(
    () => calculateInvalidZones(eventsForSelectedDate),
    [eventsForSelectedDate],
  );

  // Calculate available time slots for tasks of different durations
  const validZonesByDuration = useMemo(
    () => computeValidZonesByDuration(tasks, invalidZones),
    [tasks, invalidZones],
  );

  // Set timeline height for web platform
  useEffect(() => {
    if (Platform.OS === 'web') {
      timelineViewHeight.value = SCREEN_HEIGHT * 0.85;
    }
  }, [timelineViewHeight]);

  // Monitor layout changes
  useAnimatedReaction(
    () => layoutChanged.value,
    (currentValue, previousValue) => {
      if (currentValue !== previousValue) {
        // Layout has changed - additional actions could be performed here
      }
    },
  );

  // ======== Task Update Handlers ========

  /**
   * Updates a task's scheduled state and time
   *
   * @param {string} taskId - ID of the task to update
   * @param {boolean} isScheduled - Whether the task is now scheduled
   * @param {number} newStartTime - Start time in hours (if scheduled)
   */
  const handleTaskStateChange = useCallback(
    async (taskId, isScheduled, newStartTime) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        // Update local state for immediate UI feedback
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, scheduled: isScheduled, startTime: isScheduled ? newStartTime : null }
              : task,
          ),
        );

        // Find the original task
        const originalTask = tasksForSelectedDate.find((task) => task.id === taskId);

        if (originalTask) {
          try {
            // Convert hours to Date object or null
            const scheduledTime = isScheduled ? hoursToDate(newStartTime, selectedDate) : null;

            // Persist changes via task manager
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
        isUpdatingRef.current = false;
      }
    },
    [tasksForSelectedDate, selectedDate, taskManager],
  );

  /**
   * Toggles a task's completion status
   *
   * @param {string} taskId - ID of the task to toggle
   */
  const handleTaskCompletion = useCallback(
    async (taskId) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        // Update local state for immediate UI feedback
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
        );

        // Find the original task
        const originalTask = tasksForSelectedDate.find((task) => task.id === taskId);

        if (originalTask) {
          try {
            // Persist changes via task manager
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

  // Group layout values for easier prop passing
  const layoutValues = {
    timelineLayout,
    timelineViewHeight,
    cancelButtonLayout,
    removeButtonLayout,
  };

  // ======== Render Component ========
  return (
    <View style={styles.container} ref={parentViewRef} onLayout={handleParentViewLayout}>
      {/* Tooltip for user feedback */}
      <Tooltip
        message={tooltipMessage}
        position={tooltipPosition}
        isVisible={tooltipVisible}
        onDismiss={hideTooltip}
        parentViewLayout={parentViewLayout}
      />

      {/* Area for unscheduled tasks */}
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

      {/* Main timeline content */}
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
