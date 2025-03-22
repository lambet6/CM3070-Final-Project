import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { useAnimatedRef, useScrollViewOffset, useAnimatedReaction } from 'react-native-reanimated';
import { INITIAL_TASKS, INITIAL_EVENTS, SCREEN_HEIGHT } from './utils/timelineHelpers';
import styles from './styles';
import DragActionButtons from './components/DragActionButtons';
import Tooltip from './components/ToolTip';

// Import refactored utilities
import { calculateEventLayout } from './utils/eventLayoutUtils';
import { calculateInvalidZones, computeValidZonesByDuration } from './utils/timelineZoneUtils';

// Import custom hooks
import { useTooltip } from './hooks/useTooltip';
import { useDragAnimations } from './hooks/useDragAnimations';
import { useLayoutMeasurement } from './hooks/useLayoutMeasurement';

// Import UI components
import UnscheduledTasksSection from './components/UnscheduledTasksSection';
import TimelineContent from './components/TimelineContent';

const TimelineComponent = () => {
  // Task state
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  // Events data (fixed)
  const events = useMemo(() => INITIAL_EVENTS, []);

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
  } = useLayoutMeasurement();

  // Scroll handling
  const scrollViewRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);

  // Calculate event layout
  const eventLayoutMap = useMemo(() => calculateEventLayout(events), [events]);

  // Calculate invalid and valid zones
  const invalidZones = useMemo(() => calculateInvalidZones(events), [events]);

  const validZonesByDuration = useMemo(
    () => computeValidZonesByDuration(tasks, invalidZones),
    [tasks, invalidZones],
  );

  // Effect to update timelineViewHeight after layout
  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, we can use window height as an approximation
      timelineViewHeight.value = SCREEN_HEIGHT * 0.85; // Assuming timeline is 85% of screen height
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

  // Group layout values for passing to subcomponents
  const layoutValues = {
    timelineLayout,
    removeButtonLayout,
    cancelButtonLayout,
    timelineViewHeight,
  };

  // Render the UI
  return (
    <View style={styles.container}>
      {/* Tooltip */}
      <Tooltip
        message={tooltipMessage}
        position={tooltipPosition}
        isVisible={tooltipVisible}
        onDismiss={hideTooltip}
      />

      {/* Unscheduled Tasks Area */}
      <UnscheduledTasksSection
        tasks={tasks}
        isTasksExpanded={isTasksExpanded}
        setIsTasksExpanded={setIsTasksExpanded}
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
        events={events}
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
