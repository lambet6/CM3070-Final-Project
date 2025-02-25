/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTaskRepository, TASKS_KEY } from '../../../repositories/task-repository';
import { Task } from '../../../domain/Task';
import { createSampleTasks } from '../../fixtures/task-fixtures';

describe('Task Repository', () => {
  // Create a repository instance for each test
  let taskRepository;
  let sampleTasks;

  beforeEach(async () => {
    // Create fresh test data for each test
    sampleTasks = createSampleTasks();

    await AsyncStorage.clear();
    jest.clearAllMocks();

    // Create a fresh repository for each test
    taskRepository = createTaskRepository();
  });

  it('loads tasks from storage', async () => {
    // Arrange
    const testTask = sampleTasks.mediumPriorityTask;
    await AsyncStorage.setItem(
      TASKS_KEY,
      JSON.stringify([
        {
          id: testTask.id,
          title: testTask.title,
          priority: testTask.priority,
          dueDate: testTask.dueDate.toISOString(),
          completed: testTask.completed,
        },
      ]),
    );

    // Act
    const tasks = await taskRepository.getTasks();

    // Assert
    expect(tasks.length).toBe(1);
    expect(tasks[0]).toBeInstanceOf(Task);
    expect(tasks[0].id).toBe(testTask.id);
    expect(tasks[0].title).toBe(testTask.title);
    expect(tasks[0].priority).toBe(testTask.priority);
  });

  it('returns empty array if nothing stored', async () => {
    // Act
    const tasks = await taskRepository.getTasks();

    // Assert
    expect(tasks).toEqual([]);
  });

  it('saves tasks to storage', async () => {
    // Arrange
    const testTask = sampleTasks.highPriorityTask;

    // Act
    await taskRepository.saveTasks([testTask]);

    // Assert - Check that data was properly stored in AsyncStorage
    const storedValue = await AsyncStorage.getItem(TASKS_KEY);
    const parsed = JSON.parse(storedValue);

    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe(testTask.id);
    expect(parsed[0].title).toBe(testTask.title);
    expect(parsed[0].priority).toBe(testTask.priority);
    expect(parsed[0].dueDate).toBe(testTask.dueDate.toISOString());
    expect(parsed[0].completed).toBe(false);
  });

  it('handles storage errors gracefully', async () => {
    // Arrange - Create a mock AsyncStorage that throws errors
    const mockErrorStorage = {
      getItem: jest.fn().mockRejectedValue(new Error('Storage error')),
      setItem: jest.fn().mockRejectedValue(new Error('Storage error')),
    };

    const errorRepository = createTaskRepository(mockErrorStorage);

    // Act & Assert - getTasks should throw a meaningful error
    await expect(errorRepository.getTasks()).rejects.toThrow('Error loading tasks from repository');

    // Act & Assert - saveTasks should throw a meaningful error
    await expect(errorRepository.saveTasks([sampleTasks.lowPriorityTask])).rejects.toThrow(
      'Error saving tasks to repository',
    );
  });
});
