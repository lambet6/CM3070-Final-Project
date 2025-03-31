import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
    <Dialog style={styles.dialog} visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Edit Goal</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Goal Title"
          value={title}
          onChangeText={setTitle}
          onBlur={() => validateTitle(title)}
          error={!!titleError}
          style={styles.input}
        />
        {!!titleError && <HelperText type="error">{titleError}</HelperText>}

        <TextInput
          label="Hours per week"
          value={hours}
          onChangeText={setHours}
          onBlur={() => validateHours(hours)}
          error={!!hoursError}
          keyboardType="numeric"
          style={styles.input}
        />
        {!!hoursError && <HelperText type="error">{hoursError}</HelperText>}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={handleSave} disabled={!title || !hours || !!titleError || !!hoursError}>
          Save
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
export default EditGoalForm;

const createStyles = (theme) =>
  StyleSheet.create({
    dialog: {
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
    },
    input: {
      marginBottom: 8,
    },
  });
