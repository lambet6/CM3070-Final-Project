/* global setTimeout clearTimeout */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { GestureDetector, FlatList } from 'react-native-gesture-handler';
import { Divider, Text, useTheme } from 'react-native-paper';
import {
  useTimelineStyles,
  getClippedEventStyle,
  getEventBaseStyle,
  getEventWidthStyle,
  priorityIndicatorStyles,
  stylesTooltip,
} from './styles';
import {
  HOURS,
  QUARTERS,
  HOUR_HEIGHT,
  QUARTER_HEIGHT,
  TASK_ITEM_HEIGHT,
  TASK_ITEM_WIDTH,
  timeToPosition,
  formatTimeFromDecimal,
  dateToDecimalHours,
  MIN_HOUR,
  MAX_HOUR,
} from './utils';
import {
  useGhostSquareStyle,
  useTimelineIndicatorStyle,
  useTaskAnimations,
  useAutoScroll,
  useDragActionButtonsStyles,
  useTooltipStyles,
} from './animations';
import { useTaskGestures } from './hooks';

// ========================================================================
// Timeline components
// ========================================================================
export const HourMarkers = React.memo(() => {
  const styles = useTimelineStyles();

  return HOURS.map((hour, hourIndex) => (
    <View key={`hour-${hourIndex}`} style={styles.hourContainer}>
      {/* Hour label */}
      <View style={styles.hourLabelRow}>
        <Text variant="labelMedium" style={styles.hourText}>
          {hour}
        </Text>
      </View>

      {/* Quarter markers in flex containers */}
      <View style={styles.quartersContainer}>
        {QUARTERS.slice(1).map((quarter, qIndex) => (
          <View key={`quarter-${qIndex}`} style={[styles.quarterRow, { height: `${25}%` }]}>
            {qIndex === 1 && (
              <Text variant="labelSmall" style={styles.quarterText}>
                {quarter}
              </Text>
            )}
            <View style={styles.quarterDot} />
          </View>
        ))}
      </View>
    </View>
  ));
});
HourMarkers.displayName = 'HourMarkers';

export const HourDividers = React.memo(() => {
  const styles = useTimelineStyles();

  return HOURS.map((hour, hourIndex) => (
    <Divider
      horizontalInset={true}
      key={`hour-divider-${hourIndex}`}
      style={[styles.hourDivider, { top: hourIndex * HOUR_HEIGHT }]}
    />
  ));
});
HourDividers.displayName = 'HourDividers';

// Helper function to render event items
const renderEvents = (events, eventLayoutMap) => {
  return events.map((event) => (
    <EventItem key={event.id} event={event} layout={eventLayoutMap.get(event.id)} />
  ));
};

// Helper function to render task items
const renderTasks = (
  tasks,
  onStateChange,
  onTaskComplete,
  scrollY,
  timelineLayout,
  animationValues,
  layoutValues,
  validZonesByDuration,
  onTapUnScheduled,
  onDismissTooltip,
  scrollViewRef,
) => {
  return tasks.map((task, index) => (
    <TaskItem
      key={`${task.id}-${task.startTime || 'unscheduled'}`}
      task={task}
      index={index}
      onStateChange={onStateChange}
      onTaskComplete={onTaskComplete}
      scrollY={scrollY}
      timelineLayout={timelineLayout}
      dragAnimationValues={animationValues}
      layoutValues={layoutValues}
      validZones={validZonesByDuration[task.duration]}
      scrollViewRef={scrollViewRef}
      onTapUnScheduled={onTapUnScheduled}
      onDismissTooltip={onDismissTooltip}
    />
  ));
};

