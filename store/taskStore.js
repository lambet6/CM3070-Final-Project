import { create } from 'zustand';

/**
 * Creates a task store that focuses only on state management
 * @returns {Function} Zustand store hook
 */
export const createTaskStore = () => {
  return create((set, get) => ({
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
        // If dates are equal, sort by priority (High > Medium > Low)
        return (
          dateCompare ||
          ['High', 'Medium', 'Low'].indexOf(a.priority) -
            ['High', 'Medium', 'Low'].indexOf(b.priority)
        );
      });
    },

    getTasksOnDate: (date) => {
      const { tasks } = get();
      const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
      return allTasks.filter((task) => {
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });
    },
  }));
};

/**
 * Default task store instance for use in components
 */
export const useTaskStore = createTaskStore();
