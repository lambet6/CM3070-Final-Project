import { create } from 'zustand';
import { getTasks, createNewTask, editExistingTask } from '../managers/task-manager';
import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export const useTaskStore = create((set, get) => ({
  tasks: { high: [], medium: [], low: [] },

  loadTasks: async () => {
    const fetchedTasks = await getTasks();
    set({ tasks: fetchedTasks });
  },

  addTask: async (title, priority, dueDate) => {
    const updatedTasks = await createNewTask(title, priority, dueDate);
    set({ tasks: updatedTasks });
  },

  editTask: async (taskId, title, priority, dueDate) => {
    const updatedTasks = await editExistingTask(taskId, title, priority, dueDate);
    set({ tasks: updatedTasks });
  },

  // Selector for Today's Tasks
  getTodayTasks: () => {
    const { tasks } = get();
    const today = new Date();
    return [...tasks.high, ...tasks.medium, ...tasks.low].filter(task =>
      isSameDay(new Date(task.dueDate), today)
    );
  },

  // Selector for This Week's Tasks
  getWeekTasks: () => {
    const { tasks } = get();
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());
    return [...tasks.high, ...tasks.medium, ...tasks.low].filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= start && taskDate <= end;
    });
  }
}));