export const TimelineContent = React.memo(
  ({
    scrollViewRef,
    timelineLayoutRef,
    handleTimelineLayout,
    tasks,
    events,
    eventLayoutMap,
    dragAnimationValues,
    layoutValues,
    onStateChange,
    onTaskComplete,
    scrollY,
    validZonesByDuration,
    onTapUnScheduled,
    onDismissTooltip,
  }) => {
    const {
      previewVisible,
      previewPosition,
      previewHeight,
      isPreviewValid,
      ghostVisible,
      ghostPosition,
      ghostHeight,
    } = dragAnimationValues;
    const styles = useTimelineStyles();

    return (
      <Animated.View
        ref={timelineLayoutRef}
        style={styles.timelineContainer}
        onLayout={handleTimelineLayout}>
        <Animated.ScrollView
          // style={{ overflow: 'visible' }}
          ref={scrollViewRef}
          scrollEventThrottle={16}>
          <View style={styles.timelineSideBar}>
            <HourMarkers />
          </View>
          <View style={styles.timelineContent}>
            <HourDividers />

            {/* Fixed events - render before tasks so they appear behind tasks */}
            {renderEvents(events, eventLayoutMap)}

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

            {/* Scheduled Tasks */}
            {renderTasks(
              tasks,
              onStateChange,
              onTaskComplete,
              scrollY,
              layoutValues.timelineLayout,
              dragAnimationValues,
              layoutValues,
              validZonesByDuration,
              onTapUnScheduled,
              onDismissTooltip,
              scrollViewRef,
            )}
          </View>
        </Animated.ScrollView>
      </Animated.View>
    );
  },
);
TimelineContent.displayName = 'TimelineContent';

export const TimelineIndicator = ({ visible, position, height, style, isValid }) => {
  return (
    <Animated.View style={useTimelineIndicatorStyle(visible, position, height, style, isValid)} />
  );
};

export const GhostSquare = ({ visible, position, height, style }) => {
  return <Animated.View style={useGhostSquareStyle(visible, position, height, style)} />;
};

// ========================================================================
// Event components
// ========================================================================
export const EventItem = React.memo(({ event, layout = null }) => {
  const styles = useTimelineStyles();
  const theme = useTheme();

  // Calculate position and height from event times
  const startTime = dateToDecimalHours(event.startDate);
  const endTime = dateToDecimalHours(event.endDate);

  // Check if event spans multiple days (ends on a different day than it starts)
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isMultiDayEvent = startDate.toDateString() !== endDate.toDateString();

  // For multi-day events, use 24 (end of day) instead of 0
  const effectiveEndTime = isMultiDayEvent ? 24 : endTime;

  // Use the MIN_HOUR and MAX_HOUR constants directly instead of parsing HOURS
  const timelineStartHour = MIN_HOUR;
  const timelineEndHour = MAX_HOUR;

  // Check if event is completely outside the timeline
  if (startTime >= timelineEndHour || effectiveEndTime <= timelineStartHour) {
    return null; // Don't render events completely outside timeline
  }

  // Adjust start and end times for events partially within the timeline
  const adjustedStartTime = Math.max(startTime, timelineStartHour);
  const adjustedEndTime = Math.min(isMultiDayEvent ? 24 : endTime, timelineEndHour);
  const adjustedDuration = adjustedEndTime - adjustedStartTime; // in hours

  const position = timeToPosition(adjustedStartTime);
  const height = adjustedDuration * HOUR_HEIGHT;

  // Original duration for display purposes
  const duration = endTime - startTime;

  // Check if the event was clipped
  const isClippedStart = startTime < timelineStartHour;
  const isClippedEnd = endTime > timelineEndHour;

  // Combine all style aspects using the helper functions
  const baseStyle = getEventBaseStyle(position, height, theme);
  const widthStyle = getEventWidthStyle(layout);
  const clippedStyle = getClippedEventStyle(isClippedStart, isClippedEnd);

  const viewStyle = {
    ...baseStyle,
    ...widthStyle,
    ...clippedStyle,
  };

  const isNarrow = layout && layout.columnCount > 1;
  const titleFontSize = isNarrow ? 'titleSmall' : 'titleMedium';
  const detailsFontSize = isNarrow ? 'labelSmall' : 'labelMedium';

  return (
    <View style={viewStyle}>
      <Text variant={titleFontSize} style={styles.eventText} numberOfLines={1}>
        {event.title}
        {(isClippedStart || isClippedEnd) && ' ⋯'}
      </Text>
      <View style={isNarrow ? styles.smallEventDetails : styles.EventDetails}>
        <Text variant={detailsFontSize} style={styles.eventText}>
          {formatTimeFromDecimal(startTime)} -{' '}
          {isMultiDayEvent ? '24:00' : formatTimeFromDecimal(endTime)}
        </Text>
        <Text variant={detailsFontSize} style={styles.scheduledTaskDuration}>
          {Math.floor(isMultiDayEvent ? 24 - startTime : duration)}h
          {Math.round(((isMultiDayEvent ? 24 - startTime : duration) % 1) * 60)
            ? ` ${Math.round(((isMultiDayEvent ? 24 - startTime : duration) % 1) * 60)}m`
            : ''}
        </Text>
      </View>
    </View>
  );
});
EventItem.displayName = 'EventItem';

