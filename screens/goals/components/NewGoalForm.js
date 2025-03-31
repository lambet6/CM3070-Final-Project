import React, { useState } from 'react';
import { useTheme, Text, TextInput, Card, HelperText, Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

const NewGoalForm = ({ onAddGoal, goalsCount }) => {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [titleError, setTitleError] = useState('');
  const [hoursError, setHoursError] = useState('');
  const theme = useTheme();
  const styles = createStyles(theme);

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

  const handleSubmit = () => {
    const titleValid = validateTitle(title);
    const hoursValid = validateHours(hours);

    if (titleValid && hoursValid) {
      onAddGoal(title, Number(hours));
      setTitle('');
      setHours('');
    }
  };

  const atMaxGoals = goalsCount >= 7;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.formTitle}>
          {atMaxGoals ? 'Maximum goals reached (7/7)' : 'Add a new goal'}
        </Text>

        {!atMaxGoals && (
          <>
            <TextInput
              label="Goal Title"
              value={title}
              onChangeText={setTitle}
              onBlur={() => validateTitle(title)}
              error={!!titleError}
              style={styles.input}
              disabled={atMaxGoals}
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
              disabled={atMaxGoals}
            />
            {!!hoursError && <HelperText type="error">{hoursError}</HelperText>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={!title || !hours || !!titleError || !!hoursError}
              style={styles.button}>
              Add Goal
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      margin: 10,
    },
    formTitle: {
      marginBottom: 16,
    },
    input: {
      marginBottom: 8,
    },
    button: {
      marginTop: 16,
    },
  });

export default NewGoalForm;
