import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { GestureDetector, Gesture, BaseButton } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useScrollViewOffset,
  useAnimatedRef,
  withTiming,
  withSpring,
  runOnJS,
  measure,
  useAnimatedReaction,
  runOnUI,
  Easing,
} from 'react-native-reanimated';

// Constants remain the same
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const QUARTER_HEIGHT = HOUR_HEIGHT / 4; // 15-minute increments
const TASK_ITEM_HEIGHT = 50;
const TASK_ITEM_WIDTH = 120;
const TIMELINE_OFFSET = SCREEN_WIDTH * 0.25;
const MIN_HOUR = 8; // 8 AM
const MAX_HOUR = 20; // 8 PM

// Sample data with duration only (no position)
const INITIAL_TASKS = [
  { id: '1', title: 'Meeting', duration: 1, scheduled: false, startTime: null },
  { id: '2', title: 'Lunch', duration: 1.5, scheduled: false, startTime: null },
  { id: '3', title: 'Workout', duration: 2, scheduled: false, startTime: null },
  { id: '4', title: 'Call Mom', duration: 0.5, scheduled: false, startTime: null },
  { id: '5', title: 'Project Work', duration: 0.75, scheduled: false, startTime: null },
];

const HOURS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  // 12 PM is noon, hours after noon are PM
  return hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
});

const QUARTERS = ['00', '15', '30', '45'];

