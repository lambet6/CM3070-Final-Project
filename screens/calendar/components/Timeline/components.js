/* global setTimeout clearTimeout */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GestureDetector, BaseButton } from 'react-native-gesture-handler';
import styles, { stylesTooltip } from './styles';
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
} from './animations';
import { useTaskGestures } from './hooks';

// ========================================================================
// Timeline components
// ========================================================================
export const HourMarkers = React.memo(() => {
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
});
HourMarkers.displayName = 'HourMarkers';

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
    scrollY,
    validZonesByDuration,
    onTapUnScheduled,
    onDismissTooltip,
  }) => {
    const {
      previewVisible,
      previewPosition,
      previewHeight,
      ghostVisible,
      ghostPosition,
      ghostHeight,
      isDragging,
      isDraggingScheduled,
      isPreviewValid,
      isRemoveHovered,
      isCancelHovered,
      autoScrollActive,
    } = dragAnimationValues;

    const { timelineLayout, removeButtonLayout, cancelButtonLayout, timelineViewHeight } =
      layoutValues;

    const scheduledTasks = tasks.filter((task) => task.scheduled);

    return (
      <Animated.View
        ref={timelineLayoutRef}
        style={styles.timelineContainer}
        onLayout={handleTimelineLayout}>
        <Animated.ScrollView ref={scrollViewRef} scrollEventThrottle={16}>
          <View style={styles.timelineSideBar}>
            <HourMarkers />
          </View>
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
                onStateChange={onStateChange}
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
                onTapUnScheduled={onTapUnScheduled}
                onDismissTooltip={onDismissTooltip}
              />
            ))}
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
  // Calculate position and height from event times
  const startTime = dateToDecimalHours(event.startDate);
  const endTime = dateToDecimalHours(event.endDate);

  // Use the MIN_HOUR and MAX_HOUR constants directly instead of parsing HOURS
  const timelineStartHour = MIN_HOUR;
  const timelineEndHour = MAX_HOUR;

  // Check if event is completely outside the timeline
  if (startTime >= timelineEndHour || endTime <= timelineStartHour) {
    return null; // Don't render events completely outside timeline
  }

  // Adjust start and end times for events partially within the timeline
  const adjustedStartTime = Math.max(startTime, timelineStartHour);
  const adjustedEndTime = Math.min(endTime, timelineEndHour);
  const adjustedDuration = adjustedEndTime - adjustedStartTime; // in hours

  const position = timeToPosition(adjustedStartTime);
  const height = adjustedDuration * HOUR_HEIGHT;

  // Original duration for display purposes
  const duration = endTime - startTime;

  // Check if the event was clipped
  const isClippedStart = startTime < timelineStartHour;
  const isClippedEnd = endTime > timelineEndHour;

  // Default styles for full width (no overlap)
  let viewStyle = {
    position: 'absolute',
    top: position,
    height: height,
    backgroundColor: 'rgba(149, 175, 192, 0.6)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4b6584',
    zIndex: 50,
  };

  // If layout data is provided, check if the event is full width or part of a collision group
  if (layout) {
    if (layout.isFullWidth) {
      // Full width event (no overlaps)
      viewStyle = {
        ...viewStyle,
        left: 0,
        right: 0,
        marginHorizontal: 5,
      };
    } else {
      // Part of an overlap group
      viewStyle = {
        ...viewStyle,
        width: `${layout.width}%`,
        left: `${layout.leftPosition}%`,
        marginHorizontal: 2, // Reduced for better fit
      };

      // Adjust padding for narrower events
      if (layout.columnCount > 2) {
        viewStyle.padding = 4;
      }
    }
  } else {
    // Fallback for events without layout data (should be full width)
    viewStyle = {
      ...viewStyle,
      left: 0,
      right: 0,
      marginHorizontal: 5,
    };
  }

  // Add visual indication for clipped events
  if (isClippedStart) {
    viewStyle.borderTopLeftRadius = 0;
    viewStyle.borderTopRightRadius = 0;
    viewStyle.borderTopWidth = 2;
    viewStyle.borderTopColor = '#4b6584';
    viewStyle.borderTopStyle = 'dashed';
  }

  if (isClippedEnd) {
    viewStyle.borderBottomLeftRadius = 0;
    viewStyle.borderBottomRightRadius = 0;
    viewStyle.borderBottomWidth = 2;
    viewStyle.borderBottomColor = '#4b6584';
    viewStyle.borderBottomStyle = 'dashed';
  }

  return (
    <View style={viewStyle}>
      <Text
        style={[
          styles.scheduledTaskTitle,
          { fontWeight: '500' },
          // Reduce font size for narrower events
          layout && layout.columnCount > 1 ? { fontSize: 12 } : {},
        ]}
        numberOfLines={1}>
        {event.title}
        {(isClippedStart || isClippedEnd) && ' ⋯'}
      </Text>
      <View
        style={layout && layout.columnCount > 1 ? styles.smallEventDetails : styles.EventDetails}>
        <Text
          style={[
            styles.scheduledTaskTime,
            // Reduce font size for narrower events
            layout && layout.columnCount > 1 ? { fontSize: 10 } : {},
          ]}>
          {formatTimeFromDecimal(startTime)} - {formatTimeFromDecimal(endTime)}
        </Text>
        <Text
          style={[
            styles.scheduledTaskDuration,
            // Reduce font size for narrower events
            layout && layout.columnCount > 1 ? { fontSize: 10 } : {},
          ]}>
          {Math.floor(duration)}h
          {Math.round((duration % 1) * 60) ? ` ${Math.round((duration % 1) * 60)}m` : ''}
        </Text>
      </View>
    </View>
  );
});
EventItem.displayName = 'EventItem';

