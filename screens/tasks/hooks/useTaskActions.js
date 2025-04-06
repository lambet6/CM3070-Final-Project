import { useState, useCallback } from 'react';

/**
 * Hook for handling task-related actions with appropriate feedback
 *
 * @param {Object} tasks - Current tasks object grouped by priority
 * @param {Function} createNewTask - Function to create a new task
 * @param {Function} deleteTasks - Function to delete tasks
 * @returns {Object} Task action handlers and state
 */
const useTaskActions = (tasks, createNewTask, deleteTasks) => {
  // State
  const [error, setError] = useState(null);
  const [snackbarState, setSnackbarState] = useState({
    visible: false,
    message: '',
    action: null,
  });

  /**
   * Handles snackbar dismissal
   */
  const handleSnackbarDismiss = useCallback(() => {
    setSnackbarState((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Deletes a single task with undo functionality
   *
   * @param {string} taskId - ID of the task to delete
   */
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
            label: 'Undo',
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

  /**
   * Deletes multiple tasks with batch undo functionality
   *
   * @param {string[]} taskIds - Array of task IDs to delete
   */
  const handleDeleteMultipleTasks = useCallback(
    async (taskIds) => {
      if (!taskIds.length) return;

      try {
        // Collect information about tasks being deleted for potential restoration
        const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
        const tasksToDelete = allTasks.filter((task) => taskIds.includes(task.id));

        // Delete the tasks
        await deleteTasks(taskIds);

        // Show success message with UNDO option
        setSnackbarState({
          visible: true,
          message: `Deleted ${taskIds.length} ${taskIds.length === 1 ? 'task' : 'tasks'}`,
          action: {
            label: 'Undo',
            onPress: async () => {
              // Sequential recreation of all deleted tasks
              for (const task of tasksToDelete) {
                await createNewTask(task.title, task.priority, new Date(task.dueDate));
              }
              setSnackbarState((prev) => ({ ...prev, visible: false }));
            },
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
    [tasks, deleteTasks, createNewTask],
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
