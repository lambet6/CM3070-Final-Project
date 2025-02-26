import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../domain/Task';

export const TASKS_KEY = '@myapp_tasks';

/**
 * Creates a task repository with the specified storage mechanism
 * @param {Object} storage - Storage implementation (defaults to AsyncStorage)
 * @returns {Object} Repository object with getTasks and saveTasks methods
 */
export const createTaskRepository = (storage = AsyncStorage) => {
  /**
   * Retrieves tasks from storage and converts them to Task instances
   * @async
   * @returns {Promise<Task[]>}
   * @throws An error if retrieval or parsing fails
   */
  const getTasks = async () => {
    try {
      const raw = await storage.getItem(TASKS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return parsed.map((obj) => new Task(obj));
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw new Error('Error loading tasks from repository');
    }
  };

  /**
   * Saves an array of Task instances to storage
   * @param {Task[]} tasks
   * @returns {Promise<void>}
   * @throws An error if saving fails
   */
  const saveTasks = async (tasks) => {
    try {
      const plainTasks = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate.toISOString(),
        completed: task.completed,
      }));
      await storage.setItem(TASKS_KEY, JSON.stringify(plainTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw new Error('Error saving tasks to repository');
    }
  };

  return {
    getTasks,
    saveTasks,
  };
};

export const taskRepository = createTaskRepository();
