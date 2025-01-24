const TASKS_KEY = '@myapp_tasks';

const saveTasksToStorage = async (tasks) => {
  try {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem(TASKS_KEY, jsonValue);
  } catch (e) {
    console.log('Error saving tasks', e);
  }
};

const loadTasksFromStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.log('Error loading tasks', e);
      return [];
    }
};