// Helper function to format time from decimal hour
const formatTimeFromDecimal = (decimalHour) => {
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Conversion functions between time and position
const timeToPosition = (time) => {
  'worklet';
  return (time - MIN_HOUR) * HOUR_HEIGHT;
};

const positionToTime = (position) => {
  'worklet';
  const totalQuarters = Math.round(position / QUARTER_HEIGHT);
  return MIN_HOUR + totalQuarters / 4;
};

// cancel and remove buttons
const DragActionButtons = ({
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
      // opacity: isDraggingScheduled.value ? 1 : 0,
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
        <Animated.Text style={[styles.actionButtonIcon, removeButtonTextStyle]}>🗑</Animated.Text>
        <Animated.Text style={[styles.actionButtonText, removeButtonTextStyle]}>
          Remove
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

const TimelineIndicator = ({ visible, position, height, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 1 : 0,
      zIndex: style.zIndex || 500,
      ...style,
    };
  });

  return <Animated.View style={animatedStyle} />;
};
const GhostSquare = ({ visible, position, height, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 0.5 : 0,
      zIndex: 400,
      backgroundColor: 'rgba(156, 156, 156, 0.43)',
      borderRadius: 8,
      ...style,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

const TaskItem = ({
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
}) => {
  // Shared animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPressed = useSharedValue(false);
  const isOverTimeline = useSharedValue(false);
  const originalPosition = useSharedValue({ x: 0, y: 0 });

  // Task-specific animation value that represents its time position
  // This will be the source of truth for positioning
  const taskTime = useSharedValue(task.startTime || MIN_HOUR);

  // Calculate height based on duration
  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = task.scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;

  // Helper function to check if a point is inside a rectangle
  const isPointInRect = (pointX, pointY, rect) => {
    'worklet';
    return (
      rect &&
      pointX >= rect.x &&
      pointX <= rect.x + rect.width &&
      pointY >= rect.y &&
      pointY <= rect.y + rect.height
    );
  };

  // Update preview position during drag
  const updatePreviewPosition = (rawPosition, isDraggingOnTimeline) => {
    'worklet';
    if (!isDraggingOnTimeline) return;

    // Calculate quarter position (snap to nearest quarter)
    const totalQuarters = Math.round(rawPosition / QUARTER_HEIGHT);
    const snappedPosition = totalQuarters * QUARTER_HEIGHT;

    // Update preview values
    previewPosition.value = snappedPosition;
    previewHeight.value = durationQuarters * QUARTER_HEIGHT;
    previewVisible.value = true;
  };

  // Pan gesture with unified logic for both scheduled and unscheduled tasks
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      isPressed.value = true;
      scale.value = withSpring(task.scheduled ? 1.05 : 1.1);
      isDragging.value = true; // Set dragging state to show action buttons
      isDraggingScheduled.value = task.scheduled;

      // Reset hover states at the start
      isRemoveHovered.value = false;
      isCancelHovered.value = false;

      // Store original position for cancel action
      originalPosition.value = {
        x: event.absoluteX - event.x,
        y: event.absoluteY - event.y,
      };

      // Initialize preview for scheduled tasks
      if (task.scheduled) {
        const position = timeToPosition(taskTime.value);
        previewVisible.value = true;
        previewPosition.value = position;
        previewHeight.value = taskHeight;

        // Show ghost square at original position
        ghostVisible.value = true;
        ghostPosition.value = position;
        ghostHeight.value = taskHeight;
      } else {
        previewVisible.value = false;
      }
    })
    .onUpdate((event) => {
      // Check if hovering over remove or cancel buttons and update hover states
      const isOverRemove = isPointInRect(
        event.absoluteX,
        event.absoluteY,
        removeButtonLayout.value,
      );
      const isOverCancel = isPointInRect(
        event.absoluteX,
        event.absoluteY,
        cancelButtonLayout.value,
      );

      // Update hover states
      isRemoveHovered.value = isOverRemove;
      isCancelHovered.value = isOverCancel;

      if (task.scheduled) {
        // Scheduled task: vertical movement only (reordering within timeline)
        translateX.value = event.translationX;
        translateY.value = event.translationY;

        // Update preview position based on current task time and translation
        const basePosition = timeToPosition(taskTime.value);
        const newPosition = basePosition + event.translationY;
        updatePreviewPosition(newPosition, true);
      } else {
        // Unscheduled task: free movement
        translateX.value = event.translationX;
        translateY.value = event.translationY;

        // Check if over timeline
        if (timelineLayout && timelineLayout.value) {
          const isOver =
            event.absoluteY >= timelineLayout.value.y &&
            event.absoluteY <= timelineLayout.value.y + timelineLayout.value.height &&
            event.absoluteX >= timelineLayout.value.x &&
            event.absoluteX <= timelineLayout.value.x + timelineLayout.value.width;

          if (isOver !== isOverTimeline.value) {
            isOverTimeline.value = isOver;
            scale.value = withSpring(isOver ? 1.2 : 1.1);
          }

          // Show preview when over timeline
          if (isOver) {
            const relativePosition =
              event.absoluteY - timelineLayout.value.y + (scrollY ? scrollY.value : 0);
            updatePreviewPosition(relativePosition, true);
          } else {
            previewVisible.value = false;
          }
        }
      }
    })
    .onEnd((event) => {
      // Reset hover states
      isRemoveHovered.value = false;
      isCancelHovered.value = false;

      // Check if drag ended over remove button
      if (isPointInRect(event.absoluteX, event.absoluteY, removeButtonLayout.value)) {
        // Unschedule task - removed from timeline
        runOnJS(onStateChange)(task.id, false, null);
        previewVisible.value = false;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        if (task.scheduled) {
          // Hide ghost square
          ghostVisible.value = false;
        } else {
          isOverTimeline.value = false;
        }
      }
      // Check if drag ended over cancel button
      else if (isPointInRect(event.absoluteX, event.absoluteY, cancelButtonLayout.value)) {
        // Cancel drag action - return to original position
        translateX.value = 0;
        translateY.value = 0;
        previewVisible.value = false;
        if (task.scheduled) {
          // Hide ghost square
          ghostVisible.value = false;
        } else {
          isOverTimeline.value = false;
        }
      } else if (task.scheduled) {
        // Calculate new time from preview position
        const newTime = positionToTime(previewPosition.value);

        // Update task's time value
        taskTime.value = newTime;

        // Update task state
        runOnJS(onStateChange)(task.id, true, newTime);

        // Reset translation since we updated the base position
        translateY.value = 0;
        translateX.value = 0;

        previewVisible.value = false;
        ghostVisible.value = false;
      } else {
        // Unscheduled task logic
        if (isOverTimeline.value) {
          // Calculate time from preview position
          const newTime = positionToTime(previewPosition.value);

          // Schedule task with the calculated time
          runOnJS(onStateChange)(task.id, true, newTime);
        } else {
          // Snap back to original position
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }

        // Hide preview
        previewVisible.value = false;
      }

      scale.value = withSpring(1);
      isPressed.value = false;
      isDragging.value = false; // Reset dragging state to hide action buttons
    });

  // Unified animated styles
  const animatedStyles = useAnimatedStyle(() => {
    if (task.scheduled) {
      // Calculate position from task time
      const position = timeToPosition(taskTime.value);

      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        height: taskHeight,
        top: position,
        zIndex: isPressed.value ? 1000 : index + 1,
        backgroundColor: '#a8e6cf',
        position: 'absolute',
        left: 0,
        right: 0,
        marginHorizontal: 5,
      };
    } else {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        opacity: opacity.value,
        width: TASK_ITEM_WIDTH,
        height: TASK_ITEM_HEIGHT,
        backgroundColor: isOverTimeline.value ? '#a8e6cf' : '#ffd3b6',
        zIndex: isPressed.value ? 1000 : 1,
      };
    }
  });

  // Render task item
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskItem, animatedStyles]}>
        <Text
          style={task.scheduled ? styles.scheduledTaskTitle : styles.taskTitle}
          numberOfLines={1}>
          {task.title}
        </Text>

        {task.scheduled ? (
          // Scheduled task details with time display
          <View style={styles.scheduledTaskDetails}>
            <Text style={styles.scheduledTaskTime}>{formatTimeFromDecimal(task.startTime)}</Text>
            <Text style={styles.scheduledTaskDuration}>{task.duration}h</Text>
          </View>
        ) : (
          // Unscheduled task just shows duration
          <Text style={styles.taskDuration}>{task.duration}h</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const TimelineComponent = () => {
  // Single array of tasks
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const scrollViewRef = useAnimatedRef();
  const timelineLayoutRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);
  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const layoutChanged = useSharedValue(0);

  // Preview animation values
  const previewVisible = useSharedValue(false);
  const previewPosition = useSharedValue(0);
  const previewHeight = useSharedValue(0);
  const ghostVisible = useSharedValue(false);
  const ghostPosition = useSharedValue(0);
  const ghostHeight = useSharedValue(0);

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
      }
    } catch (e) {
      console.log('Measurement error:', e);
    }
  }, [timelineLayoutRef, timelineLayout]);

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

  // We can keep this reaction to ensure measurements are updated when drag state changes
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
  const handleTaskStateChange = (taskId, isScheduled, newStartTime) => {
    setTasks((prev) => {
      return prev.map((task) => {
        if (task.id === taskId) {
          if (isScheduled) {
            return {
              ...task,
              scheduled: true,
              startTime: newStartTime,
            };
          } else {
            return {
              ...task,
              scheduled: false,
              startTime: null,
            };
          }
        }
        return task;
      });
    });
  };

  // Render hour markers
  const renderHours = () => {
    const hourMarkers = [];
    HOURS.forEach((hour, hourIndex) => {
      hourMarkers.push(
        <View key={`hour-${hourIndex}`} style={styles.hourContainer}>
          <Text style={styles.hourText}>{hour}</Text>
          <View style={styles.hourLine} />
        </View>,
      );
      if (hourIndex < HOURS.length - 1) {
        QUARTERS.slice(1).forEach((quarter, qIndex) => {
          hourMarkers.push(
            <View
              key={`hour-${hourIndex}-q-${qIndex}`}
              style={[
                styles.quarterContainer,
                { top: hourIndex * HOUR_HEIGHT + (qIndex + 1) * QUARTER_HEIGHT },
              ]}>
              <Text style={styles.quarterText}>{quarter}</Text>
              <View style={styles.quarterLine} />
            </View>,
          );
        });
      }
    });
    return hourMarkers;
  };

  // Render the UI
  return (
    <View style={styles.container}>
      {/* Unscheduled Tasks Area */}
      <View style={styles.unscheduledArea}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <View style={styles.unscheduledTasksContainer}>
          {tasks
            .filter((task) => !task.scheduled)
            .map((task, idx) => (
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
              />
            ))}
        </View>
      </View>

      {/* Timeline */}
      <Animated.View
        ref={timelineLayoutRef}
        style={styles.timelineContainer}
        onLayout={handleTimelineLayout}>
        <Animated.ScrollView ref={scrollViewRef} scrollEventThrottle={16}>
          <View style={styles.timelineSideBar}>{renderHours()}</View>
          <View style={styles.timelineContent}>
            {/* Preview component */}
            <TimelineIndicator
              visible={previewVisible}
              position={previewPosition}
              height={previewHeight}
              style={{
                backgroundColor: 'rgba(0, 123, 255, 0.4)',
                borderRadius: 8,
                borderWidth: 2,
                borderColor: 'rgba(0, 123, 255, 0.6)',
              }}
            />
            {/* Ghost square component */}
            <GhostSquare visible={ghostVisible} position={ghostPosition} height={ghostHeight} />

            {tasks
              .filter((task) => task.scheduled)
              .map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onStateChange={handleTaskStateChange}
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
                />
              ))}
          </View>
        </Animated.ScrollView>
      </Animated.View>

      {/* Drag action buttons - now passing individual button layout handler */}
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

