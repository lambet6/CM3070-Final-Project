import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../domain/Task'; 

export const TASKS_KEY = '@myapp_tasks';

/**
 * Retrieves tasks from the repository stored in AsyncStorage.
 *
 * @async
 * @function getTasksFromRepo
 * @returns {Promise<Task[]>} A promise that resolves to an array of Task objects.
 * @throws Will log an error to the console and return an empty array if there is an issue retrieving or parsing the tasks.
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
    return [];
  }
}

/**
 * Saves an array of tasks to the repository.
 *
 * @param {Task[]} tasks - The array of task objects to be saved.
 * @returns {Promise<void>} A promise that resolves when the tasks have been saved.
 * @throws Will log an error to the console if there is an error saving the tasks.
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
  }
}
