/* global setTimeout */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Keyboard } from 'react-native';
import { BottomSheetView, BottomSheetTextInput, TouchableOpacity } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TimerPickerModal } from 'react-native-timer-picker';
import { useTaskManager } from '../hooks/useTaskManager';
import { format } from 'date-fns';

export const QuickTaskSheet = ({ onClose, taskToEdit }) => {
  const taskManager = useTaskManager();
  const isEditMode = !!taskToEdit;

  // State for task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [titleError, setTitleError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [taskDuration, setTaskDuration] = useState('30');
  const [durationError, setDurationError] = useState('');

  // Populate form with task data when in edit mode
  useEffect(() => {
    if (taskToEdit) {
      setTaskTitle(taskToEdit.title);
      setTaskPriority(taskToEdit.priority);
      setTaskDueDate(new Date(taskToEdit.dueDate));
      setTaskDuration(taskToEdit.duration ? String(taskToEdit.duration) : '');
    } else {
      resetForm();
    }
  }, [taskToEdit, resetForm]);

  const handleSaveTask = async () => {
    if (!taskTitle?.trim()) {
      setTitleError('Title is required');
      return;
    }
    const durationNumber = parseInt(taskDuration, 10);
    if (taskDuration === '' || isNaN(durationNumber) || durationNumber <= 0) {
      setDurationError('A valid duration is required');
      return;
    }

    try {
      Keyboard.dismiss();
      if (isEditMode) {
        await taskManager.editExistingTask(
          taskToEdit.id,
          taskTitle,
          taskPriority,
          taskDueDate,
          durationNumber,
        );
      } else {
        await taskManager.createNewTask(taskTitle, taskPriority, taskDueDate, durationNumber);
      }
      resetForm();
      onClose();
    } catch (error) {
      setTitleError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} task`);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const resetForm = useCallback(() => {
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
    setTaskDuration('30');
    setTitleError('');
    setDurationError('');
    setShowDatePicker(false);
    setShowDurationPicker(false);
  }, []);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || taskDueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTaskDueDate(currentDate);
  };

  const showDatepicker = () => setShowDatePicker(true);

  const formatDuration = (minutes) => {
    if (!minutes) return 'Not set';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  return (
    <BottomSheetView style={styles.sheetContainer}>
      <Text style={styles.sheetTitle}>{isEditMode ? 'Edit Task' : 'Quick Add Task'}</Text>

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
          <Text testID="title-error-message" style={styles.errorText}>
            {titleError}
          </Text>
        ) : null}
      </View>

      {/* Due Date Picker */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Due Date:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={showDatepicker}
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

      {/* Duration Picker */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Duration:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDurationPicker(true)}
          testID="duration-picker-button">
          <Text style={styles.dateButtonText}>
            {taskDuration ? formatDuration(parseInt(taskDuration, 10)) : 'Set duration'}
          </Text>
        </TouchableOpacity>
        {durationError ? (
          <Text testID="duration-error-message" style={styles.errorText}>
            {durationError}
          </Text>
        ) : null}
        <TimerPickerModal
          visible={showDurationPicker}
          setIsVisible={setShowDurationPicker}
          onConfirm={(pickedDuration) => {
            const totalMinutes = (pickedDuration.hours || 0) * 60 + (pickedDuration.minutes || 0);
            if (totalMinutes > 0) {
              setTaskDuration(String(totalMinutes));
              setDurationError('');
            } else {
              setDurationError('Duration must be greater than 0 minutes');
            }
            setShowDurationPicker(false);
          }}
          modalTitle="Set Task Duration"
          onCancel={() => setShowDurationPicker(false)}
          closeOnOverlayPress
          use12HourPicker={false}
          initialHours={Math.floor(parseInt(taskDuration, 10) / 60)}
          initialMinutes={parseInt(taskDuration, 10) % 60}
          hideSeconds={true}
          styles={{ theme: 'light' }}
        />
      </View>

      {/* Priority Buttons */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Priority:</Text>
        <View style={styles.priorityButtonsContainer}>
          <View style={styles.priorityButtonWrapper}>
            <TouchableOpacity
              testID="priority-low-button"
              style={[
                styles.priorityButton,
                styles.lowPriorityButton,
                taskPriority === 'Low' && [
                  styles.priorityButtonSelected,
                  styles.lowPrioritySelected,
                ],
              ]}
              onPress={() => setTaskPriority('Low')}
              onPressOut={() => {
                Keyboard.dismiss();
              }}>
              <Text
                style={[
                  styles.priorityButtonText,
                  styles.lowPriorityButtonText,
                  taskPriority === 'Low' && styles.lowPriorityTextSelected,
                ]}>
                Low
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.priorityButtonWrapper}>
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
              onPress={() => setTaskPriority('Medium')}>
              <Text
                style={[
                  styles.priorityButtonText,
                  styles.mediumPriorityButtonText,
                  taskPriority === 'Medium' && styles.mediumPriorityTextSelected,
                ]}>
                Medium
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.priorityButtonWrapper}>
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
              onPress={() => setTaskPriority('High')}>
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
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.actionButtonWrapper}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel()}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtonWrapper}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSaveTask()}
            testID="quick-add-save">
            <Text style={styles.buttonText}>{isEditMode ? 'Save Changes' : 'Add Task'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    minHeight: 410, // ensure a minimum height so the sheet expands with the keyboard
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
  priorityButtonWrapper: {
    flex: 1,
    paddingHorizontal: 4,
  },
  priorityButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    height: 45,
    width: '100%',
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
  priorityButtonSelected: {},
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
    color: '#2E7D32',
  },
  mediumPriorityButtonText: {
    color: '#FF8F00',
  },
  highPriorityButtonText: {
    color: '#C62828',
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
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  actionButtonWrapper: {
    width: '30%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    height: 48,
    width: '100%',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    height: 48,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default QuickTaskSheet;
