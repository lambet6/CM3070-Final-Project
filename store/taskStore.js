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
    completedTasks: [],
    error: null,
    hasRescheduledThisSession: false,

    // Simple setters
    setTasks: (tasks) => {
      // Clear cache when tasks are updated
      Object.keys(tasksByDateCache).forEach((key) => delete tasksByDateCache[key]);
      set({ tasks });
    },
    setCompletedTasks: (completedTasks) => set({ completedTasks }),
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

      // Create a normalized date at noon to avoid timezone issues
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);

      // Create a cache key using consistent date components
      const dateKey = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')}`;

      // Check if we have cache for this date
      if (tasksByDateCache[dateKey]) {
        console.log('Using cached tasks for date:', dateKey);
        return tasksByDateCache[dateKey];
      }

      // If not in cache, compute and store in cache
      const { tasks } = get();
      const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];

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

          // Compare year, month and day directly instead of string representation
          return (
            taskDate.getFullYear() === normalizedDate.getFullYear() &&
            taskDate.getMonth() === normalizedDate.getMonth() &&
            taskDate.getDate() === normalizedDate.getDate()
          );
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

    /**
     * Get completed tasks by date range
     * @param {Date} startDate - Start of range (inclusive)
     * @param {Date} endDate - End of range (inclusive)
     * @returns {Array} Filtered completed tasks
     */
    getCompletedTasksByDateRange: (startDate, endDate) => {
      const { completedTasks } = get();

      // Return all completed tasks if no date range is specified
      if (!startDate || !endDate) return completedTasks;

      // Normalize dates to avoid time issues
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);

      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(23, 59, 59, 999);

      return completedTasks.filter((task) => {
        const completedAt = new Date(task.completedAt);
        return completedAt >= normalizedStartDate && completedAt <= normalizedEndDate;
      });
    },

    /**
     * Get counts of completed tasks for specific dates
     * @param {Date[]} dates - Array of dates to get counts for
     * @returns {number[]} Array of task counts corresponding to input dates
     */
    getCompletedTasksCountByDates: (dates) => {
      const { completedTasks } = get();

      // Return empty array if no dates are specified
      if (!dates || !Array.isArray(dates) || dates.length === 0) return [];

      // Create normalized date strings for comparison (YYYY-MM-DD format)
      const normalizedDates = dates.map((date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });

      // Get counts for each date
      return normalizedDates.map((normalizedDate) => {
        // Count tasks completed on this date
        return completedTasks.filter((task) => {
          if (!task.completedAt) return false;
          const completedAt = new Date(task.completedAt);
          const normalizedCompletedDate = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')}`;

          return normalizedCompletedDate === normalizedDate;
        }).length;
      });
    },

    clearTasksCache: () => {
      Object.keys(tasksByDateCache).forEach((key) => delete tasksByDateCache[key]);
    },
  };
});
