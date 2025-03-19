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

// Helper function to format a decimal hour (e.g., 9.25) into a time string.
const formatTimeFromDecimal = (decimalHour) => {
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const QUARTER_HEIGHT = HOUR_HEIGHT / 4; // 15-minute increments
const TASK_ITEM_HEIGHT = 50;
const TASK_ITEM_WIDTH = 120;
// We retain these constants for styling purposes, but our drop logic will be based on measured layouts.
const TIMELINE_OFFSET = SCREEN_WIDTH * 0.25;
const UNSCHEDULED_AREA_HEIGHT = 150;

// Sample data – in a real app this might come from props or remote data.
const INITIAL_TASKS = [
  { id: '1', title: 'Meeting', duration: 1 },
  { id: '2', title: 'Lunch', duration: 1.5 },
  { id: '3', title: 'Workout', duration: 2 },
  { id: '4', title: 'Call Mom', duration: 0.5 },
  { id: '5', title: 'Project Work', duration: 0.75 },
];

const HOURS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
});

const QUARTERS = ['00', '15', '30', '45'];

const TimelineComponent = () => {
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState(INITIAL_TASKS);

  const scrollViewRef = useAnimatedRef();
  const timelineLayoutRef = useAnimatedRef();
  const scrollY = useScrollViewOffset(scrollViewRef);

  // This shared value will store our timeline layout measurements
  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  // Track when layout changes to trigger measurements
  const layoutChanged = useSharedValue(0);

  // Use a Reanimated worklet to measure the timeline
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

  // Handle the onLayout event
  const handleTimelineLayout = useCallback(
    (event) => {
      const { width, height } = event.nativeEvent.layout;
      layoutChanged.value += 1;

      // For iOS, we need to wait a frame for accurate measurements
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

  // React to layout changes with useAnimatedReaction
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
    // Small delay to ensure the component is fully rendered
    const timer = requestAnimationFrame(() => {
      runOnUI(measureTimelineOnUI)();
    });
    return () => cancelAnimationFrame(timer);
  }, [measureTimelineOnUI]);

  // Render hour markers and quarter-hour markers for the timeline.
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

  // Aligns the dropped position to the nearest 15-minute interval.
  const calculateAlignedPosition = (rawPosition) => {
    console.log('Calculating aligned position for raw position:', rawPosition);
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

  // When a task is dropped over the timeline, this handler is called.
  const handleScheduleTask = (taskId, relativeY, scrollYValue) => {
    console.log(
      'Scheduling task:',
      taskId,
      'at relative Y:',
      relativeY,
      'with scroll Y:',
      scrollYValue,
    );
    const task = unscheduledTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Use the relative Y (measured from timelineLayout) plus any scroll offset.
    const positionData = calculateAlignedPosition(relativeY + scrollYValue);

    const newScheduledTask = {
      ...task,
      ...positionData,
    };

    setScheduledTasks((prev) => [...prev, newScheduledTask]);
    setUnscheduledTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <View style={styles.container}>
      {/* Unscheduled Tasks Area */}
      <View style={styles.unscheduledArea}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <View style={styles.unscheduledTasksContainer}>
          {unscheduledTasks.map((task) => (
            <UnscheduledTaskItem
              key={task.id}
              task={task}
              onScheduleTask={handleScheduleTask}
              scrollY={scrollY}
              timelineLayout={timelineLayout}
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
            {scheduledTasks.map((task, index) => (
              <ScheduledTaskItem
                key={task.id}
                task={task}
                index={index}
                calculateAlignedPosition={calculateAlignedPosition}
                scheduledTasks={scheduledTasks}
                setScheduledTasks={setScheduledTasks}
                unscheduledTasks={unscheduledTasks}
                setUnscheduledTasks={setUnscheduledTasks}
              />
            ))}
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

// Unscheduled task items that can be dragged onto the timeline.
const UnscheduledTaskItem = ({ task, onScheduleTask, scrollY, timelineLayout }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isActive = useSharedValue(false);
  const opacity = useSharedValue(1);

  // Save the original position to return to if not dropped on the timeline.
  const originalX = useSharedValue(0);
  const originalY = useSharedValue(0);
  // Track if the dragged item is over the timeline.
  const isOverTimeline = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      scale.value = withSpring(1.1);
      originalX.value = translateX.value;
      originalY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = originalX.value + event.translationX;
      translateY.value = originalY.value + event.translationY;

      // Use the dynamically measured timelineLayout to check boundaries.
      let isOver = false;

      isOver =
        event.absoluteY >= timelineLayout.value.y &&
        event.absoluteY <= timelineLayout.value.y + timelineLayout.value.height &&
        event.absoluteX >= timelineLayout.value.x &&
        event.absoluteX <= timelineLayout.value.x + timelineLayout.value.width;

      if (isOver !== isOverTimeline.value) {
        console.log('event.absoluteY', event.absoluteY);
        console.log('timelineLayout.y', timelineLayout.value.y);
        isOverTimeline.value = isOver;
        scale.value = withSpring(isOver ? 1.2 : 1.1);
      }
    })
    .onEnd((event) => {
      if (isOverTimeline.value) {
        // Compute the drop position relative to the timeline.
        const relativePosition = event.absoluteY - timelineLayout.value.y;
        runOnJS(onScheduleTask)(task.id, relativePosition, scrollY.value);
        opacity.value = withTiming(0);
      } else {
        // Snap back to the original position.
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
      isActive.value = false;
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      backgroundColor: isOverTimeline.value ? '#a8e6cf' : '#ffd3b6',
      zIndex: isActive.value ? 1000 : 1,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskItem, animatedStyles]}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={styles.taskDuration}>{task.duration}h</Text>
      </Animated.View>
    </GestureDetector>
  );
};

// Scheduled tasks on the timeline that can be reordered.
const ScheduledTaskItem = ({
  task,
  index,
  calculateAlignedPosition,
  scheduledTasks,
  setScheduledTasks,
  unscheduledTasks,
  setUnscheduledTasks,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isActive = useSharedValue(false);

  const durationQuarters = Math.round(task.duration * 4);
  const taskHeight = durationQuarters * QUARTER_HEIGHT;
  const topPosition = task.position || 0;

  const updateTaskPosition = useCallback(
    (taskId, newPosition) => {
      setScheduledTasks((prev) => {
        const taskIndex = prev.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return prev;
        const positionData = calculateAlignedPosition(newPosition);
        const newTasks = [...prev];
        newTasks[taskIndex] = {
          ...newTasks[taskIndex],
          ...positionData,
        };
        return newTasks;
      });
    },
    [setScheduledTasks, calculateAlignedPosition],
  );

  const removeFromTimeline = useCallback(
    (taskId) => {
      const task = scheduledTasks.find((t) => t.id === taskId);
      if (!task) return;
      setUnscheduledTasks((prev) => [
        ...prev,
        {
          id: task.id,
          title: task.title,
          duration: task.duration,
        },
      ]);
      setScheduledTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [scheduledTasks, setScheduledTasks, setUnscheduledTasks],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const newPosition = topPosition + event.translationY;
      // Optionally, you might also transition to a dynamic boundary here.
      if (event.absoluteX < TIMELINE_OFFSET) {
        runOnJS(removeFromTimeline)(task.id);
      } else {
        runOnJS(updateTaskPosition)(task.id, newPosition);
        translateY.value = withSpring(0);
      }
      scale.value = withSpring(1);
      isActive.value = false;
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      zIndex: isActive.value ? 1000 : index + 1,
      height: taskHeight,
      top: topPosition,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.scheduledTaskItem, animatedStyles]}>
        <Text style={styles.scheduledTaskTitle}>{task.title}</Text>
        <View style={styles.scheduledTaskDetails}>
          <Text style={styles.scheduledTaskTime}>{task.displayTime || ''}</Text>
          <Text style={styles.scheduledTaskDuration}>{task.duration}h</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

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
  taskItem: {
    width: TASK_ITEM_WIDTH,
    height: TASK_ITEM_HEIGHT,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffd3b6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskTitle: { fontWeight: '600', fontSize: 16 },
  taskDuration: { fontSize: 14, color: '#555' },
  timelineContainer: {
    flex: 1,
    backgroundColor: 'blue',
    // paddingTop: 400,
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
  scheduledTaskItem: {
    position: 'absolute',
    left: 0,
    right: 0,
    margin: 5,
    backgroundColor: '#a8e6cf',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
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
