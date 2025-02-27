/*global jest*/
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { createTaskManager } from '../../../managers/task-manager';
import { createSampleTasks } from '../../fixtures/task-fixtures';
import { createTaskRepository } from '../../../repositories/task-repository';

// Automatically mock the repository
jest.mock('../../../repositories/task-repository');

describe('Task Manager', () => {
  const MOCK_TIMESTAMP = 1234567890;
  let mockRepository;
  let taskManager;
  let sampleTasks;

  beforeEach(() => {
    // Create fresh test data for each test
    sampleTasks = createSampleTasks();

    // Setup a mock repository and inject it into the task manager
    mockRepository = createTaskRepository();
    taskManager = createTaskManager(mockRepository);

    // Mock Date.now for consistent task IDs
    jest.spyOn(global.Date, 'now').mockImplementation(() => MOCK_TIMESTAMP);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Task Creation', () => {
    it('should create and save a new task', async () => {
      // Arrange
      const existingTasks = [sampleTasks.lowPriorityTask];
      mockRepository.getTasks.mockResolvedValue(existingTasks);

      const newTitle = 'New Task';
      const newPriority = 'High';
      const newDueDate = new Date('2025-02-15');

      // Act
      const result = await taskManager.createNewTask(newTitle, newPriority, newDueDate);

      // Assert
      // Check that repository was called with expected arguments
      expect(mockRepository.getTasks).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveTasks).toHaveBeenCalledTimes(1);

      // Verify task was added to the array passed to saveTasks
      const savedTasks = mockRepository.saveTasks.mock.calls[0][0];
      expect(savedTasks.length).toBe(2); // Original task + new task

      // Verify task properties
      const newTask = savedTasks.find((task) => task.title === newTitle);
      expect(newTask).toBeDefined();
      expect(newTask.priority).toBe(newPriority);
      expect(newTask.dueDate).toEqual(newDueDate);
      expect(newTask.completed).toBe(false);

      // Verify the grouped tasks returned by the function
      expect(result.high.length).toBe(1);
      expect(result.low.length).toBe(1);
    });

    it('should validate required task properties', async () => {
      // Test missing title
      await expect(taskManager.createNewTask('', 'High', new Date())).rejects.toThrow(
        'Task title is required',
      );

      // Test invalid priority
      await expect(taskManager.createNewTask('Valid Title', 'Invalid', new Date())).rejects.toThrow(
        'Invalid priority value',
      );

      // Test invalid date
      await expect(taskManager.createNewTask('Valid Title', 'High', 'not-a-date')).rejects.toThrow(
        'Valid due date is required',
      );
    });
  });

  describe('Task Editing', () => {
    it('should edit an existing task and save changes', async () => {
      // Arrange
      const existingTask = sampleTasks.lowPriorityTask;
      mockRepository.getTasks.mockResolvedValue([existingTask]);

      const updatedTitle = 'Updated Task';
      const updatedPriority = 'High';
      const updatedDueDate = new Date('2025-02-20');

      // Act
      const result = await taskManager.editExistingTask(
        existingTask.id,
        updatedTitle,
        updatedPriority,
        updatedDueDate,
      );

      // Assert
      expect(mockRepository.getTasks).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveTasks).toHaveBeenCalledTimes(1);

      // Verify task was updated in the array passed to saveTasks
      const savedTasks = mockRepository.saveTasks.mock.calls[0][0];
      const updatedTask = savedTasks.find((task) => task.id === existingTask.id);

      expect(updatedTask.title).toBe(updatedTitle);
      expect(updatedTask.priority).toBe(updatedPriority);
      expect(updatedTask.dueDate).toEqual(updatedDueDate);

      // Verify the grouped tasks returned
      expect(result.high.length).toBe(1);
      expect(result.medium.length).toBe(0);
      expect(result.low.length).toBe(0);
    });

    it('should throw error when editing non-existent task', async () => {
      // Arrange
      mockRepository.getTasks.mockResolvedValue([sampleTasks.highPriorityTask]);

      // Act & Assert
      await expect(
        taskManager.editExistingTask('non-existent-id', 'Title', 'Medium', new Date()),
      ).rejects.toThrow('Task not found');
    });
  });

  describe('Task Operations', () => {
    it('should toggle task completion status', async () => {
      // Arrange - Use a COPY of the high priority task to avoid modifying the fixture
      const taskToToggle = sampleTasks.highPriorityTask;
      mockRepository.getTasks.mockResolvedValue([taskToToggle]);

      // Act - Toggle the task from uncompleted to completed
      await taskManager.toggleTaskCompletion(taskToToggle.id);

      // Assert
      expect(mockRepository.saveTasks).toHaveBeenCalledTimes(1);

      // Verify the task's completion status was toggled
      const savedTasks = mockRepository.saveTasks.mock.calls[0][0];
      const toggledTask = savedTasks.find((task) => task.id === taskToToggle.id);
      expect(toggledTask.completed).toBe(true);
    });

    it('should return empty task groups when no tasks exist', async () => {
      // Arrange
      mockRepository.getTasks.mockResolvedValue([]);

      // Act
      const result = await taskManager.getTasks();

      // Assert
      expect(result).toEqual({ high: [], medium: [], low: [] });
    });

    it('should group and sort tasks by priority', async () => {
      // Arrange - Create a fresh array of tasks for this test
      const tasks = [
        { ...sampleTasks.highPriorityTask },
        { ...sampleTasks.mediumPriorityTask, completed: true },
        { ...sampleTasks.lowPriorityTask },
        { ...sampleTasks.completedTask, priority: 'High' }, // Another completed high priority task
      ];

      mockRepository.getTasks.mockResolvedValue(tasks);

      // Act
      const result = await taskManager.getTasks();

      // Assert
      // Check that tasks are grouped by priority
      expect(result.high.length).toBe(2);
      expect(result.medium.length).toBe(1);
      expect(result.low.length).toBe(1);

      // Check that completed tasks come after non-completed tasks
      expect(result.high[0].completed).toBe(false);
      expect(result.high[1].completed).toBe(true);
    });
  });
});
