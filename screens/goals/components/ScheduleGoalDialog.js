import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Dialog,
  Portal,
  Text,
  Button,
  HelperText,
  Switch,
  SegmentedButtons,
  useTheme,
  Divider,
} from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { format, addHours, getHours, getMinutes, setHours, setMinutes } from 'date-fns';

const RecurrenceOptions = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

const ScheduleGoalDialog = ({ goal, visible, onDismiss, onSchedule }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  // State for date and time
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addHours(new Date(), 1));
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [dateTimeError, setDateTimeError] = useState('');

  // State for recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState(RecurrenceOptions.DAILY);

  // Reset form when dialog opens
  useEffect(() => {
    if (visible) {
      // Initialize start date to current time, rounded to nearest half hour
      const now = new Date();
      const minutes = getMinutes(now);
      const roundedMinutes = minutes < 30 ? 30 : 0;
      const hoursToAdd = minutes < 30 ? 0 : 1;

      const roundedStartDate = setMinutes(
        setHours(now, getHours(now) + hoursToAdd),
        roundedMinutes,
      );

      setStartDate(roundedStartDate);
      setEndDate(addHours(roundedStartDate, 1));
      setIsRecurring(false);
      setRecurrenceType(RecurrenceOptions.DAILY);
      setDateTimeError('');
    }
  }, [visible]);

  // Validate times
  const validateDateTime = () => {
    if (endDate <= startDate) {
      setDateTimeError('End time must be after start time');
      return false;
    }
    setDateTimeError('');
    return true;
  };

  // Handle date/time changes
  const onConfirmStartDate = ({ date }) => {
    setShowStartDateModal(false);
    if (date) {
      // Preserve the time from the current startDate
      const newDate = new Date(date);
      newDate.setHours(startDate.getHours(), startDate.getMinutes());
      setStartDate(newDate);

      // Update end date to maintain the same duration
      const duration = endDate.getTime() - startDate.getTime();
      setEndDate(new Date(newDate.getTime() + duration));
    }
  };

  const onDismissStartDate = () => {
    setShowStartDateModal(false);
  };

  const onConfirmStartTime = ({ hours, minutes }) => {
    setShowStartTimeModal(false);

    // Update the time part of the startDate
    const newStartDate = new Date(startDate);
    newStartDate.setHours(hours, minutes);
    setStartDate(newStartDate);

    // Update end date to maintain the same duration if possible
    const duration = endDate.getTime() - startDate.getTime();
    const newEndDate = new Date(newStartDate.getTime() + duration);
    setEndDate(newEndDate);
  };

  const onDismissStartTime = () => {
    setShowStartTimeModal(false);
  };

  const onConfirmEndTime = ({ hours, minutes }) => {
    setShowEndTimeModal(false);

    // Update the time part of the endDate
    const newEndDate = new Date(endDate);
    newEndDate.setHours(hours, minutes);
    setEndDate(newEndDate);
  };

  const onDismissEndTime = () => {
    setShowEndTimeModal(false);
  };

  // Handle form submission
  const handleSchedule = () => {
    if (validateDateTime()) {
      onSchedule({
        goalId: goal.id,
        title: goal.title,
        startDate,
        endDate,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : RecurrenceOptions.NONE,
      });
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Schedule Goal: {goal?.title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.sectionTitle}>When would you like to work on this goal?</Text>
          <Text style={styles.goalDescription}>
            Goal: {goal?.title} - {goal?.hoursPerWeek} hours/week
          </Text>

          {/* Date Picker */}
          <View style={styles.dateContainer}>
            <Button
              mode="outlined"
              onPress={() => setShowStartDateModal(true)}
              style={styles.dateButton}>
              {format(startDate, 'MMMM d, yyyy')}
            </Button>

            <DatePickerModal
              locale="en-GB"
              visible={showStartDateModal}
              mode="single"
              onDismiss={onDismissStartDate}
              date={startDate}
              onConfirm={onConfirmStartDate}
              validRange={{ startDate: new Date(new Date().setHours(0, 0, 0, 0)) }}
            />
          </View>

          {/* Time Pickers */}
          <View style={styles.timeContainer}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <Button
                mode="outlined"
                onPress={() => setShowStartTimeModal(true)}
                style={styles.timeButton}>
                {format(startDate, 'h:mm a')}
              </Button>

              <TimePickerModal
                locale="en-GB"
                visible={showStartTimeModal}
                onDismiss={onDismissStartTime}
                onConfirm={onConfirmStartTime}
                hours={startDate.getHours()}
                minutes={startDate.getMinutes()}
              />
            </View>

            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>End Time</Text>
              <Button
                mode="outlined"
                onPress={() => setShowEndTimeModal(true)}
                style={styles.timeButton}>
                {format(endDate, 'h:mm a')}
              </Button>

              <TimePickerModal
                locale="en-GB"
                visible={showEndTimeModal}
                onDismiss={onDismissEndTime}
                onConfirm={onConfirmEndTime}
                hours={endDate.getHours()}
                minutes={endDate.getMinutes()}
              />
            </View>
          </View>

          {dateTimeError ? <HelperText type="error">{dateTimeError}</HelperText> : null}

          <Divider style={styles.divider} />

          {/* Recurrence Options */}
          <View style={styles.recurrenceContainer}>
            <View style={styles.switchContainer}>
              <Text>Recurring Event</Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            {isRecurring && (
              <SegmentedButtons
                value={recurrenceType}
                onValueChange={setRecurrenceType}
                buttons={[
                  { value: RecurrenceOptions.DAILY, label: 'Daily' },
                  { value: RecurrenceOptions.WEEKLY, label: 'Weekly' },
                  { value: RecurrenceOptions.MONTHLY, label: 'Monthly' },
                ]}
                style={styles.segmentedButtons}
              />
            )}
          </View>

          <Text style={styles.durationText}>
            Duration: {Math.round((endDate - startDate) / (1000 * 60))} minutes
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSchedule} mode="contained">
            Schedule
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    dialog: {
      marginHorizontal: 20,
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
    },
    sectionTitle: {
      marginBottom: 8,
      fontWeight: 'bold',
    },
    goalDescription: {
      marginBottom: 16,
      fontStyle: 'italic',
      color: theme.colors.secondary,
    },
    dateContainer: {
      marginBottom: 16,
    },
    dateButton: {
      marginTop: 8,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    timePickerContainer: {
      flex: 1,
      marginHorizontal: 4,
    },
    timeLabel: {
      marginBottom: 8,
    },
    timeButton: {
      marginTop: 4,
    },
    divider: {
      marginVertical: 16,
    },
    recurrenceContainer: {
      marginBottom: 16,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    segmentedButtons: {
      marginTop: 8,
    },
    durationText: {
      marginTop: 8,
      fontStyle: 'italic',
      color: theme.colors.outline,
    },
  });

export default ScheduleGoalDialog;
