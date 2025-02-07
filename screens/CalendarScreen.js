import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import { useCalendarStore } from '../store/calendarStore';
import { useTaskStore } from '../store/taskStore';
import TaskModal from '../components/TaskModal';
import { startOfWeek, endOfWeek } from 'date-fns';
import { generateWeekDays } from '../utilities/dateUtils';

export default function CalendarScreen() {
    const { events, loadCalendarEvents } = useCalendarStore();
    const { tasks, loadTasks, addTask } = useTaskStore();

    const [isModalVisible, setModalVisible] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState('Medium');
    const [taskDueDate, setTaskDueDate] = useState(new Date());
    const [today, setToday] = useState(new Date());
    const [currentWeek, setCurrentWeek] = useState([]);

    useEffect(() => {
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        loadCalendarEvents(start, end);  
        loadTasks();
        setCurrentWeek(generateWeekDays());
    }, []);

    // Save new task using `taskStore.js`
    const handleSaveTask = async () => {
        await addTask(taskTitle, taskPriority, taskDueDate);
        setModalVisible(false);
    };

    const todayFormatted = today.toDateString();
    const todayTasks = [...tasks.high, ...tasks.medium, ...tasks.low].filter(task =>
        new Date(task.dueDate).toDateString() === todayFormatted
    );

    return (
        <View testID="calendar-screen" style={styles.container}>
            <Text style={styles.header}>This Week</Text>
            <View style={styles.weekGrid}>
                {currentWeek.map((day, index) => {
                    const isToday = day.toDateString() === today.toDateString();
                    const dayEvents = events.filter(event => new Date(event.startDate).toDateString() === day.toDateString());
                    const dayTasks = [...tasks.high, ...tasks.medium, ...tasks.low].filter(task => new Date(task.dueDate).toDateString() === day.toDateString());

                    return (
                        <View key={index} style={[styles.dayBox, isToday && styles.todayBox]}>
                            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                            <View style={styles.dayBoxItems}>
                                {dayEvents.map((event, idx) => (
                                    <Text key={`event-${idx}`} style={styles.eventItem} numberOfLines={1} ellipsizeMode='tail'>{event.title}</Text>
                                ))}
                                {dayTasks.map((task, idx) => (
                                    <Text key={`task-${idx}`} style={styles.taskItem} numberOfLines={1} ellipsizeMode='tail'>{task.title}</Text>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.header}>Today</Text>
            <View style={styles.timelineContainer}>
                <ScrollView>
                    {todayTasks.length === 0 ? (
                        <Text style={styles.noTasksText}>No tasks scheduled for today.</Text>
                    ) : (
                        todayTasks.map((item, index) => (
                            <View key={index} style={styles.timelineItem}>
                                <Text style={styles.timelineText}>{item.title}</Text>
                                <Text style={styles.statusIcon}>○</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

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
