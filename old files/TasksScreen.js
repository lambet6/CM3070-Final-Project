import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Pressable,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { getTasks, createNewTask, editExistingTask } from './services/task-manager';
import TaskModal from './components/TaskModal';  // ✅ Import new modal

export default function TasksScreen() {
  const [tasks, setTasks] = useState({ high: [], medium: [], low: [] });

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());

  // Load tasks on mount
  useEffect(() => {
    loadAndSetTasks();
  }, []);

  const loadAndSetTasks = async () => {
    const groupedTasks = await getTasks();
    setTasks(groupedTasks);
  };

  // Open modal to add a task
  const openAddModal = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
    setModalVisible(true);
  };

  // Open modal to edit a task
  const openEditModal = (taskId, title, priority, dueDateString) => {
    setEditingTaskId(taskId);
    setTaskTitle(title);
    setTaskPriority(priority);
    setTaskDueDate(dueDateString ? new Date(dueDateString) : new Date());
    setModalVisible(true);
  };

  // Save (Create or Edit) the Task
  const handleSaveTask = async () => {
    let updatedTasks;
    if (editingTaskId) {
      updatedTasks = await editExistingTask(editingTaskId, taskTitle, taskPriority, taskDueDate);
    } else {
      updatedTasks = await createNewTask(taskTitle, taskPriority, taskDueDate);
    }
    setTasks(updatedTasks);
    setModalVisible(false);
  };

  const renderTaskItem = (task) => (
    <TouchableOpacity
      style={styles.taskItem}
      onLongPress={() => openEditModal(task.id, task.title, task.priority, task.dueDate)}
    >
      <Text>{task.title} — {new Date(task.dueDate).toDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View testID="tasks-screen" style={styles.container}>
      <Text style={styles.priorityHeader}>High Priority</Text>
      <FlatList data={tasks.high} keyExtractor={(item) => item.id} renderItem={({ item }) => renderTaskItem(item)} />

      <Text style={styles.priorityHeader}>Medium Priority</Text>
      <FlatList data={tasks.medium} keyExtractor={(item) => item.id} renderItem={({ item }) => renderTaskItem(item)} />

      <Text style={styles.priorityHeader}>Low Priority</Text>
      <FlatList data={tasks.low} keyExtractor={(item) => item.id} renderItem={({ item }) => renderTaskItem(item)} />

      {/* Floating "Add Task" Button */}
      <Pressable testID="fab-add-task" style={styles.fab} onPress={openAddModal}>
        <Text style={{ color: '#fff', fontSize: 30 }}>+</Text>
      </Pressable>

      {/* TaskModal component */}
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
    padding: 16
  },
  priorityHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8
  },
  taskItem: {
    backgroundColor: '#eee',
    padding: 12,
    marginBottom: 4,
    borderRadius: 4
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
});
