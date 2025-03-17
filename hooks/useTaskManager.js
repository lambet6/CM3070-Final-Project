import { createTaskManager } from '../managers/task-manager';
import { taskRepository } from '../repositories/task-repository';
import { useTaskStore } from '../store/taskStore';

// Create the singleton manager instance
const getStore = () => useTaskStore.getState();
export const taskManager = createTaskManager(taskRepository, getStore);

/**
 * Hook to access the task manager in components
 * @returns {Object} Task manager methods
 */
export const useTaskManager = () => {
  return taskManager;
};