// ========================================================================
// Task components
// ========================================================================
const TaskItem = React.memo(
  ({
    task,
    index,
    onStateChange,
    scrollY,
    timelineLayout,
    previewVisible,
    previewPosition,
    previewHeight,
    isDragging,
    isDraggingScheduled,
    removeButtonLayout,
    cancelButtonLayout,
    ghostVisible,
    ghostPosition,
    ghostHeight,
    isRemoveHovered,
    isCancelHovered,
    autoScrollActive,
    scrollViewRef,
    timelineViewHeight,
    validZones,
    isPreviewValid,
    isSchedulable = true,
    onTapUnScheduled,
    onDismissTooltip,
  }) => {
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
      autoScrollActive,
      scrollY,
      timelineLayout,
      scrollViewRef,
      timelineViewHeight,
    });

    // Create gesture handlers
    const composedGestures = useTaskGestures({
      task,
      animations,
      onStateChange,
      scrollY,
      timelineLayout,
      previewVisible,
      previewPosition,
      previewHeight,
      isDragging,
      isDraggingScheduled,
      removeButtonLayout,
      cancelButtonLayout,
      ghostVisible,
      ghostPosition,
      ghostHeight,
      isRemoveHovered,
      isCancelHovered,
      autoScrollActive,
      scrollViewRef,
      timelineViewHeight,
      validZones,
      isPreviewValid,
      isSchedulable,
      onTapUnScheduled,
      onDismissTooltip,
      taskHeight,
    });

    // Define static styles outside of the worklet for better performance
    const scheduledStaticStyles = useMemo(
      () => ({
        position: 'absolute',
        left: 0,
        right: 0,
        marginHorizontal: 5,
        backgroundColor: '#a8e6cf',
        height: taskHeight,
      }),
      [taskHeight],
    );

    const unscheduledStaticStyles = useMemo(
      () => ({
        width: TASK_ITEM_WIDTH / 2,
        height: TASK_ITEM_HEIGHT / 2,
        padding: 5,
      }),
      [],
    );

    const nonSchedulableStaticStyles = useMemo(
      () =>
        !isSchedulable
          ? {
              borderWidth: 1,
              borderColor: '#bdbdbd',
              borderStyle: 'dashed',
            }
          : {},
      [isSchedulable],
    );

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
          zIndex: animations.isPressed.value ? 1000 : index + 1,
        };
      } else {
        return {
          ...commonTransform,
          opacity: !isSchedulable ? 0.5 : animations.opacity.value,
          backgroundColor: animations.isOverTimeline.value
            ? '#a8e6cf'
            : !isSchedulable
              ? '#e0e0e0'
              : '#ffd3b6',
          zIndex: animations.isPressed.value ? 1000 : 1,
        };
      }
    });

    // Render task item
    return (
      <GestureDetector gesture={composedGestures}>
        <Animated.View
          style={[
            styles.taskItem,
            task.scheduled ? scheduledStaticStyles : unscheduledStaticStyles,
            !task.scheduled && nonSchedulableStaticStyles,
            animatedStyles,
          ]}>
          <Text
            style={task.scheduled ? styles.scheduledTaskTitle : styles.unscheduledTaskTitle}
            numberOfLines={1}>
            {task.title}
          </Text>

          {task.scheduled ? (
            // Scheduled task details with time display
            <View style={styles.scheduledTaskDetails}>
              <Text style={styles.scheduledTaskTime}>{formatTimeFromDecimal(task.startTime)}</Text>
              <Text style={styles.scheduledTaskDuration}>{task.duration.toFixed(1)}h</Text>
              {!isSchedulable && (
                <Text style={styles.nonSchedulableText}>No time slots available</Text>
              )}
            </View>
          ) : (
            // Unscheduled task just shows duration
            <Text style={styles.unscheduledTaskDuration}>{task.duration.toFixed(1)}h</Text>
          )}
        </Animated.View>
      </GestureDetector>
    );
  },
);
TaskItem.displayName = 'TaskItem';

