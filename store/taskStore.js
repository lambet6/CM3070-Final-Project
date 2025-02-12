import { create } from 'zustand';
import { getTasks, createNewTask, editExistingTask, toggleTaskCompletion } from '../managers/task-manager';
import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export const useTaskStore = create((set, get) => ({
  tasks: { high: [], medium: [], low: [] },

  loadTasks: async () => {
    const fetchedTasks = await getTasks();
    set({ tasks: sortTasks(fetchedTasks) });
  },

  addTask: async (title, priority, dueDate) => {
    const updatedTasks = await createNewTask(title, priority, dueDate);
    set({ tasks: sortTasks(updatedTasks) });
  },

  editTask: async (taskId, title, priority, dueDate) => {
    const updatedTasks = await editExistingTask(taskId, title, priority, dueDate);
    set({ tasks: sortTasks(updatedTasks) });
  },

  toggleCompleteTask: async (taskId) => {
    const updatedTasks = await toggleTaskCompletion(taskId);
    set({ tasks: sortTasks(updatedTasks) });
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

// Helper Function: Move Completed Tasks to Bottom
function sortTasks(tasks) {
  const moveCompletedToBottom = (taskList) =>
    [...taskList.filter(t => !t.completed), ...taskList.filter(t => t.completed)];

  return {
    high: moveCompletedToBottom(tasks.high),
    medium: moveCompletedToBottom(tasks.medium),
    low: moveCompletedToBottom(tasks.low),
  };
}