import { create } from 'zustand';
import { getTasks, createNewTask, editExistingTask } from '../managers/task-manager';

export const useTaskStore = create((set) => ({
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
  }
}));
