import { useState } from 'react';
import { View, Text, Button, Modal, Pressable, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TaskModal({
  visible,
  onClose,
  onSave,
  taskTitle,
  setTaskTitle,
  taskPriority,
  setTaskPriority,
  taskDueDate,
  setTaskDueDate,
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTaskDueDate(selectedDate);
    }
  };

  return (
    <Modal
      testID="task-modal"
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{taskTitle ? 'Edit Task' : 'Add Task'}</Text>

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
              testID="picker-priority"
              selectedValue={taskPriority}
              onValueChange={setTaskPriority}>
              <Picker.Item label="Low" value="Low" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="High" value="High" />
            </Picker>
          </View>

          {/* Date Picker */}
          <Text style={styles.label}>Due Date:</Text>
          <Pressable style={styles.inputArea} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputText}>{taskDueDate.toDateString()}</Text>
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
            <Button testID="modal-save-button" title="Save" onPress={onSave} />
            <Button testID="modal-cancel-button" title="Cancel" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Styles
const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    margin: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  inputArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
  },
  inputText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
