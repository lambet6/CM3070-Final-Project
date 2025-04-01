import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../domain/Task';

export const TASKS_KEY = '@myapp_tasks';
export const COMPLETED_TASKS_KEY = '@myapp_completed_tasks';
export const LAST_CLEANUP_DATE_KEY = '@myapp_last_cleanup_date';

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
        duration: task.duration,
        scheduledTime: task.scheduledTime ? task.scheduledTime.toISOString() : null,
      }));
      await storage.setItem(TASKS_KEY, JSON.stringify(plainTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw new Error('Error saving tasks to repository');
    }
  };

  /**
   * Saves a completed task to the history
   * @param {Task} task - The completed task to save
   * @returns {Promise<void>}
   */
  const saveCompletedTask = async (task) => {
    try {
      const completedTasks = await getCompletedTasks();

      // Add the task with completion timestamp
      const completedTask = {
        ...task.toJSON(),
        completedAt: new Date().toISOString(),
      };

      completedTasks.push(completedTask);
      await storage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(completedTasks));
    } catch (error) {
      console.error('Error saving completed task:', error);
      throw new Error('Error saving task to completed history');
    }
  };

  /**
   * Retrieves the history of completed tasks
   * @returns {Promise<Object[]>} Array of completed task objects
   */
  const getCompletedTasks = async () => {
    try {
      const raw = await storage.getItem(COMPLETED_TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Error loading completed tasks history:', error);
      throw new Error('Error loading completed tasks history');
    }
  };

  /**
   * Gets the date of the last completed tasks cleanup
   * @returns {Promise<Date|null>} The last cleanup date or null if never run
   */
  const getLastCleanupDate = async () => {
    try {
      const lastCleanupStr = await storage.getItem(LAST_CLEANUP_DATE_KEY);
      return lastCleanupStr ? new Date(lastCleanupStr) : null;
    } catch (error) {
      console.error('Error getting last cleanup date:', error);
      throw new Error('Error retrieving last cleanup date');
    }
  };

  /**
   * Sets the last cleanup date to the current date
   * @returns {Promise<void>}
   */
  const updateLastCleanupDate = async () => {
    try {
      await storage.setItem(LAST_CLEANUP_DATE_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last cleanup date:', error);
      throw new Error('Error updating last cleanup date');
    }
  };

  return {
    getTasks,
    saveTasks,
    saveCompletedTask,
    getCompletedTasks,
    getLastCleanupDate,
    updateLastCleanupDate,
  };
};
export const taskRepository = createTaskRepository();
