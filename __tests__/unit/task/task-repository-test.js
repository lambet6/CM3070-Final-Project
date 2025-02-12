import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTasksFromRepo, saveTasksToRepo, TASKS_KEY } from '../../../repositories/task-repository';

describe('tasks-server (unit)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear(); 
    jest.clearAllMocks();
  });

  it('loads tasks from storage', async () => {
    // Pre-populate the mock storage
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify([
      { id: '1', title: 'Test Task' }
    ]));

    // Call the function
    const tasks = await getTasksFromRepo();
    expect(tasks).toEqual([{ id: '1', title: 'Test Task' }]);
  });

  it('returns empty array if nothing stored', async () => {
    // Make sure no items are in storage
    const tasks = await getTasksFromRepo();
    expect(tasks).toEqual([]);
  });

  it('saves tasks to storage', async () => {
    const mockTasks = [
      { id: '101', title: 'Save Me', priority: 'High' }
    ];
    await saveTasksToRepo(mockTasks);

    const storedValue = await AsyncStorage.getItem(TASKS_KEY);
    expect(JSON.parse(storedValue)).toEqual(mockTasks);
  });
});

