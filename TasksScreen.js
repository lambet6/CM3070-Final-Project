import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const TASKS_KEY = '@myapp_tasks';

export default function TasksScreen() {
  // State for all tasks
  const [tasks, setTasks] = useState([]);

  // Modal and editing state
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(TASKS_KEY);
      if (storedTasks !== null) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      setTasks(newTasks); // Update local state
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
    } catch (err) {
      console.error('Error saving tasks:', err);
    }
  };

  // Open modal for a new task
  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate('');
    setModalVisible(true);
  };

  // Open modal to edit an existing task
  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate);
    setModalVisible(true);
  };

  const handleSaveTask = () => {
    if (editingTask) {
      // Editing existing task
      const updatedTasks = tasks.map(t =>
        t.id === editingTask.id
          ? { ...t, title: taskTitle, priority: taskPriority, dueDate: taskDueDate }
          : t
      );
      saveTasks(updatedTasks);
    } else {
      // Creating new task
      const newTask = {
        id: Date.now().toString(), // rudimentary unique ID
        title: taskTitle,
        priority: taskPriority,
        dueDate: taskDueDate
      };
      saveTasks([...tasks, newTask]);
    }

    setModalVisible(false);
  };

  // Group by priority and sort by dueDate
  const groupAndSortTasks = () => {
    // Partition tasks by priority
    const high = tasks.filter((t) => t.priority === 'High');
    const medium = tasks.filter((t) => t.priority === 'Medium');
    const low = tasks.filter((t) => t.priority === 'Low');

    // Simple date sorting
    const sortByDate = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
    high.sort(sortByDate);
    medium.sort(sortByDate);
    low.sort(sortByDate);

    return { high, medium, low };
  };

  const renderTaskItem = (task) => (
    <TouchableOpacity
      style={styles.taskItem}
      onLongPress={() => openEditModal(task)}
    >
      <Text>{task.title} — {task.dueDate}</Text>
    </TouchableOpacity>
  );

  const { high, medium, low } = groupAndSortTasks();

  return (
    <View style={styles.container}>
      {/* High Priority */}
      <Text style={styles.priorityHeader}>High Priority</Text>
      <FlatList
        data={high}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Medium Priority */}
      <Text style={styles.priorityHeader}>Medium Priority</Text>
      <FlatList
        data={medium}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Low Priority */}
      <Text style={styles.priorityHeader}>Low Priority</Text>
      <FlatList
        data={low}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Floating Action Button for "Add Task" */}
      <Pressable style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>

      {/* Modal for Add/Edit */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'Add Task'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            {/* Could use a Picker instead of TextInput for priority */}
            <TextInput
              style={styles.input}
              placeholder="Priority (High, Medium, Low)"
              value={taskPriority}
              onChangeText={setTaskPriority}
            />

            <TextInput
              style={styles.input}
              placeholder="Due Date (YYYY-MM-DD)"
              value={taskDueDate}
              onChangeText={setTaskDueDate}
            />

            <Button title="Save" onPress={handleSaveTask} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  modalContent: {
    margin: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10
  }
});
