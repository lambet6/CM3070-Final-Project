import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { getWeeklyCalendarData } from './services/calendar-manager';
import { createNewTask } from './services/task-manager';
import { startOfWeek, endOfWeek } from './utilities/dateUtils';
import { format } from 'date-fns'; 
import TaskModal from './components/TaskModal';  

export default function CalendarScreen() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [today, setToday] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState([]);
  
  // State for modal
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());

  useEffect(() => {
    loadWeeklyData();
    generateWeekDays();
  }, []);

  async function loadWeeklyData() {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    const { events: calEvents, tasks: weeklyTasks } = await getWeeklyCalendarData(start, end);
    setEvents(calEvents);
    setTasks(weeklyTasks);
  }

  function generateWeekDays() {
    const start = startOfWeek(today);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      weekDays.push(day);
    }
    setCurrentWeek(weekDays);
  }

  const todayTasks = tasks.filter((task) =>
    format(new Date(task.dueDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );
  const todayEvents = events.filter((event) =>
    format(new Date(event.startDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  // Open modal for adding a new task
  const openAddModal = () => {
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
    setModalVisible(true);
  };

  // Save the new task using TaskManager
  const handleSaveTask = async () => {
    try {
      const updatedTasks = await createNewTask(taskTitle, taskPriority, taskDueDate);
      setTasks(updatedTasks.low.concat(updatedTasks.medium, updatedTasks.high)); // Update tasks state
      
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <View testID="calendar-screen" style={styles.container}>
      
      {/* Header */}
      <Text style={styles.header}>This Week</Text>

      {/* Weekly View */}
      <View style={styles.weekGrid}>
        {currentWeek.map((day, index) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          const dayEvents = events.filter(
            (event) => format(new Date(event.startDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
          const dayTasks = tasks.filter(
            (task) => format(new Date(task.dueDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );

          return (
            <View key={index} style={[styles.dayBox, isToday && styles.todayBox]}>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{format(day, 'E')}</Text> 
              <View style={styles.dayBoxItems}>
                {dayEvents.map((event, idx) => (
                  <Text key={`event-${idx}`} style={styles.eventItem} numberOfLines={1} ellipsizeMode='tail'>{event.title}</Text>
                ))}
                {dayTasks.map((task, idx) => (
                  <Text key={`task-${idx}`} style={styles.taskItem}>{task.title}</Text>
                ))}
              </View> 
            </View>
          );
        })}
      </View>

      {/* Today's Timeline */}
      <Text style={styles.header}>Today</Text>
      <View style={styles.timelineContainer}>
        <ScrollView>
          {[...todayEvents, ...todayTasks].map((item, index) => {
            const isCompleted = item.status === 'completed';
            return (
              <View key={index} style={styles.timelineItem}>
                <Text style={[styles.timelineText, isCompleted && styles.completedText]}>
                  {item.title}
                </Text>
                <Text style={styles.statusIcon}>
                  {isCompleted ? "✔" : "○"}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ✅ Task Modal */}
      <TaskModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTask}
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
    backgroundColor: '#F5F5F5'
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  dayBox: {
    width: '25%',
    aspectRatio: 1,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  todayBox: {
    backgroundColor: '#bbb',
    borderWidth:5,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  dayBoxItems: {
    width:'100%',
    flex:1
  },
  eventItem: {
    backgroundColor: '#777',
    color: 'white',
    fontSize: 10,
    padding: 2,
    marginTop: 1,
    borderRadius: 3
  },
  taskItem: {
    backgroundColor: 'lightblue',
    color: 'black',
    fontSize: 10,
    padding: 2,
    marginTop: 1,
    borderRadius: 3
  },
  timelineContainer: {
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    padding: 10
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  timelineText: {
    fontSize: 16
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#777'
  },
  statusIcon: {
    fontSize: 20
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
    alignItems: 'center'
  },
  fabText: {
    color: '#fff',
    fontSize: 30
  }
});
