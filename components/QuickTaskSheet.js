/* global setTimeout */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, Keyboard } from 'react-native';
import { BottomSheetView, BottomSheetTextInput, TouchableOpacity } from '@gorhom/bottom-sheet';
import { DatePickerModal } from 'react-native-paper-dates';
import { TimerPickerModal } from 'react-native-timer-picker';
import { useTaskManager } from '../hooks/useTaskManager';
import { format } from 'date-fns';
import { useTheme, Text, Icon, TouchableRipple, HelperText } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export const QuickTaskSheet = ({ onClose, taskToEdit }) => {
  const taskManager = useTaskManager();
  const isEditMode = !!taskToEdit;

  // State for task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [titleError, setTitleError] = useState('');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTitleError('Title is required');
      return;
    }
    const durationNumber = parseInt(taskDuration, 10);
    if (taskDuration === '' || isNaN(durationNumber) || durationNumber <= 0) {
      setDurationError('A valid duration is required');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      Keyboard.dismiss();
      onClose();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    setShowDatePickerModal(false);
    setShowDurationPicker(false);
  }, []);

  const onDatePickerConfirm = useCallback((params) => {
    setTaskDueDate(params.date);
    setShowDatePickerModal(false);
  }, []);

  const onDatePickerDismiss = useCallback(() => {
    setShowDatePickerModal(false);
  }, []);

  const showDatepicker = () => setShowDatePickerModal(true);

  const formatDuration = (minutes) => {
    if (!minutes) return 'Not set';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <BottomSheetView style={styles.sheetContainer}>
      <Text variant="headlineSmall" style={styles.sheetTitle}>
        {isEditMode ? 'Edit Task' : 'Add Task'}
      </Text>

      {/* Task Title Input */}
      <View>
        <Text variant="bodyMedium" style={styles.inputLabel}>
          Title:
        </Text>
        <View style={styles.inputContents}>
          <Icon size={24} source="pencil" />
          <View style={styles.inputButton}>
            <BottomSheetTextInput
              testID="quick-add-title"
              selectionColor={theme.colors.primary}
              underlineColorAndroid={theme.colors.primary}
              style={[styles.textInput, titleError && styles.inputError]}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={taskTitle}
              onChangeText={(text) => {
                setTaskTitle(text);
                if (text.trim()) setTitleError('');
              }}
            />
          </View>
        </View>
        <HelperText style={styles.titleError} type="error" visible={!!titleError}>
          {titleError}
        </HelperText>
      </View>

      {/* Due Date Picker */}
      <View style={styles.inputContainer}>
        <Text variant="bodyMedium" style={styles.inputLabel}>
          Due Date:
        </Text>
        <View style={styles.inputContents}>
          <Icon size={24} source="calendar-clock" />
          <View style={styles.inputButton}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={showDatepicker}
              testID="date-picker-button">
              <Text style={styles.dateButtonText}>{format(taskDueDate, 'MMMM d, yyyy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <DatePickerModal
          locale="en-GB"
          visible={showDatePickerModal}
          mode="single"
          onDismiss={onDatePickerDismiss}
          date={taskDueDate}
          onConfirm={onDatePickerConfirm}
          saveLabel="Confirm"
          validRange={{ startDate: new Date(new Date().setHours(0, 0, 0, 0)) }}
        />
      </View>

      {/* Duration Picker */}
      <View style={styles.inputContainer}>
        <Text variant="bodyMedium" style={styles.inputLabel}>
          Duration:
        </Text>
        <View style={styles.inputContents}>
          <Icon size={24} source="timer-sand" />
          <View style={styles.inputButton}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDurationPicker(true)}
              testID="duration-picker-button">
              <Text style={styles.dateButtonText}>
                {taskDuration ? formatDuration(parseInt(taskDuration, 10)) : 'Set duration'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
          initialValue={{
            hours: Math.floor(parseInt(taskDuration, 10) / 60),
            minutes: parseInt(taskDuration, 10) % 60,
          }}
          maximumHours={12}
          hideSeconds={true}
          Haptics={Haptics}
          LinearGradient={LinearGradient}
          styles={{
            theme: 'dark',
            cancelButton: {
              backgroundColor: theme.colors.errorContainer,
              color: theme.colors.onErrorContainer,
              borderColor: theme.colors.errorContainer,
            },
            confirmButton: {
              backgroundColor: theme.colors.primary,
              color: theme.colors.onPrimary,
              borderColor: theme.colors.primary,
            },
          }}
        />
      </View>

      {/* Priority Buttons */}
      <View style={styles.inputContainer}>
        <Text variant="bodyMedium" style={styles.inputLabel}>
          Priority:
        </Text>
        <View style={styles.inputContents}>
          <Icon size={24} source="flag-outline" />
          <View style={styles.priorityButtonsContainer}>
            <View style={styles.priorityButtonWrapper}>
              <TouchableOpacity
                testID="priority-low-button"
                style={[
                  styles.priorityButton,
                  taskPriority === 'Low' && [
                    styles.priorityButtonSelected,
                    styles.lowPrioritySelected,
                  ],
                ]}
                onPress={() => setTaskPriority('Low')}>
                <Text style={taskPriority === 'Low' ? styles.lowPriorityTextSelected : null}>
                  Low
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.priorityButtonWrapper}>
              <TouchableOpacity
                testID="priority-medium-button"
                style={[
                  styles.priorityButton,
                  taskPriority === 'Medium' && [
                    styles.priorityButtonSelected,
                    styles.mediumPrioritySelected,
                  ],
                ]}
                onPress={() => setTaskPriority('Medium')}>
                <Text style={taskPriority === 'Medium' ? styles.mediumPriorityTextSelected : null}>
                  Medium
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.priorityButtonWrapper}>
              <TouchableOpacity
                testID="priority-high-button"
                style={[
                  styles.priorityButton,
                  taskPriority === 'High' && [
                    styles.priorityButtonSelected,
                    styles.highPrioritySelected,
                  ],
                ]}
                onPress={() => setTaskPriority('High')}>
                <Text style={taskPriority === 'High' ? styles.highPriorityTextSelected : null}>
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.actionButtonWrapper}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtonWrapper}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSaveTask()}
            testID="quick-add-save">
            <Text style={styles.addButtonText}>{isEditMode ? 'Save' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
};

