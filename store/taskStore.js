import { create } from 'zustand';
import { createTaskManager } from '../managers/task-manager';
import { taskRepository } from '../repositories/task-repository';
import { isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Creates a task store with the provided task manager
 * @param {Object} customTaskManager - Custom task manager to use for dependency injection
 * @returns {Function} Zustand store hook
 */
export const createTaskStore = (customTaskManager = null) => {
  // Use provided task manager or create default one
  const taskManager = customTaskManager || createTaskManager(taskRepository);

  return create((set, get) => ({
    tasks: { high: [], medium: [], low: [] },
    error: null,
    hasRescheduledThisSession: false,

    // Loads tasks using the manager
    loadTasks: async () => {
      try {
        const fetchedTasks = await taskManager.getTasks();
        set({ tasks: fetchedTasks, error: null });
      } catch (error) {
        console.error('Failed to load tasks:', error);
        set({
          tasks: { high: [], medium: [], low: [] },
          error: error.message || 'Failed to load tasks',
        });
      }
    },

    // Calls the manager to add a task
    addTask: async (title, priority, dueDate) => {
      try {
        const updatedTasks = await taskManager.createNewTask(title, priority, dueDate);
        set({ tasks: updatedTasks, error: null });
      } catch (error) {
        console.error('Failed to add task:', error);
        set({ error: error.message });
        throw error;
      }
    },

    // Calls the manager to edit a task
    editTask: async (taskId, title, priority, dueDate) => {
      try {
        const updatedTasks = await taskManager.editExistingTask(taskId, title, priority, dueDate);
        set({ tasks: updatedTasks, error: null });
      } catch (error) {
        console.error('Failed to edit task:', error);
        set({ error: error.message });
        throw error;
      }
    },

    // Calls the manager to toggle a task's completion status
    toggleCompleteTask: async (taskId) => {
      try {
        const updatedTasks = await taskManager.toggleTaskCompletion(taskId);
        set({ tasks: updatedTasks });
      } catch (error) {
        console.error('Failed to toggle task completion:', error);
        set({ error: error.message });
        throw error;
      }
    },

    // Calls the manager to delete multiple tasks
    deleteTasks: async (taskIds) => {
      try {
        const updatedTasks = await taskManager.deleteTasks(taskIds);
        set({ tasks: updatedTasks, error: null });
      } catch (error) {
        console.error('Failed to delete tasks:', error);
        set({ error: error.message });
        throw error;
      }
    },

    // Add this function inside the store object
    rescheduleOverdueTasks: async (daysToAdd = 1) => {
      try {
        // Track if we've already rescheduled this session
        if (get().hasRescheduledThisSession) return { count: 0 };

        const result = await taskManager.rescheduleOverdueTasks(daysToAdd);
        if (result.count > 0) {
          set({
            tasks: result.tasks,
            hasRescheduledThisSession: true,
            error: null,
          });
        } else {
          set({ hasRescheduledThisSession: true });
        }

        return { count: result.count };
      } catch (error) {
        console.error('Failed to reschedule tasks:', error);
        set({ error: error.message });
        return { count: 0, error: error.message };
      }
    },

    getConsolidatedTasks: () => {
      const { tasks } = get();
      return taskManager.consolidateTasks(tasks);
    },

    getTasksOnDate: (date) => {
      const { tasks } = get();
      const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
      return allTasks.filter((task) => {
        const taskDate = new Date(task.dueDate);
        return isSameDay(taskDate, date);
      });
    },
  }));
};

/**
 * Default task store instance for use in components
 */
export const useTaskStore = createTaskStore();
