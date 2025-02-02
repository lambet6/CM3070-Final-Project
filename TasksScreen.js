import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Modal,
  Pressable,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getTasks,
  createNewTask,
  editExistingTask
} from './services/task-manager';
// import { Ionicons } from '@expo/vector-icons';

export default function TasksScreen() {
  // We store tasks in grouped form: { high: [], medium: [], low: [] }
  const [tasks, setTasks] = useState({ high: [], medium: [], low: [] });

  // Modal / editing states
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load tasks on mount
  useEffect(() => {
    loadAndSetTasks();
  }, []);

  // Helper to refresh tasks from the manager
  const loadAndSetTasks = async () => {
    const groupedTasks = await getTasks();
    setTasks(groupedTasks);
  };

  // Open modal in "Add" mode
  const openAddModal = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
    setModalVisible(true);
  };

  // Open modal in "Edit" mode
  const openEditModal = (taskId, title, priority, dueDateString) => {
    setEditingTaskId(taskId);
    setTaskTitle(title);
    setTaskPriority(priority);
    setTaskDueDate(dueDateString ? new Date(dueDateString) : new Date());
    setModalVisible(true);
  };

  // Save (create or edit) the task
  const handleSaveTask = async () => {
    if (editingTaskId) {
      // Edit existing
      const updated = await editExistingTask(
        editingTaskId,
        taskTitle,
        taskPriority,
        taskDueDate
      );
      setTasks(updated);
    } else {
      // Create new
      const updated = await createNewTask(
        taskTitle,
        taskPriority,
        taskDueDate
      );
      setTasks(updated);
    }
    setModalVisible(false);
  };

  // Date picker callback
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTaskDueDate(selectedDate);
    }
  };

  // Renders a single task item
  const renderTaskItem = (task) => (
    <TouchableOpacity
      style={styles.taskItem}
      onLongPress={() => openEditModal(task.id, task.title, task.priority, task.dueDate)}
    >
      <Text>
        {task.title} — {new Date(task.dueDate).toDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View testID="tasks-screen" style={styles.container}>

      <Text style={styles.priorityHeader}>High Priority</Text>
      <FlatList
        data={tasks.high}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      <Text style={styles.priorityHeader}>Medium Priority</Text>
      <FlatList
        data={tasks.medium}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      <Text style={styles.priorityHeader}>Low Priority</Text>
      <FlatList
        data={tasks.low}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderTaskItem(item)}
      />

      {/* Add Task FAB */}
      <Pressable
        testID="fab-add-task"
        style={styles.fab}
        onPress={openAddModal}
      >
        {/* <Ionicons name="add" size={32} color="#fff" /> */}
        <Text style={{ color: '#fff', fontSize: 24 }}>+</Text>
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
              {editingTaskId ? 'Edit Task' : 'Add Task'}
            </Text>

            {/* Title */}
            <Text style={styles.label}>Title:</Text>
            <View style={styles.inputArea}>
              <TextInput
                testID="input-title"
                style={styles.inputText}
                placeholder="Task Title"
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
            </View>

            {/* Priority Picker */}
            <Text style={styles.label}>Priority:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                testID='picker-priority'
                selectedValue={taskPriority}
                onValueChange={(val) => setTaskPriority(val)}
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
                minimumDate={new Date()}
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

// Example Styles
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
  inputArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 10
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
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
