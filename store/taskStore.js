// /store/taskStore.js
import { create } from 'zustand';
import {
  getTasks,
  createNewTask,
  editExistingTask,
  toggleTaskCompletion
} from '../managers/task-manager';
import { isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

export const useTaskStore = create((set, get) => ({
  tasks: { high: [], medium: [], low: [] },

  loadTasks: async () => {
    try {
      const fetchedTasks = await getTasks();
      set({ tasks: fetchedTasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ tasks: { high: [], medium: [], low: [] } });
    }
  },

  addTask: async (title, priority, dueDate) => {
    const updatedTasks = await createNewTask(title, priority, dueDate);
    set({ tasks: updatedTasks });
  },

  editTask: async (taskId, title, priority, dueDate) => {
    const updatedTasks = await editExistingTask(taskId, title, priority, dueDate);
    set({ tasks: updatedTasks });
  },

  toggleCompleteTask: async (taskId) => {
    const updatedTasks = await toggleTaskCompletion(taskId);
    set({ tasks: updatedTasks });
  },

  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    return allTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, today);
    });
  },

  getWeekTasks: () => {
    const { tasks } = get();
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    
    return allTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
  },
}));