const makeStyles = (theme) =>
  StyleSheet.create({
    sheetContainer: {
      flex: 1,
      minHeight: 410,
      paddingHorizontal: 20,
    },
    sheetTitle: {
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 12,
    },
    inputContents: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '95%',
    },
    inputButton: {
      flex: 1,
    },
    textInput: {
      marginLeft: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      height: 52,
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onBackground,
    },
    titleError: {
      marginLeft: 32,
    },
    inputError: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      marginTop: 4,
    },
    inputLabel: {
      marginBottom: 8,
    },
    priorityButtonsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 5,
      marginLeft: 12,
    },
    priorityButtonWrapper: {
      flex: 1,
      paddingHorizontal: 4,
    },
    priorityButton: {
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      height: 42,
      borderColor: theme.colors.outline,
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
    lowPriorityButtonText: {
      // color: '#2E7D32',
    },
    mediumPriorityButtonText: {
      color: '#FF8F00',
    },
    highPriorityButtonText: {
      color: '#C62828',
    },
    lowPriorityTextSelected: {
      color: '#2E7D32',
    },
    mediumPriorityTextSelected: {
      color: '#FF8F00',
    },
    highPriorityTextSelected: {
      color: '#C62828',
    },
    dateButton: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      marginLeft: 12,
      padding: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    dateButtonText: {
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      // marginBottom: 20,
      // paddingBottom: 20,
      gap: 16,
    },
    actionButtonWrapper: {
      width: '30%',
    },
    cancelButton: {
      borderColor: theme.colors.outline,
      // borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      width: '100%',
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      width: '100%',
    },
    addButtonText: {
      color: theme.colors.onPrimary,
    },
    cancelButtonText: {
      color: theme.colors.primary,
    },
  });

export default QuickTaskSheet;