export const UnscheduledTasksSection = React.memo(
  ({
    tasks,
    isTasksExpanded,
    setIsTasksExpanded,
    onStateChange,
    scrollY,
    timelineLayout,
    dragAnimationValues,
    layoutValues,
    validZonesByDuration,
    onTapUnScheduled,
    onDismissTooltip,
    scrollViewRef,
  }) => {
    const {
      previewVisible,
      previewPosition,
      previewHeight,
      isDragging,
      isDraggingScheduled,
      isPreviewValid,
      isRemoveHovered,
      isCancelHovered,
      autoScrollActive,
    } = dragAnimationValues;

    const { removeButtonLayout, cancelButtonLayout, timelineViewHeight } = layoutValues;

    return (
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
                  onStateChange={onStateChange}
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
                  onTapUnScheduled={onTapUnScheduled}
                  onDismissTooltip={onDismissTooltip}
                />
              );
            })}
        </View>
        <BaseButton
          style={styles.expandButton}
          onPress={() => {
            setIsTasksExpanded(!isTasksExpanded);
            onDismissTooltip();
          }}>
          <Text style={styles.expandButtonText}>{isTasksExpanded ? '∧' : '∨'}</Text>
        </BaseButton>
      </View>
    );
  },
);
UnscheduledTasksSection.displayName = 'UnscheduledTasksSection';

