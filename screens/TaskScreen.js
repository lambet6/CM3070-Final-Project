import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTaskStore } from '../store/taskStore'; 
import TaskModal from '../components/TaskModal';

export default function TasksScreen() {
  const { tasks, loadTasks, addTask, editTask, toggleCompleteTask } = useTaskStore(); // Global task store
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTasks(); // Fetch tasks on mount
  }, [loadTasks]);

  // Handle adding or editing a task
  const handleSaveTask = async () => {
    try {
      setError(null);
      if (editingTaskId) {
        await editTask(editingTaskId, taskTitle, taskPriority, taskDueDate);
      } else {
        await addTask(taskTitle, taskPriority, taskDueDate);
      }
      setModalVisible(false);
      resetTaskForm();
    } catch (error) {
      setError(error.message);
    }
  };

  // Open modal for adding a new task
  const openAddModal = () => {
    resetTaskForm();
    setModalVisible(true);
  };

  // Open modal for editing an existing task
  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskPriority(task.priority);
    setTaskDueDate(new Date(task.dueDate));
    setModalVisible(true);
  };

  // Reset task form
  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
  };

  const renderTaskItem = (task) => (
    <TouchableOpacity
      style={[styles.taskItem, task.completed && styles.completedTask]}
      onLongPress={() => openEditModal(task)}
      onPress={() => toggleCompleteTask(task.id)}>
      <Text style={[styles.taskText, task.completed && styles.strikethrough]}>
        {task.title} — {task.dueDate.toDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}
      {/* High Priority Tasks */}
      <Text style={styles.priorityHeader}>High Priority</Text>
      <FlatList
        data={tasks.high}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Medium Priority Tasks */}
      <Text style={styles.priorityHeader}>Medium Priority</Text>
      <FlatList
        data={tasks.medium}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Low Priority Tasks */}
      <Text style={styles.priorityHeader}>Low Priority</Text>
      <FlatList
        data={tasks.low}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Floating Add Button */}
      <TouchableOpacity testID="fab-add-task" style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Task Modal */}
      <TaskModal
        visible={isModalVisible}
        onSave={handleSaveTask}
        onClose={() => setModalVisible(false)}
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  priorityHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: '#eee',
    padding: 12,
    marginBottom: 4,
    borderRadius: 4,
  },
  completedTask: {
    backgroundColor: '#d3d3d3', // Light gray background for completed tasks
  },
  taskText: {
    fontSize: 16,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#888', // Dimmed color for completed tasks
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
  errorMessage: {
    color: 'red',
    padding: 10,
    marginBottom: 10,
  },
});
