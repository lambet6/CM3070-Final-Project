import { create } from 'zustand';

/**
 * Direct Zustand store for task management
 */
export const useTaskStore = create((set, get) => ({
  // State
  tasks: { high: [], medium: [], low: [] },
  error: null,
  hasRescheduledThisSession: false,

  // Simple setters
  setTasks: (tasks) => set({ tasks }),
  setError: (error) => set({ error }),
  setHasRescheduledThisSession: (value) => set({ hasRescheduledThisSession: value }),

  // Helper selectors
  getConsolidatedTasks: () => {
    const { tasks } = get();
    return [
      ...tasks.high.map((task) => ({ ...task, priority: 'High' })),
      ...tasks.medium.map((task) => ({ ...task, priority: 'Medium' })),
      ...tasks.low.map((task) => ({ ...task, priority: 'Low' })),
    ].sort((a, b) => {
      // Compare dates first
      const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
      // If dates are equal, sort by priority
      return (
        dateCompare ||
        ['High', 'Medium', 'Low'].indexOf(a.priority) -
          ['High', 'Medium', 'Low'].indexOf(b.priority)
      );
    });
  },

  getTasksOnDate: (date) => {
    // Handle invalid date inputs
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date passed to getTasksOnDate:', date);
      return [];
    }

    const { tasks } = get();
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    const targetDateString = date.toDateString();

    return allTasks.filter((task) => {
      // Skip tasks without due dates
      if (!task.dueDate) return false;

      try {
        const taskDate = new Date(task.dueDate);
        // Validate the task date is valid
        if (isNaN(taskDate.getTime())) {
          console.warn('Invalid task date encountered:', task.dueDate, 'for task:', task.id);
          return false;
        }

        // Compare using string representation to avoid reference equality issues
        return taskDate.toDateString() === targetDateString;
      } catch (error) {
        console.error('Error processing task date for task:', task.id, error);
        return false;
      }
    });
  },
}));
