import { create } from 'zustand';

/**
 * Direct Zustand store for task management
 */
export const useTaskStore = create((set, get) => {
  // Private cache object (not exposed in state)
  const tasksByDateCache = {};
  const MAX_CACHE_SIZE = 10; // Maximum number of dates to cache

  return {
    // State
    tasks: { high: [], medium: [], low: [] },
    error: null,
    hasRescheduledThisSession: false,

    // Simple setters
    setTasks: (tasks) => {
      // Clear cache when tasks are updated
      Object.keys(tasksByDateCache).forEach((key) => delete tasksByDateCache[key]);
      set({ tasks });
    },
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

      // Create a cache key using ISO date string for consistency
      const dateKey = date.toISOString().split('T')[0];

      // Check if we have cache for this date
      if (tasksByDateCache[dateKey]) {
        console.log('Using cached tasks for date:', dateKey);
        return tasksByDateCache[dateKey];
      }

      // If not in cache, compute and store in cache
      const { tasks } = get();
      const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
      const targetDateString = date.toDateString();

      const tasksOnDate = allTasks.filter((task) => {
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

      // Store in cache
      tasksByDateCache[dateKey] = tasksOnDate;

      // Manage cache size (keep only most recent dates)
      const cacheKeys = Object.keys(tasksByDateCache);
      if (cacheKeys.length > MAX_CACHE_SIZE) {
        // Get oldest keys to remove (the difference between current size and max size)
        const keysToRemove = cacheKeys.slice(0, cacheKeys.length - MAX_CACHE_SIZE);
        keysToRemove.forEach((key) => delete tasksByDateCache[key]);
      }

      return tasksOnDate;
    },

    // Clear the cache manually if needed
    clearTasksCache: () => {
      Object.keys(tasksByDateCache).forEach((key) => delete tasksByDateCache[key]);
    },
  };
});
