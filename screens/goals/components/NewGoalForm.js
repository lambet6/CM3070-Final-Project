import React, { useState } from 'react';
import { useTheme, Text, TextInput, Card, HelperText, Button } from 'react-native-paper';
import { StyleSheet } from 'react-native';

/**
 * Component for creating new goals with validation
 *
 * @param {Object} props Component props
 * @param {Function} props.onAddGoal Callback for adding a new goal
 * @param {number} props.goalsCount Current number of goals
 * @returns {JSX.Element} A form for adding new goals
 */
const NewGoalForm = ({ onAddGoal, goalsCount }) => {
  // State management
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('');
  const [titleError, setTitleError] = useState('');
  const [hoursError, setHoursError] = useState('');

  const theme = useTheme();
  const styles = createStyles(theme);

  // Check if max goal limit reached (7 goals)
  const atMaxGoals = goalsCount >= 7;

  /**
   * Validates the goal title
   */
  const validateTitle = (text) => {
    if (!text?.trim()) {
      setTitleError('Goal title cannot be empty');
      return false;
    }
    setTitleError('');
    return true;
  };

  /**
   * Validates the weekly hour target
   */
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

  /**
   * Handles form submission after validation
   */
  const handleSubmit = () => {
    const titleValid = validateTitle(title);
    const hoursValid = validateHours(hours);

    if (titleValid && hoursValid) {
      onAddGoal(title, Number(hours));
      setTitle('');
      setHours('');
    }
  };

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
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError('');
              }}
              onBlur={() => validateTitle(title)}
              error={!!titleError}
              style={styles.input}
              disabled={atMaxGoals}
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

/**
 * Creates component styles based on the theme
 */
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
