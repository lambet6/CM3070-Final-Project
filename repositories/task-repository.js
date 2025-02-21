import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../domain/Task'; 

export const TASKS_KEY = '@myapp_tasks';

export async function getTasksFromRepo() {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    if (!raw) {
      // No tasks saved yet
      return [];
    }

    // Parse JSON array, then map each item to a Task domain object
    const parsed = JSON.parse(raw);
    return parsed.map((obj) => new Task(obj));
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

export async function saveTasksToRepo(tasks) {
  try {
    // tasks is an array of Task domain objects;
    // convert them back to plain JSON for saving
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
