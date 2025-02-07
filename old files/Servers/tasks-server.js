import AsyncStorage from '@react-native-async-storage/async-storage';

export const TASKS_KEY = '@myapp_tasks';

export const loadTasksFromStorage = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.log('Error loading tasks:', error);
    return [];
  }
};

export const saveTasksToStorage = async (tasks) => {
  try {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem(TASKS_KEY, jsonValue);
  } catch (error) {
    console.log('Error saving tasks:', error);
  }
};
