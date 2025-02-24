import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../domain/Task';

export const TASKS_KEY = '@myapp_tasks';

/**
 * Retrieves tasks from AsyncStorage and converts them to Task instances.
 * @async
 * @returns {Promise<Task[]>}
 * @throws An error if retrieval or parsing fails.
 */
export async function getTasksFromRepo() {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return parsed.map((obj) => new Task(obj));
  } catch (error) {
    console.error('Error loading tasks:', error);
    // Propagate the error so the manager can handle it.
    throw new Error('Error loading tasks from repository');
  }
}

/**
 * Saves an array of Task instances to AsyncStorage.
 * @param {Task[]} tasks
 * @returns {Promise<void>}
 * @throws An error if saving fails.
 */
export async function saveTasksToRepo(tasks) {
  try {
    const plainTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate.toISOString(),
      completed: task.completed,
    }));
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(plainTasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw new Error('Error saving tasks to repository');
  }
}
