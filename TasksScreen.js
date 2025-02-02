import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Modal,
  Pressable,
  FlatList,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { loadTasksFromStorage, saveTasksToStorage } from './Servers/tasks-server';

const TASKS_KEY = '@myapp_tasks';

export default function TasksScreen() {
  // State for tasks
  const [tasks, setTasks] = useState([]);

  // Modal visibility & editing
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium'); 
  const [taskDueDate, setTaskDueDate] = useState(new Date());

  // We need to control when to display the date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  // Load tasks from AsyncStorage
  const loadTasks = async () => {
    const stored = await loadTasksFromStorage();
    setTasks(stored);
  };

  // Save tasks to AsyncStorage
  const saveTasks = async (newTasks) => {
    setTasks(newTasks);
    await saveTasksToStorage(newTasks);
  };

  // Open modal for adding a new task
  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date()); // default to today's date
    setModalVisible(true);
  };

  // Open modal for editing
  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskPriority(task.priority);
    // Convert stored date string to JS Date object, if needed
    setTaskDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
    setModalVisible(true);
  };

  // Handle saving a task
  const handleSaveTask = () => {
    if (editingTask) {
      // Editing existing
      const updatedTasks = tasks.map(t =>
        t.id === editingTask.id
          ? { ...t, title: taskTitle, priority: taskPriority, dueDate: taskDueDate.toISOString() }
          : t
      );
      saveTasks(updatedTasks);
    } else {
      // Creating new
      const newTask = {
        id: Date.now().toString(),
        title: taskTitle,
        priority: taskPriority,
        dueDate: taskDueDate.toISOString()
      };
      saveTasks([...tasks, newTask]);
    }
    setModalVisible(false);
  };

  // Handler for date picker changes
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTaskDueDate(selectedDate);
    }
  };

  // Group & sort tasks by priority
  const groupAndSortTasks = () => {
    const high = tasks.filter((t) => t.priority === 'High');
    const medium = tasks.filter((t) => t.priority === 'Medium');
    const low = tasks.filter((t) => t.priority === 'Low');

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
      <Text>
        {task.title} — {(new Date(task.dueDate)).toDateString()}
      </Text>
    </TouchableOpacity>
  );

  const { high, medium, low } = groupAndSortTasks();

  return (
    <View testID='tasks-screen' style={styles.container}>
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

      {/* Floating "Add Task" Button */}
      <Pressable testID="fab-add-task" style={styles.fab} onPress={openAddModal}>
        {/* <Ionicons name="add" size={32} color="#fff" /> */}
        <Text>+</Text>
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

            {/* Task Title */}
            <Text style={styles.label}>Title:</Text>
            <Pressable
              style={styles.inputArea}
              onPress={() => {}}
            >
              <TextInput
                testID="input-title"
                style={styles.inputText}
                placeholder="Task Title"
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
            </Pressable>

            {/* Priority Picker */}
            <Text style={styles.label}>Priority:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={taskPriority}
                onValueChange={(value) => setTaskPriority(value)}
              >
                <Picker.Item label="Low" value="Low" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="High" value="High" />
              </Picker>
            </View>

            {/* Date Picker */}
            <Text style={styles.label}>Due Date:</Text>
            <Pressable
              style={styles.inputArea}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                {taskDueDate.toDateString()}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={taskDueDate}
                mode="date"
                display="calendar"
                onChange={onDateChange}
                minimumDate={new Date()} // disallows any date before 'today'
              />
            )}

            <View style={styles.buttonRow}>
              <Button title="Save" onPress={handleSaveTask} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Example styles
import { TextInput } from 'react-native';
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
    backgroundColor: 'rgba(0,0,0,0.4)'
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
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: 'bold'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10
  },
  inputArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 10
  },
  inputText: {
    fontSize: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  }
});
