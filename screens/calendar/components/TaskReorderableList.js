import React, { useState, memo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import ReorderableList, {
  ReorderableListReorderEvent,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list';
import { fromDateId } from '@marceloterreiro/flash-calendar';
import { format } from 'date-fns';
import { useTaskStore } from '../../../store/taskStore';

// Task card component
const TaskCard = memo(({ id, title, priority, date }) => {
  const drag = useReorderableDrag();
  const priorityColors = {
    High: '#FF6B6B',
    Medium: '#FFD166',
    Low: '#06D6A0',
  };

  return (
    <Pressable
      style={[styles.taskCard, { borderLeftColor: priorityColors[priority] }]}
      onLongPress={drag}>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{title}</Text>
        {date && <Text style={styles.taskDate}>{date}</Text>}
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: priorityColors[priority] }]}>
        <Text style={styles.priorityText}>{priority}</Text>
      </View>
    </Pressable>
  );
});

TaskCard.displayName = 'TaskCard';

// ReorderableTaskList component
const TaskReorderableList = ({ selectedDate }) => {
  // Get tasks selector from store
  const getTasksOnDate = useTaskStore((state) => state.getTasksOnDate);
  const [displayTasks, setDisplayTasks] = useState([]);

  // Update displayed tasks when selected date changes
  useEffect(() => {
    if (selectedDate) {
      // Convert dateId to Date object
      const dateObj = fromDateId(selectedDate);

      // Get tasks for this date
      const tasksForDate = getTasksOnDate(dateObj);

      // Format tasks for display with random time between 9am and 6pm
      const formattedTasks = tasksForDate.map((task) => {
        const taskDate = new Date(task.dueDate);

        // Generate random hour between 9 and 18 (6 PM)
        const randomHour = Math.floor(Math.random() * (18 - 9 + 1)) + 9;
        // Generate random minute (0-59)
        const randomMinute = Math.floor(Math.random() * 60);

        taskDate.setHours(randomHour, randomMinute);

        return {
          id: task.id,
          title: task.title,
          priority: task.priority,
          date: format(taskDate, 'h:mm a'),
          originalTask: task,
          timestamp: taskDate.getTime(), // Add timestamp for sorting
        };
      });

      // Sort tasks by time before setting state
      const sortedTasks = formattedTasks.sort((a, b) => a.timestamp - b.timestamp);
      setDisplayTasks(sortedTasks);
    }
  }, [selectedDate, getTasksOnDate]);

  const handleReorder = useCallback(({ from, to }) => {
    setDisplayTasks((value) => reorderItems(value, from, to));
    console.log(`Moved task from position ${from} to ${to}`);
    // Note: This only reorders the display list, not the underlying data
    // To persist this order, we would need additional logic to update the task repository
  }, []);

  const renderItem = useCallback(({ item }) => <TaskCard {...item} />, []);

  return (
    <View style={styles.container}>
      <Text style={styles.listTitle}>
        Tasks for {selectedDate ? format(fromDateId(selectedDate), 'MMMM d, yyyy') : 'Today'}
      </Text>
      <Text style={styles.listSubtitle}>Long press and drag to reorder</Text>
      {displayTasks.length > 0 ? (
        <ReorderableList
          data={displayTasks}
          onReorder={handleReorder}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          //   autoscrollActivationDelta={20}
          //   autoscrollDelay={500}
          //   autoscrollThresholdOffset={{ top: 0, bottom: 0 }}
          //   autoscrollThreshold={0.15}
        />
      ) : (
        <Text style={styles.emptyMessage}>No tasks for this day</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginHorizontal: 16,
    color: '#333',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
  },
  taskDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
});

export default TaskReorderableList;
