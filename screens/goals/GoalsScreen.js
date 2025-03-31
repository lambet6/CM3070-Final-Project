import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useGoalsStore } from '../../store/goalsStore';
import { useGoalsManager } from '../../hooks/useGoalManager';
import {
  Text,
  useTheme,
  Surface,
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Divider,
  Snackbar,
} from 'react-native-paper';
import EditGoalForm from './components/EditGoalForm';
import NewGoalForm from './components/NewGoalForm';
import GoalItem from './components/GoalItem';

// Main GoalsScreen component
export default function GoalsScreen() {
  const { goals, error, isLoading } = useGoalsStore();
  const goalsManager = useGoalsManager();
  const [editingGoal, setEditingGoal] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editTitleError, setEditTitleError] = useState('');
  const [editHoursError, setEditHoursError] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  const [showSnackbar, setShowSnackbar] = useState(false);
  const [deletedGoalInfo, setDeletedGoalInfo] = useState(null);

  const theme = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    goalsManager.fetchGoals();
  }, [goalsManager]);

  const handleAddGoal = async (title, hours) => {
    try {
      await goalsManager.addGoal(title, hours);
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditHours(goal.hoursPerWeek.toString());
    setEditTitleError('');
    setEditHoursError('');
    setShowEditDialog(true);
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
    setEditingGoal(null);
  };

  const validateEditTitle = (text) => {
    if (!text?.trim()) {
      setEditTitleError('Goal title cannot be empty');
      return false;
    }
    setEditTitleError('');
    return true;
  };

  const validateEditHours = (value) => {
    const numHours = Number(value);
    if (isNaN(numHours) || numHours <= 0) {
      setEditHoursError('Hours must be greater than zero');
      return false;
    }
    if (numHours > 168) {
      setEditHoursError('Hours cannot exceed 168 (total hours in a week)');
      return false;
    }
    setEditHoursError('');
    return true;
  };

  const handleUpdateGoal = async () => {
    const titleValid = validateEditTitle(editTitle);
    const hoursValid = validateEditHours(editHours);

    if (titleValid && hoursValid && editingGoal) {
      try {
        await goalsManager.updateGoalData(editingGoal.id, editTitle, Number(editHours));
        setShowEditDialog(false);
      } catch (error) {
        console.error('Failed to update goal:', error);
      }
    }
  };

  const openDeleteDialog = (goalId) => {
    setGoalToDelete(goalId);
    setShowDeleteDialog(true);
  };

  const handleDeleteGoal = async () => {
    if (goalToDelete) {
      try {
        // Store the goal information before deletion
        const goalToRestore = goals.find((g) => g.id === goalToDelete);

        // Delete the goal
        await goalsManager.deleteGoal(goalToDelete);
        setShowDeleteDialog(false);

        // Store deleted goal info and show snackbar
        setDeletedGoalInfo(goalToRestore);
        setShowSnackbar(true);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const handleUndoDelete = async () => {
    if (deletedGoalInfo) {
      try {
        // Restore the deleted goal
        await goalsManager.addGoal(deletedGoalInfo.title, deletedGoalInfo.hoursPerWeek);
        setShowSnackbar(false);
        setDeletedGoalInfo(null);
      } catch (error) {
        console.error('Failed to restore goal:', error);
      }
    }
  };

  const handleSnackbarDismiss = () => {
    setShowSnackbar(false);
    setDeletedGoalInfo(null);
  };

  const handleScheduleGoal = (goalId) => {
    // Placeholder for future scheduling functionality
    console.log('Schedule goal with ID:', goalId);
  };

  return (
    <View testID="goals-screen" style={styles.container}>
      <Surface style={styles.intro}>
        <View style={styles.header}>
          <Text style={styles.headerText} variant="titleLarge">
            Make time for your long-term goals, hobbies, and passions
          </Text>
        </View>
        {error && (
          <View style={styles.loading}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator style={styles.indicator} />
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        )}
      </Surface>

      <Surface mode="flat" style={styles.goalsContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Add new goal form */}
          <NewGoalForm onAddGoal={handleAddGoal} goalsCount={goals.length} />

          {/* Divider between form and list */}
          {goals.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Your Goals
              </Text>
            </>
          )}

          {/* Goals list */}
          {goals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onSchedule={handleScheduleGoal}
            />
          ))}

          {/* No goals message */}
          {goals.length === 0 && !isLoading && (
            <Text style={styles.noGoalsText}>
              You haven't added any goals yet. Add your first goal to get started!
            </Text>
          )}
        </ScrollView>
      </Surface>

      {/* Portal section */}
      <Portal>
        <EditGoalForm
          goal={editingGoal}
          visible={showEditDialog}
          onDismiss={closeEditDialog}
          onSave={handleUpdateGoal}
        />

        {/* Delete Goal Dialog */}
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Goal</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this goal?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteGoal} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Undo functionality */}
        <Snackbar
          wrapperStyle={{ paddingHorizontal: 16, marginVertical: 50 }}
          visible={showSnackbar}
          onDismiss={handleSnackbarDismiss}
          action={{
            label: 'Undo',
            onPress: handleUndoDelete,
          }}
          duration={5000}>
          Goal deleted
        </Snackbar>
      </Portal>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    intro: {
      paddingVertical: 16,
    },
    header: {
      padding: 16,
      alignItems: 'center',
    },
    headerText: {
      textAlign: 'center',
    },
    bodyText: {
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.error,
      padding: 16,
    },
    loading: {
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    indicator: {
      marginRight: 8,
    },
    loadingText: {
      color: theme.colors.secondary,
    },
    goalsContainer: {
      flex: 1,
      padding: 16,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    divider: {
      marginVertical: 16,
    },
    sectionTitle: {
      marginBottom: 16,
    },
    noGoalsText: {
      textAlign: 'center',
      marginTop: 24,
      color: theme.colors.outline,
    },
    goalCard: {
      marginBottom: 12,
    },
    goalItemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    goalItemContent: {
      flex: 1,
    },
    goalItemActions: {
      flexDirection: 'row',
    },
  });
