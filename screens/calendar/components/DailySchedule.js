import React, { useCallback, useState, useEffect } from 'react';
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
} from 'react-native-reanimated';

// Constants remain the same
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const QUARTER_HEIGHT = HOUR_HEIGHT / 4; // 15-minute increments
const TASK_ITEM_HEIGHT = 50;
const TASK_ITEM_WIDTH = 120;
const TIMELINE_OFFSET = SCREEN_WIDTH * 0.25;

// Sample data transformed to have a scheduled property
const INITIAL_TASKS = [
  { id: '1', title: 'Meeting', duration: 1, scheduled: false },
  { id: '2', title: 'Lunch', duration: 1.5, scheduled: false },
  { id: '3', title: 'Workout', duration: 2, scheduled: false },
  { id: '4', title: 'Call Mom', duration: 0.5, scheduled: false },
  { id: '5', title: 'Project Work', duration: 0.75, scheduled: false },
];

const HOURS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
});

const QUARTERS = ['00', '15', '30', '45'];

// Helper function to format time (unchanged)
const formatTimeFromDecimal = (decimalHour) => {
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

const TaskItem = ({
  task,
  index,
  onSchedule,
  onUnschedule,
  onUpdatePosition,
  scrollY,
  timelineLayout,
  calculateAlignedPosition,
}) => {
  // Shared animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isPressed = useSharedValue(false);

  // Values primarily used for unscheduled tasks
  const originalX = useSharedValue(0);
  const originalY = useSharedValue(0);
  const isOverTimeline = useSharedValue(false);

  // Calculate values based on scheduled state
  const { scheduled } = task;
  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = scheduled ? durationQuarters * QUARTER_HEIGHT : TASK_ITEM_HEIGHT;
  const topPosition = scheduled ? task.position || 0 : 0;

  // Reset values when scheduled state changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    opacity.value = 1;
    isPressed.value = false;
    isOverTimeline.value = false;
  }, [scheduled]);

  // Pan gesture with conditional logic based on scheduled state
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isPressed.value = true;
      scale.value = withSpring(scheduled ? 1.05 : 1.1);
      // No need to track original position for unscheduled tasks
    })
    .onUpdate((event) => {
      if (scheduled) {
        // Scheduled task: vertical movement only (reordering within timeline)
        translateY.value = event.translationY;
      } else {
        // Unscheduled task: free movement - can use event.translationX/Y directly
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
        }
      }
    })
    .onEnd((event) => {
      if (scheduled) {
        console.log('scheduled originalY', originalY.value);
        // Scheduled task logic
        const newPosition = topPosition + event.translationY;

        // Check if dragged off timeline (to the left)
        if (event.absoluteX < TIMELINE_OFFSET) {
          runOnJS(onUnschedule)(task.id);
        } else {
          // Update position on timeline
          runOnJS(onUpdatePosition)(task.id, newPosition);
          translateY.value = withSpring(0);
        }
      } else {
        console.log('unscheduled originalY', originalY.value);
        // Unscheduled task logic
        if (isOverTimeline.value) {
          // Calculate drop position on timeline
          const relativePosition = event.absoluteY - timelineLayout.value.y;
          runOnJS(onSchedule)(task.id, relativePosition, scrollY ? scrollY.value : 0);
          opacity.value = withTiming(0); // Fade out as it transitions to scheduled
        } else {
          // Snap back to original position
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
      }

      scale.value = withSpring(1);
      isPressed.value = false;
    });

  // Conditional animated styles
  const animatedStyles = useAnimatedStyle(() => {
    if (scheduled) {
      // Styles for scheduled tasks
      return {
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
        height: taskHeight,
        top: topPosition,
        zIndex: isPressed.value ? 1000 : index + 1,
        backgroundColor: '#a8e6cf',
        position: 'absolute',
        left: 0,
        right: 0,
        margin: 5,
      };
    } else {
      // Styles for unscheduled tasks
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

  // Render with content based on scheduled state
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskItem, animatedStyles]}>
        <Text style={scheduled ? styles.scheduledTaskTitle : styles.taskTitle} numberOfLines={1}>
          {task.title}
        </Text>

        {scheduled ? (
          // Scheduled task details with time display
          <View style={styles.scheduledTaskDetails}>
            <Text style={styles.scheduledTaskTime}>{task.displayTime || ''}</Text>
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

// Main timeline component with unified task management
const TimelineComponent = () => {
  // Single array of tasks
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const scrollViewRef = useAnimatedRef();
  const timelineLayoutRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);
  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const layoutChanged = useSharedValue(0);

  // Timeline measurement logic remains the same
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
        console.log('Timeline measured on UI thread:', timelineLayout.value);
      }
    } catch (e) {
      console.log('Measurement error:', e);
    }
  }, [timelineLayoutRef, timelineLayout]);

  // Handle layout events (unchanged)
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

  // Measure on mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      runOnUI(measureTimelineOnUI)();
    });
    return () => cancelAnimationFrame(timer);
  }, [measureTimelineOnUI]);

  // Aligns position to nearest 15-minute interval
  const calculateAlignedPosition = (rawPosition) => {
    const totalQuarters = Math.floor(rawPosition / QUARTER_HEIGHT);
    const hourQuarters = totalQuarters % 4;
    const baseHour = Math.floor(totalQuarters / 4) + 8; // Starting at 8 AM

    const startTime = baseHour + hourQuarters * 0.25;
    const alignedPosition = (baseHour - 8) * HOUR_HEIGHT + hourQuarters * QUARTER_HEIGHT;

    return {
      startHour: startTime,
      position: alignedPosition,
      displayTime: formatTimeFromDecimal(startTime),
    };
  };

  // Schedule a task (move to timeline)
  const handleScheduleTask = (taskId, relativeY, scrollYValue) => {
    console.log(
      'Scheduling task:',
      taskId,
      'at relative Y:',
      relativeY,
      'with scroll Y:',
      scrollYValue,
    );

    setTasks((prev) => {
      return prev.map((task) => {
        if (task.id === taskId) {
          const positionData = calculateAlignedPosition(relativeY + scrollYValue);
          return {
            ...task,
            scheduled: true,
            ...positionData,
          };
        }
        return task;
      });
    });
  };

  // Unschedule a task (move back to task list)
  const handleUnscheduleTask = (taskId) => {
    setTasks((prev) => {
      return prev.map((task) => {
        if (task.id === taskId) {
          // Reset position properties but keep task data
          const { position, startHour, displayTime, ...baseTask } = task;
          return {
            ...baseTask,
            scheduled: false,
          };
        }
        return task;
      });
    });
  };

  // Update task position on timeline
  const handleUpdateTaskPosition = (taskId, newPosition) => {
    setTasks((prev) => {
      return prev.map((task) => {
        if (task.id === taskId) {
          const positionData = calculateAlignedPosition(newPosition);
          return { ...task, ...positionData };
        }
        return task;
      });
    });
  };

  // Render hour markers (unchanged)
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
            .map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                index={0}
                onSchedule={handleScheduleTask}
                scrollY={scrollY}
                timelineLayout={timelineLayout}
                calculateAlignedPosition={calculateAlignedPosition}
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
            {tasks
              .filter((task) => task.scheduled)
              .map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onUnschedule={handleUnscheduleTask}
                  onUpdatePosition={handleUpdateTaskPosition}
                  timelineLayout={timelineLayout}
                  calculateAlignedPosition={calculateAlignedPosition}
                />
              ))}
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

// Styles remain mostly the same with some adjustments for unified task items
const styles = StyleSheet.create({
  // Base styles (container, timeline, etc. remain the same)
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
    // flex: 1,
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

  timelineSideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TIMELINE_OFFSET,
    height: '100%',
    // backgroundColor: 'green',
    zIndex: 10,
  },
  timelineContent: {
    backgroundColor: 'orange',
    marginLeft: TIMELINE_OFFSET,
    position: 'relative',
    // minHeight: '100%',
    minHeight: HOURS.length * HOUR_HEIGHT,
    // flex: 1,
  },
  hourContainer: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hourText: { fontSize: 14, color: '#333' },
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
    justifyContent: 'center',
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
});

export default TimelineComponent;
