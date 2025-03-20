import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
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

// Preview component for task placement
const TimelinePreview = ({ previewVisible, previewPosition, previewHeight }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: previewPosition.value,
      height: previewHeight.value,
      backgroundColor: 'rgba(0, 123, 255, 0.4)',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'rgba(0, 123, 255, 0.6)',
      marginHorizontal: 5,
      opacity: previewVisible.value ? 1 : 0,
      zIndex: 500,
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
}) => {
  // Shared animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPressed = useSharedValue(false);
  const isOverTimeline = useSharedValue(false);

  // Task-specific animation value that represents its time position
  // This will be the source of truth for positioning
  const taskTime = useSharedValue(task.startTime || MIN_HOUR);

  // Calculate height based on duration
  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = task.scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;

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
    .onStart(() => {
      isPressed.value = true;
      scale.value = withSpring(task.scheduled ? 1.05 : 1.1);

      // Initialize preview for scheduled tasks
      if (task.scheduled) {
        const position = timeToPosition(taskTime.value);
        previewVisible.value = true;
        previewPosition.value = position;
        previewHeight.value = taskHeight;
      } else {
        previewVisible.value = false;
      }
    })
    .onUpdate((event) => {
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
      if (task.scheduled) {
        // Calculate new position
        const basePosition = timeToPosition(taskTime.value);
        const newPosition = basePosition + event.translationY;

        if (event.absoluteX < TIMELINE_OFFSET) {
          // Unschedule task - removed from timeline
          runOnJS(onStateChange)(task.id, false, null);
          previewVisible.value = false;
        } else {
          // Calculate new time from preview position
          const newTime = positionToTime(previewPosition.value);

          // Update task's time value
          taskTime.value = newTime;

          // Update task state
          runOnJS(onStateChange)(task.id, true, newTime);

          // // Reset translation since we updated the base position
          translateY.value = 0;
          translateX.value = 0;

          previewVisible.value = false;
        }
      } else {
        // Unscheduled task logic
        if (isOverTimeline.value) {
          // Calculate time from preview position
          const newTime = positionToTime(previewPosition.value);

          // translateY.value = withTiming(previewPosition.value);
          // taskTime.value = newTime;

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
            <TimelinePreview
              previewVisible={previewVisible}
              previewPosition={previewPosition}
              previewHeight={previewHeight}
            />

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
                />
              ))}
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

// Styles remain mostly the same with some adjustments
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
    // backgroundColor: 'blue',
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
});

export default TimelineComponent;
