import { create } from 'zustand';
import {
  getTasks,
  createNewTask,
  editExistingTask,
  toggleTaskCompletion,
} from '../managers/task-manager';
import { isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Store for managing tasks state.
 */
export const useTaskStore = create((set, get) => ({
  tasks: { high: [], medium: [], low: [] },
  error: null,

  // Loads tasks using the manager, handling errors by updating the store's error state.
  loadTasks: async () => {
    try {
      const fetchedTasks = await getTasks();
      set({ tasks: fetchedTasks, error: null });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({
        tasks: { high: [], medium: [], low: [] },
        error: error.message || 'Failed to load tasks',
      });
    }
  },

  // Calls the manager to add a task.
  addTask: async (title, priority, dueDate) => {
    try {
      const updatedTasks = await createNewTask(title, priority, dueDate);
      set({ tasks: updatedTasks, error: null });
    } catch (error) {
      console.error('Failed to add task:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Calls the manager to edit a task.
  editTask: async (taskId, title, priority, dueDate) => {
    try {
      const updatedTasks = await editExistingTask(taskId, title, priority, dueDate);
      set({ tasks: updatedTasks, error: null });
    } catch (error) {
      console.error('Failed to edit task:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Calls the manager to toggle a task's completion status.
  toggleCompleteTask: async (taskId) => {
    try {
      const updatedTasks = await toggleTaskCompletion(taskId);
      set({ tasks: updatedTasks });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Utility functions to filter tasks.
  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    return allTasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, today);
    });
  },

  getWeekTasks: () => {
    const { tasks } = get();
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    return allTasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
  },
}));
