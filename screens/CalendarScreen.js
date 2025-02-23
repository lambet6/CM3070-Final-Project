/*global setInterval, clearInterval*/
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
// setInterval and clearInterval are global, no import necessary
import { useCalendarStore } from '../store/calendarStore';
import { useTaskStore } from '../store/taskStore';
import TaskModal from '../components/TaskModal';
import { useFocusEffect } from '@react-navigation/native';
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export default function CalendarScreen() {
  const { events, loadCalendarEvents } = useCalendarStore();
  const { getTodayTasks, getWeekTasks, addTask, toggleCompleteTask } = useTaskStore();

  // Move date calculations outside effect
  const today = useRef(new Date()).current;
  const weekStart = useRef(startOfWeek(today, { weekStartsOn: 1 })).current;
  const weekEnd = useRef(endOfWeek(today, { weekStartsOn: 1 })).current;
  const weekDays = useRef(eachDayOfInterval({ start: weekStart, end: weekEnd })).current;

  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(today);
  const [currentWeek, setCurrentWeek] = useState(weekDays);

  // Initial setup effect
  useEffect(() => {
    setCurrentWeek(weekDays);
  }, []); // Empty deps since weekDays is stable

  useFocusEffect(
    React.useCallback(() => {
      loadCalendarEvents();

      const interval = setInterval(() => {
        console.log('🔄 Checking for new events...');
        loadCalendarEvents();
      }, 5000);

      return () => clearInterval(interval);
    }, [loadCalendarEvents]),
  );

  // Get pre-filtered tasks from Zustand store
  const todayTasks = getTodayTasks();
  const weekTasks = getWeekTasks();

  return (
    <View testID="calendar-screen" style={styles.container}>
      {/* Weekly View */}
      <Text style={styles.header}>This Week</Text>
      <View style={styles.weekGrid}>
        {currentWeek.map((day, index) => {
          const isToday = day.toDateString() === today.toDateString();
          const dayEvents = events.filter(
            (event) => event.startDate.toDateString() === day.toDateString(),
          );
          const dayTasks = weekTasks.filter(
            (task) => new Date(task.dueDate).toDateString() === day.toDateString(),
          );

          return (
            <View key={index} style={[styles.dayBox, isToday && styles.todayBox]}>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <View style={styles.dayBoxItems}>
                {dayEvents.map((event, idx) => (
                  <Text
                    key={`event-${idx}`}
                    style={styles.eventItem}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {event.title}
                  </Text>
                ))}
                {dayTasks.map((task, idx) => (
                  <Text
                    key={`task-${idx}`}
                    style={styles.taskItem}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {task.title}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Daily Tasks */}
      <Text style={styles.header}>Today</Text>
      <View style={styles.timelineContainer}>
        <ScrollView>
          {todayTasks.length === 0 ? (
            <Text style={styles.noTasksText}>No tasks scheduled for today.</Text>
          ) : (
            todayTasks.map((task, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.timelineItem, task.completed && styles.completedTask]}
                onPress={() => toggleCompleteTask(task.id)} // ✅ Toggle completion on tap
              >
                <Text style={[styles.timelineText, task.completed && styles.strikethrough]}>
                  {task.title}
                </Text>
                <Text style={[styles.statusIcon, task.completed && styles.completedText]}>
                  {task.completed ? '☑' : '☐'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        testID="fab-add-task"
        style={styles.fab}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TaskModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => {
          addTask(taskTitle, taskPriority, taskDueDate);
          setModalVisible(false);
        }}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskDueDate={taskDueDate}
        setTaskDueDate={setTaskDueDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayBox: {
    width: '25%',
    aspectRatio: 1,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBox: {
    backgroundColor: '#bbb',
    borderWidth: 5,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dayBoxItems: {
    width: '100%',
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#777',
    color: 'white',
    fontSize: 10,
    padding: 2,
    marginTop: 1,
    borderRadius: 3,
  },
  taskItem: {
    backgroundColor: 'lightblue',
    color: 'black',
    fontSize: 10,
    padding: 2,
    marginTop: 1,
    borderRadius: 3,
  },
  timelineContainer: {
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    padding: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eee',
    padding: 12,
    marginBottom: 4,
    borderRadius: 4,
  },
  timelineText: {
    fontSize: 16,
  },
  completedTask: {
    backgroundColor: '#d3d3d3', // Light gray for completed tasks
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#777',
  },
  statusIcon: {
    fontSize: 20,
  },
  completedText: {
    color: '#777',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'blue',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
  },
});