// ========================================================================
// Task components
// ========================================================================

// Extract task props extraction to a separate function
const extractTaskProps = (dragAnimationValues, layoutValues) => {
  const {
    previewVisible,
    previewPosition,
    previewHeight,
    isDragging,
    isDraggingScheduled,
    isRemoveHovered,
    isCancelHovered,
    autoScrollActive,
    ghostVisible,
    ghostPosition,
    ghostHeight,
    isPreviewValid,
  } = dragAnimationValues;

  const { timelineViewHeight, timelineLayout, cancelButtonLayout, removeButtonLayout } =
    layoutValues;

  return {
    previewVisible,
    previewPosition,
    previewHeight,
    isDragging,
    isDraggingScheduled,
    ghostVisible,
    ghostPosition,
    ghostHeight,
    isRemoveHovered,
    isCancelHovered,
    autoScrollActive,
    timelineViewHeight,
    isPreviewValid,
    timelineLayout,
    cancelButtonLayout,
    removeButtonLayout,
  };
};

const TaskItem = React.memo(
  ({
    task,
    index,
    onStateChange,
    onTaskComplete,
    scrollY,
    timelineLayout,
    dragAnimationValues,
    layoutValues,
    validZones,
    scrollViewRef,
    isSchedulable = true,
    onTapUnScheduled,
    onDismissTooltip,
    isAnyTaskDragging = false, // Accept new prop with default value
  }) => {
    const styles = useTimelineStyles();
    // Extract props from animation and layout values
    const props = extractTaskProps(dragAnimationValues, layoutValues);

    // Use custom hooks for animations and state management
    const animations = useTaskAnimations(task);

    // Calculate height based on duration
    const durationQuarters = Math.round(task.duration * 4);
    const taskHeight = task.scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;

    // Set up auto-scrolling
    useAutoScroll({
      isPressed: animations.isPressed,
      isOverTimeline: animations.isOverTimeline,
      task,
      hasBeenOverTimeline: animations.hasBeenOverTimeline,
      pointerPositionY: animations.pointerPositionY,
      scrollDirection: animations.scrollDirection,
      scrollSpeed: animations.scrollSpeed,
      accumulatedScrollOffset: animations.accumulatedScrollOffset,
      autoScrollActive: props.autoScrollActive,
      scrollY,
      timelineLayout,
      scrollViewRef,
      timelineViewHeight: props.timelineViewHeight,
    });

    // Create gesture handlers
    const composedGestures = useTaskGestures({
      task,
      animations,
      onStateChange,
      onTaskComplete,
      scrollY,
      timelineLayout,
      previewVisible: props.previewVisible,
      previewPosition: props.previewPosition,
      previewHeight: props.previewHeight,
      isDragging: props.isDragging,
      isDraggingScheduled: props.isDraggingScheduled,
      removeButtonLayout: props.removeButtonLayout,
      cancelButtonLayout: props.cancelButtonLayout,
      ghostVisible: props.ghostVisible,
      ghostPosition: props.ghostPosition,
      ghostHeight: props.ghostHeight,
      isRemoveHovered: props.isRemoveHovered,
      isCancelHovered: props.isCancelHovered,
      autoScrollActive: props.autoScrollActive,
      scrollViewRef,
      timelineViewHeight: props.timelineViewHeight,
      validZones,
      isPreviewValid: props.isPreviewValid,
      isSchedulable,
      onTapUnScheduled,
      onDismissTooltip,
      taskHeight,
    });

    // Optimized animated styles - only compute what changes during animation
    const animatedStyles = useAnimatedStyle(() => {
      // Common transform properties extracted to reduce calculation in worklet
      const commonTransform = {
        transform: [
          { translateX: animations.translateX.value },
          { translateY: animations.translateY.value },
          { scale: animations.scale.value },
        ],
      };

      if (task.scheduled) {
        return {
          ...commonTransform,
          top: timeToPosition(animations.taskTime.value),
          zIndex: animations.isPressed.value ? 1000 : 750,
        };
      } else {
        // Determine opacity based on dragging state
        let opacity;
        if (isAnyTaskDragging) {
          // If any task is dragging, only show this task if it's the one being pressed
          opacity = animations.isPressed.value ? animations.opacity.value : 0;
        } else {
          // Normal opacity calculation when no dragging is happening
          opacity = !isSchedulable ? 0.5 : animations.opacity.value;
        }

        return {
          ...commonTransform,
          opacity: opacity,
          backgroundColor: animations.isOverTimeline.value
            ? styles.unscheduledTaskDragged.backgroundColor
            : !isSchedulable
              ? '#e0e0e0'
              : styles.unscheduledTaskStatic.backgroundColor,
          zIndex: animations.isPressed.value ? 1000 : 1,
        };
      }
    });

    // Render task content based on scheduled state
    const renderTaskContent = () => {
      // Access priority directly from task object
      const priority = task.priority || 'Medium';

      if (task.scheduled) {
        return (
          <>
            <PriorityIndicator priority={priority} />

            <View style={styles.scheduledTaskDetails}>
              <Text
                variant="labelSmall"
                style={[styles.scheduledTaskTime, task.completed && styles.completedTaskText]}>
                {formatTimeFromDecimal(task.startTime)}
              </Text>

              <Text
                variant="titleMedium"
                style={[styles.scheduledTaskTitle, task.completed && styles.completedTaskText]}
                numberOfLines={1}>
                {task.title}
              </Text>

              <Text
                variant="labelSmall"
                style={[styles.scheduledTaskDuration, task.completed && styles.completedTaskText]}>
                {task.duration.toFixed(1)}h
              </Text>
            </View>
          </>
        );
      } else {
        return (
          <>
            <PriorityIndicator priority={priority} />
            <Text variant="labelLarge" style={styles.unscheduledTaskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <Text variant="labelSmall" style={styles.unscheduledTaskDuration}>
              {task.duration.toFixed(1)}h
            </Text>
          </>
        );
      }
    };
    // Render task item
    return (
      <GestureDetector gesture={composedGestures}>
        <Animated.View
          style={[
            styles.taskItem,
            // Apply static styles from styles.js
            task.scheduled
              ? [styles.scheduledTaskStatic, { height: taskHeight }]
              : styles.unscheduledTaskStatic,
            // Apply non-schedulable style conditionally
            !task.scheduled && !isSchedulable && styles.nonSchedulableTaskStatic,
            // Apply animated styles
            animatedStyles,
          ]}>
          {renderTaskContent()}
        </Animated.View>
      </GestureDetector>
    );
  },
);
TaskItem.displayName = 'TaskItem';

export const UnscheduledTasksSection = React.memo(
  ({
    tasks,
    onStateChange,
    scrollY,
    timelineLayout,
    dragAnimationValues,
    layoutValues,
    validZonesByDuration,
    onTapUnScheduled,
    onDismissTooltip,
    scrollViewRef,
    removeButtonRef,
    cancelButtonRef,
    isRemoveHovered,
    isCancelHovered,
    handleCancelButtonLayout,
    handleRemoveButtonLayout,
  }) => {
    const styles = useTimelineStyles();
    const { cancelButtonStyle, removeButtonStyle, removeButtonTextStyle, cancelButtonTextStyle } =
      useDragActionButtonsStyles(isRemoveHovered, isCancelHovered);
    const [taskDragging, setTaskDragging] = useState(false);
    const [taskDraggingScheduled, setTaskDraggingScheduled] = useState(false);
    useAnimatedReaction(
      () => {
        return dragAnimationValues.isDragging.value;
      },
      (currentValue) => {
        runOnJS(setTaskDragging)(currentValue);
      },
    );
    useAnimatedReaction(
      () => {
        return dragAnimationValues.isDraggingScheduled.value;
      },
      (currentValue) => {
        runOnJS(setTaskDraggingScheduled)(currentValue);
      },
    );
    // Get only unscheduled tasks
    const unscheduledTasks = useMemo(() => tasks.filter((task) => !task.scheduled), [tasks]);

    // Use FlatList for better performance and automatic layout
    const renderTaskItem = useCallback(
      ({ item: task }) => {
        const hasValidZones = validZonesByDuration[task.duration]?.length > 0;

        return (
          <TaskItem
            key={task.id}
            task={task}
            index={0}
            onStateChange={onStateChange}
            scrollY={scrollY}
            timelineLayout={timelineLayout}
            dragAnimationValues={dragAnimationValues}
            layoutValues={layoutValues}
            validZones={validZonesByDuration[task.duration]}
            scrollViewRef={scrollViewRef}
            isSchedulable={hasValidZones}
            onTapUnScheduled={onTapUnScheduled}
            onDismissTooltip={onDismissTooltip}
            removeButtonRef={removeButtonRef}
            cancelButtonRef={cancelButtonRef}
            isAnyTaskDragging={taskDragging}
          />
        );
      },
      [
        onStateChange,
        scrollY,
        timelineLayout,
        dragAnimationValues,
        layoutValues,
        validZonesByDuration,
        onTapUnScheduled,
        onDismissTooltip,
        scrollViewRef,
        removeButtonRef,
        cancelButtonRef,
        taskDragging,
      ],
    );

    // Render the empty state when no unscheduled tasks
    const renderEmptyState = () => (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText} variant="bodyLarge">
          No tasks due
        </Text>
      </View>
    );

    return (
      <View style={styles.unscheduledArea}>
        <View style={styles.unscheduledHeader}>
          <Text style={styles.sectionTitle} variant="titleMedium">
            Tasks
          </Text>
          {unscheduledTasks.length > 0 && (
            <Text variant="labelMedium" style={styles.taskCount}>
              {unscheduledTasks.length} due
            </Text>
          )}
        </View>
        <View style={styles.unscheduledTasksContainer}>
          {/* Always render either the FlatList or empty state */}
          {unscheduledTasks.length > 0 ? (
            <FlatList
              data={unscheduledTasks}
              style={styles.unscheduledTaskList}
              renderItem={renderTaskItem}
              ListEmptyComponent={renderEmptyState}
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.taskListContent}
              keyExtractor={(item) => item.id}
              initialNumToRender={5}
              maxToRenderPerBatch={10}
              windowSize={5}
              getItemLayout={(data, index) => ({
                length: TASK_ITEM_WIDTH / 2 + 20,
                offset: (TASK_ITEM_WIDTH / 2 + 20) * index,
                index,
              })}
            />
          ) : taskDragging ? null : (
            renderEmptyState()
          )}

          {/* Conditionally render the overlay with absolute positioning */}
          {taskDragging && (
            <Animated.View style={styles.actionButtonsContainer}>
              <Animated.View
                ref={cancelButtonRef}
                onLayout={handleCancelButtonLayout}
                style={[styles.actionButton, cancelButtonStyle]}>
                <Animated.Text style={[styles.cancelButtonIcon, cancelButtonTextStyle]}>
                  ↺
                </Animated.Text>
                <Animated.Text style={[styles.actionButtonText, cancelButtonTextStyle]}>
                  Cancel
                </Animated.Text>
              </Animated.View>
              {taskDraggingScheduled && (
                <Animated.View
                  ref={removeButtonRef}
                  onLayout={handleRemoveButtonLayout}
                  style={[styles.actionButton, removeButtonStyle]}>
                  <Animated.Text style={[styles.removeButtonIcon, removeButtonTextStyle]}>
                    ✕
                  </Animated.Text>
                  <Animated.Text style={[styles.actionButtonText, removeButtonTextStyle]}>
                    Remove
                  </Animated.Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>
      </View>
    );
  },
);

UnscheduledTasksSection.displayName = 'UnscheduledTasksSection';

// ========================================================================
// UI components
// ========================================================================

// Helper function to manage tooltip auto-dismiss
const useTooltipDismiss = (isVisible, onDismiss, position, message) => {
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      // Clear any existing timer
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      // Set new timer to auto-dismiss after 3 seconds
      dismissTimerRef.current = setTimeout(() => {
        if (onDismiss) {
          onDismiss();
        }
      }, 3000);
    }

    // Cleanup timer on unmount or when visibility changes
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [isVisible, onDismiss, position, message]);

  return dismissTimerRef;
};

export const Tooltip = ({ message, position, isVisible, onDismiss, parentViewLayout }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hasLayout, setHasLayout] = useState(false);
  const tooltipWidth = useSharedValue(0);
  const tooltipHeight = useSharedValue(0);
  const arrowPosition = useSharedValue(0);

  // Set up auto-dismiss timer
  const dismissTimerRef = useTooltipDismiss(isVisible, onDismiss, position, message);

  // Get screen dimensions
  const { width: screenWidth } = Dimensions.get('screen');

  // Update shared values when dimensions change
  useEffect(() => {
    tooltipWidth.value = dimensions.width;
    tooltipHeight.value = dimensions.height;
  }, [dimensions, tooltipHeight, tooltipWidth]);

  const { tooltipStyle, arrowStyle } = useTooltipStyles(
    tooltipWidth,
    tooltipHeight,
    position,
    arrowPosition,
    hasLayout,
    parentViewLayout,
    screenWidth,
  );

  // Don't render anything if not visible or no position
  if (!isVisible || !position) {
    return null;
  }

  return (
    <Animated.View
      style={[
        stylesTooltip.container,
        tooltipStyle,
        // Only show the tooltip once we have measured its dimensions
        !hasLayout && { opacity: 0 },
      ]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
        // Mark that we have layout information now
        setHasLayout(true);
      }}>
      <Text style={stylesTooltip.text}>{message}</Text>
      <Animated.View style={[stylesTooltip.arrow, arrowStyle]} />
    </Animated.View>
  );
};

export const PriorityIndicator = React.memo(({ priority }) => {
  // Determine the style based on priority
  const getPriorityStyle = () => {
    // Handle exactly the three possible values
    switch (priority) {
      case 'High':
        return priorityIndicatorStyles.high;
      case 'Medium':
        return priorityIndicatorStyles.medium;
      case 'Low':
      default:
        return priorityIndicatorStyles.low;
    }
  };

  return <View style={[priorityIndicatorStyles.container, getPriorityStyle()]} />;
});
PriorityIndicator.displayName = 'PriorityIndicator';
