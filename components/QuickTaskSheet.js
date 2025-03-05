import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Keyboard } from 'react-native';
import { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskStore } from '../store/taskStore';
import { format } from 'date-fns';

export const QuickTaskSheet = ({ onClose }) => {
  const { addTask } = useTaskStore();

  // State for task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [titleError, setTitleError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCreateTask = async () => {
    // Validate title
    if (!taskTitle?.trim()) {
      setTitleError('Title is required');
      return;
    }

    try {
      Keyboard.dismiss(); // Move to top
      await addTask(taskTitle, taskPriority, taskDueDate);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      setTitleError(error.message || 'Failed to create task');
    }
  };

  const handleCancel = () => {
    console.log('Cancel task creation');
    Keyboard.dismiss(); // Move to top
    resetForm();
    onClose();
  };

  const resetForm = useCallback(() => {
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
    setTitleError('');
    setShowDatePicker(false);
  }, []);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || taskDueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTaskDueDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  return (
    <BottomSheetView keyboardShouldPersistTaps="handled" style={styles.sheetContainer}>
      <Text style={styles.sheetTitle}>Quick Add Task</Text>

      {/* Task Title Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Title:</Text>
        <BottomSheetTextInput
          testID="quick-add-title"
          style={[styles.textInput, titleError && styles.inputError]}
          placeholder="What needs to be done?"
          value={taskTitle}
          onChangeText={(text) => {
            setTaskTitle(text);
            if (text.trim()) setTitleError('');
          }}
        />
        {titleError ? (
          <Text testID="error-message" style={styles.errorText}>
            {titleError}
          </Text>
        ) : null}
      </View>

      {/* Due Date Picker */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Due Date:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPressIn={showDatepicker}
          testID="date-picker-button">
          <Text style={styles.dateButtonText}>{format(taskDueDate, 'MMMM d, yyyy')}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            testID="date-time-picker"
            value={taskDueDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Priority Buttons */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Priority:</Text>
        <View style={styles.priorityButtonsContainer}>
          <TouchableOpacity
            testID="priority-low-button"
            style={[
              styles.priorityButton,
              styles.lowPriorityButton,
              taskPriority === 'Low' && [styles.priorityButtonSelected, styles.lowPrioritySelected],
            ]}
            onPressIn={() => setTaskPriority('Low')}>
            <Text
              style={[
                styles.priorityButtonText,
                styles.lowPriorityButtonText,
                taskPriority === 'Low' && styles.lowPriorityTextSelected,
              ]}>
              Low
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="priority-medium-button"
            style={[
              styles.priorityButton,
              styles.mediumPriorityButton,
              taskPriority === 'Medium' && [
                styles.priorityButtonSelected,
                styles.mediumPrioritySelected,
              ],
            ]}
            onPressIn={() => setTaskPriority('Medium')}>
            <Text
              style={[
                styles.priorityButtonText,
                styles.mediumPriorityButtonText,
                taskPriority === 'Medium' && styles.mediumPriorityTextSelected,
              ]}>
              Medium
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="priority-high-button"
            style={[
              styles.priorityButton,
              styles.highPriorityButton,
              taskPriority === 'High' && [
                styles.priorityButtonSelected,
                styles.highPrioritySelected,
              ],
            ]}
            onPressIn={() => setTaskPriority('High')}>
            <Text
              style={[
                styles.priorityButtonText,
                styles.highPriorityButtonText,
                taskPriority === 'High' && styles.highPriorityTextSelected,
              ]}>
              High
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPressIn={handleCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPressIn={handleCreateTask}
          testID="quick-add-save">
          <Text style={styles.buttonText}>Add Task</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  priorityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  lowPriorityButton: {
    backgroundColor: '#f0f9f0',
    borderColor: '#d0e8d0',
  },
  mediumPriorityButton: {
    backgroundColor: '#fff9e6',
    borderColor: '#f0e8c0',
  },
  highPriorityButton: {
    backgroundColor: '#fff0f0',
    borderColor: '#f0d0d0',
  },
  priorityButtonSelected: {
    // borderWidth: 2,
  },
  lowPrioritySelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e0f2e0',
  },
  mediumPrioritySelected: {
    borderColor: '#FFC107',
    backgroundColor: '#fff0c0',
  },
  highPrioritySelected: {
    borderColor: '#F44336',
    backgroundColor: '#ffe0e0',
  },
  priorityButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },
  lowPriorityButtonText: {
    color: '#2E7D32', // Changed to match selected color
  },
  mediumPriorityButtonText: {
    color: '#FF8F00', // Changed to match selected color
  },
  highPriorityButtonText: {
    color: '#C62828', // Changed to match selected color
  },
  lowPriorityTextSelected: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  mediumPriorityTextSelected: {
    color: '#FF8F00',
    fontWeight: 'bold',
  },
  highPriorityTextSelected: {
    color: '#C62828',
    fontWeight: 'bold',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
