import { useState, useCallback } from 'react';

/**
 * Hook for handling task-related actions with appropriate feedback
 * @param {Object} tasks - The current tasks object
 * @param {Function} createNewTask - Function to create a new task
 * @param {Function} deleteTasks - Function to delete tasks
 * @returns {Object} Task action handlers and state
 */
const useTaskActions = (tasks, createNewTask, deleteTasks) => {
  const [error, setError] = useState(null);
  const [snackbarState, setSnackbarState] = useState({
    visible: false,
    message: '',
    action: null,
  });

  // Handle snackbar dismissal
  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarState((prev) => ({ ...prev, visible: false }));
  }, []);

  // Delete a single task with confirmation feedback
  const handleDeleteTask = useCallback(
    async (taskId) => {
      try {
        // Find the task to get its title for the confirmation message
        let taskTitle = 'this task';
        const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
          taskTitle = `"${task.title}"`;
        }

        // Delete the task
        await deleteTasks([taskId]);

        // Show success message
        setSnackbarState({
          visible: true,
          message: `Deleted ${taskTitle}`,
          action: {
            label: 'UNDO',
            onPress: () => {
              if (task) {
                // Re-create the task if user wants to undo
                createNewTask(task.title, task.priority, new Date(task.dueDate));
                setSnackbarState((prev) => ({ ...prev, visible: false }));
              }
            },
          },
        });
      } catch (error) {
        console.error('Error deleting task:', error);
        setSnackbarState({
          visible: true,
          message: `Failed to delete task: ${error.message}`,
          action: {
            label: 'OK',
            onPress: () => setSnackbarState((prev) => ({ ...prev, visible: false })),
          },
        });
      }
    },
    [tasks, deleteTasks, createNewTask],
  );

  // Delete multiple tasks
  const handleDeleteMultipleTasks = useCallback(
    async (taskIds) => {
      if (!taskIds.length) return;

      try {
        await deleteTasks(taskIds);
        setSnackbarState({
          visible: true,
          message: `Deleted ${taskIds.length} ${taskIds.length === 1 ? 'task' : 'tasks'}`,
          action: {
            label: 'OK',
            onPress: () => setSnackbarState((prev) => ({ ...prev, visible: false })),
          },
        });
      } catch (error) {
        console.error('Error deleting tasks:', error);
        setSnackbarState({
          visible: true,
          message: `Failed to delete tasks: ${error.message}`,
          action: {
            label: 'OK',
            onPress: () => setSnackbarState((prev) => ({ ...prev, visible: false })),
          },
        });
      }
    },
    [deleteTasks],
  );

  return {
    error,
    snackbarState,
    setSnackbarState,
    handleDeleteTask,
    handleDeleteMultipleTasks,
    handleSnackbarDismiss,
  };
};

export default useTaskActions;