// Styles with additions for action buttons
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  unscheduledArea: {
    height: '15%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'rgba(152, 16, 16, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  unscheduledTasksContainer: {
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineSideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TIMELINE_OFFSET,
    height: '100%',
    zIndex: 10,
  },
  timelineContent: {
    marginLeft: TIMELINE_OFFSET,
    position: 'relative',
    minHeight: HOURS.length * HOUR_HEIGHT,
  },
  hourContainer: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hourText: { fontSize: 12, color: '#333' },
  hourLine: {
    position: 'absolute',
    right: 0,
    left: TIMELINE_OFFSET,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  quarterContainer: {
    position: 'absolute',
    left: 0,
    width: TIMELINE_OFFSET,
    height: QUARTER_HEIGHT,
    justifyContent: 'top',
    paddingHorizontal: 10,
  },
  quarterText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    width: '100%',
    paddingRight: 35,
  },
  quarterLine: {
    position: 'absolute',
    right: 0,
    left: TIMELINE_OFFSET - 20,
    height: 1,
    backgroundColor: '#e8e8e8',
  },
  // Base task item shared styles
  taskItem: {
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  // Text styles
  taskTitle: { fontWeight: '600', fontSize: 16 },
  taskDuration: { fontSize: 14, color: '#555' },
  scheduledTaskTitle: { fontWeight: '600', fontSize: 16 },
  scheduledTaskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  scheduledTaskTime: { fontSize: 12, color: '#444', fontWeight: '500' },
  scheduledTaskDuration: { fontSize: 12, color: '#555' },
  // Action buttons styles
  actionButton: {
    width: 120,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgb(224, 133, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
});

export default TimelineComponent;
