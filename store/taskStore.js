import { create } from 'zustand';
import {
  getTasks,
  createNewTask,
  editExistingTask,
  toggleTaskCompletion,
} from '../managers/task-manager';
import { isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

/**
 * @typedef {import('../domain/Task').Task} Task
 */

/**
 * @typedef {Object} TasksByPriority
 * @property {Task[]} high - High priority tasks
 * @property {Task[]} medium - Medium priority tasks
 * @property {Task[]} low - Low priority tasks
 */

/**
 * Store for managing tasks state.
 * @typedef {Object} TaskStore
 * @property {TasksByPriority} tasks - Tasks grouped by priority
 * @property {() => Promise<void>} loadTasks - Loads all tasks
 * @property {(title: string, priority: string, dueDate: Date) => Promise<void>} addTask - Creates and adds a new task
 * @property {(taskId: string, title: string, priority: string, dueDate: Date) => Promise<void>} editTask - Updates an existing task
 * @property {(taskId: string) => Promise<void>} toggleCompleteTask - Toggles completion status of a task
 * @property {() => Task[]} getTodayTasks - Gets tasks due today
 * @property {() => Task[]} getWeekTasks - Gets tasks due this week
 */

/**
 * Creates a store for managing tasks.
 * @type {import('zustand').UseBoundStore<TaskStore>}
 */
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
    return allTasks.filter((task) => {
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

    return allTasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
  },
}));
