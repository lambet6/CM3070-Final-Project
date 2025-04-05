import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, HelperText, Dialog, useTheme } from 'react-native-paper';

const EditGoalForm = ({ goal, visible, onDismiss, onSave }) => {
  // Local state for the form
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [titleError, setTitleError] = useState('');
  const [hoursError, setHoursError] = useState('');

  const theme = useTheme();
  const styles = createStyles(theme);

  // Initialize form when a goal is provided
  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setHours(goal.hoursPerWeek?.toString() || '');
      setTitleError('');
      setHoursError('');
    }
  }, [goal]);

  const validateTitle = (text) => {
    if (!text?.trim()) {
      setTitleError('Goal title cannot be empty');
      return false;
    }
    setTitleError('');
    return true;
  };

  const validateHours = (value) => {
    const numHours = Number(value);
    if (isNaN(numHours) || numHours <= 0) {
      setHoursError('Hours must be greater than zero');
      return false;
    }
    if (numHours > 168) {
      setHoursError('Hours cannot exceed 168 (total hours in a week)');
      return false;
    }
    setHoursError('');
    return true;
  };

  const handleSave = () => {
    const titleValid = validateTitle(title);
    const hoursValid = validateHours(hours);

    if (titleValid && hoursValid) {
      onSave(goal.id, title, Number(hours));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}>
      <Dialog style={styles.dialog} visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Edit Goal</Dialog.Title>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Dialog.Content>
            <TextInput
              label="Goal Title"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError('');
              }}
              onBlur={() => validateTitle(title)}
              error={!!titleError}
              style={styles.input}
            />
            {!!titleError && <HelperText type="error">{titleError}</HelperText>}

            <TextInput
              label="Hours per week"
              value={hours}
              onChangeText={(text) => {
                setHours(text);
                if (hoursError) setHoursError('');
              }}
              onBlur={() => validateHours(hours)}
              error={!!hoursError}
              keyboardType="number-pad"
              style={styles.input}
            />
            {!!hoursError && <HelperText type="error">{hoursError}</HelperText>}
          </Dialog.Content>
        </ScrollView>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSave} disabled={!title || !hours || !!titleError || !!hoursError}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </KeyboardAvoidingView>
  );
};

export default EditGoalForm;

const createStyles = (theme) =>
  StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
      justifyContent: 'center',
    },
    dialog: {
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
      maxHeight: '80%',
    },
    input: {
      marginBottom: 8,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
