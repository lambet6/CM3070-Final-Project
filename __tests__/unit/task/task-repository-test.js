/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTasksFromRepo,
  saveTasksToRepo,
  TASKS_KEY,
} from '../../../repositories/task-repository';
import { Task } from '../../../domain/Task';

describe('tasks-server (unit)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('loads tasks from storage', async () => {
    const testDate = new Date('2024-01-01');
    await AsyncStorage.setItem(
      TASKS_KEY,
      JSON.stringify([
        {
          id: '1',
          title: 'Test Task',
          priority: 'Medium',
          dueDate: testDate.toISOString(),
          completed: false,
        },
      ]),
    );

    const tasks = await getTasksFromRepo();
    expect(tasks[0]).toBeInstanceOf(Task);
    expect(tasks[0]).toEqual(
      new Task({
        id: '1',
        title: 'Test Task',
        priority: 'Medium',
        dueDate: testDate.toISOString(),
        completed: false,
      }),
    );
  });

  it('returns empty array if nothing stored', async () => {
    const tasks = await getTasksFromRepo();
    expect(tasks).toEqual([]);
  });

  it('saves tasks to storage', async () => {
    const testDate = new Date('2024-01-01');
    const mockTasks = [
      new Task({
        id: '101',
        title: 'Save Me',
        priority: 'High',
        dueDate: testDate,
        completed: false,
      }),
    ];

    await saveTasksToRepo(mockTasks);

    const storedValue = await AsyncStorage.getItem(TASKS_KEY);
    expect(JSON.parse(storedValue)).toEqual([
      {
        id: '101',
        title: 'Save Me',
        priority: 'High',
        dueDate: testDate.toISOString(),
        completed: false,
      },
    ]);
  });
});