// ========================================================================
// UI components
// ========================================================================
export const DragActionButtons = ({
  isVisible,
  removeButtonRef,
  cancelButtonRef,
  onLayoutChange,
  isRemoveHovered,
  isCancelHovered,
  isDraggingScheduled,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      zIndex: 2000,
      opacity: isVisible.value ? 1 : 0,
      pointerEvents: isVisible.value ? 'auto' : 'none',
    };
  });

  const cancelButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isCancelHovered.value ? 'rgb(224, 133, 0)' : 'transparent',
    };
  });

  const removeButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isRemoveHovered.value ? 'rgb(224, 133, 0)' : 'transparent',
      width: isDraggingScheduled.value ? 120 : 0,
      marginLeft: isDraggingScheduled.value ? 10 : 0,
    };
  });

  // Center cancel button when remove button is hidden
  const cancelContainerStyle = useAnimatedStyle(() => {
    return {
      width: isDraggingScheduled.value ? '50%' : '100%',
      alignItems: isDraggingScheduled.value ? 'flex-end' : 'center',
      paddingRight: isDraggingScheduled.value ? 10 : 0,
    };
  });

  const removeButtonTextStyle = useAnimatedStyle(() => {
    return {
      color: isRemoveHovered.value ? 'white' : 'rgb(224, 133, 0)',
    };
  });

  const cancelButtonTextStyle = useAnimatedStyle(() => {
    return {
      color: isCancelHovered.value ? 'white' : 'rgb(224, 133, 0)',
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={cancelContainerStyle}>
        <Animated.View
          ref={cancelButtonRef}
          style={[styles.actionButton, cancelButtonStyle]}
          onLayout={onLayoutChange}>
          <Animated.Text style={[styles.actionButtonIcon, cancelButtonTextStyle]}>↩</Animated.Text>
          <Animated.Text style={[styles.actionButtonText, cancelButtonTextStyle]}>
            Cancel
          </Animated.Text>
        </Animated.View>
      </Animated.View>
      <Animated.View
        ref={removeButtonRef}
        style={[styles.actionButton, removeButtonStyle]}
        onLayout={onLayoutChange}>
        <Animated.Text style={[styles.actionButtonIcon, removeButtonTextStyle]}>✕</Animated.Text>
        <Animated.Text style={[styles.actionButtonText, removeButtonTextStyle]}>
          Remove
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

export const Tooltip = ({ message, position, isVisible, onDismiss, parentViewLayout }) => {
  const dismissTimerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hasLayout, setHasLayout] = useState(false);
  const tooltipWidth = useSharedValue(0);
  const tooltipHeight = useSharedValue(0);
  const arrowPosition = useSharedValue(0);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

  // Update shared values when dimensions change
  useEffect(() => {
    tooltipWidth.value = dimensions.width;
    tooltipHeight.value = dimensions.height;
  }, [dimensions, tooltipHeight, tooltipWidth]);

  // Use animated style to safely access shared values
  const tooltipStyle = useAnimatedStyle(() => {
    // Calculate offsets based on actual dimensions
    const horizontalOffset = tooltipWidth.value / 2;
    const verticalOffset = tooltipHeight.value / 2 + TASK_ITEM_HEIGHT / 2;

    // Default positions (when no parentViewLayout is available)
    let tooltipX = position.x - horizontalOffset; // Center tooltip horizontally
    let tooltipY = position.y - verticalOffset; // Position above finger

    // If parentViewLayout is available, adjust position
    if (parentViewLayout) {
      const parentLayout = parentViewLayout.value;
      if (parentLayout) {
        // Adjust tooltip position based on parent view layout
        tooltipX = position.x - horizontalOffset + TASK_ITEM_WIDTH / 4;
        tooltipY = position.y - parentLayout.y - verticalOffset;
      }
    }

    // Calculate the center point for the arrow before boundary adjustments
    const targetX = tooltipX + horizontalOffset;

    // Ensure tooltip stays within screen boundaries
    // Horizontal boundaries
    const rightEdge = tooltipX + tooltipWidth.value;
    if (rightEdge > screenWidth - 10) {
      tooltipX = screenWidth - tooltipWidth.value - 10; // 10px padding from edge
    }
    if (tooltipX < 10) {
      tooltipX = 10; // 10px padding from left edge
    }

    // Set arrow position relative to the tooltip's adjusted position
    arrowPosition.value = targetX - tooltipX;

    return {
      position: 'absolute',
      left: tooltipX,
      top: tooltipY,
    };
  });

  // Style for the arrow
  const arrowStyle = useAnimatedStyle(() => {
    return {
      left: arrowPosition.value - 10, // -10 to center the 20px wide arrow
    };
  });

  // Set up auto-dismiss timer when tooltip becomes visible
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

  // Don't render anything if not visible or no position
  if (!isVisible || !position) {
    return null;
  }
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
      // entering={hasLayout ? FadeInDown : undefined}
      // exiting={FadeOutDown}
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
