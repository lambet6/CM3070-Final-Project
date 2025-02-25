/*global jest*/
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { createTaskStore } from '../../../store/taskStore';
import {
  createSampleTasks,
  createGroupedTaskSets,
  createTestDates,
} from '../../fixtures/task-fixtures';
import { setupMockDate } from '../../utils/test-utils';
import { createMockTaskManager } from '../../mocks/task-manager.mock';

describe('TaskStore', () => {
  let mockTaskManager;
  let useTestStore;
  let cleanupDate;
  let sampleTasks;
  let groupedTaskSets;
  let testDates;

  beforeEach(() => {
    sampleTasks = createSampleTasks();
    groupedTaskSets = createGroupedTaskSets();
    testDates = createTestDates();

    // Create mock task manager
    mockTaskManager = createMockTaskManager();

    // Create test store with our mock manager
    useTestStore = createTaskStore(mockTaskManager);

    // Set up mock date for consistent date testing
    cleanupDate = setupMockDate(testDates.today);
  });

  afterEach(() => {
    if (cleanupDate) {
      cleanupDate();
    }
  });

  describe('Initial State', () => {
    it('should initialize with empty task groups', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTestStore());

      // Assert
      expect(result.current.tasks).toEqual({
        high: expect.any(Array),
        medium: expect.any(Array),
        low: expect.any(Array),
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('Task Loading', () => {
    it('should call the task manager when loading tasks', async () => {
      // Arrange
      mockTaskManager.getTasks.mockResolvedValueOnce(groupedTaskSets.allPriorities);
      const { result } = renderHook(() => useTestStore());

      // Act
      await act(async () => {
        await result.current.loadTasks();
      });

      // Assert
      expect(mockTaskManager.getTasks).toHaveBeenCalled();
      expect(result.current.tasks).toEqual(groupedTaskSets.allPriorities);
    });

    it('should handle task loading errors', async () => {
      // Arrange
      const errorMessage = 'Failed to load tasks';
      mockTaskManager.getTasks.mockRejectedValueOnce(new Error(errorMessage));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useTestStore());

      // Act
      await act(async () => {
        await result.current.loadTasks();
      });

      // Assert - Check error is captured in state
      expect(result.current.error).toBe(errorMessage);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Task Operations', () => {
    it('should call task manager when adding a task', async () => {
      // Arrange
      const { result } = renderHook(() => useTestStore());
      const taskTitle = 'New Test Task';
      const taskPriority = 'High';
      const taskDueDate = new Date();

      // Act
      await act(async () => {
        await result.current.addTask(taskTitle, taskPriority, taskDueDate);
      });

      // Assert
      expect(mockTaskManager.createNewTask).toHaveBeenCalledWith(
        taskTitle,
        taskPriority,
        taskDueDate,
      );
      expect(result.current.tasks).toEqual(groupedTaskSets.singleHighTask);
    });

    it('should call task manager when editing a task', async () => {
      // Arrange
      const { result } = renderHook(() => useTestStore());
      const taskId = '123';
      const updatedTitle = 'Updated Task';
      const updatedPriority = 'Medium';
      const updatedDueDate = new Date();

      // Act
      await act(async () => {
        await result.current.editTask(taskId, updatedTitle, updatedPriority, updatedDueDate);
      });

      // Assert
      expect(mockTaskManager.editExistingTask).toHaveBeenCalledWith(
        taskId,
        updatedTitle,
        updatedPriority,
        updatedDueDate,
      );
      expect(result.current.tasks).toEqual(groupedTaskSets.singleHighTask);
    });

    it('should call task manager when toggling task completion', async () => {
      // Arrange
      const { result } = renderHook(() => useTestStore());
      const taskId = '123';

      // Act
      await act(async () => {
        await result.current.toggleCompleteTask(taskId);
      });

      // Assert
      expect(mockTaskManager.toggleTaskCompletion).toHaveBeenCalledWith(taskId);
      expect(result.current.tasks).toEqual(groupedTaskSets.withCompleted);
    });

    it('should handle task operation errors', async () => {
      // Arrange
      const errorMessage = 'Failed to add task';
      mockTaskManager.createNewTask.mockRejectedValueOnce(new Error(errorMessage));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useTestStore());

      // Act & Assert
      await act(async () => {
        try {
          await result.current.addTask('Test', 'High', new Date());
          expect(true).toBe(false); // Should not reach here
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      consoleSpy.mockRestore();
    });
  });

  describe('Task Filtering', () => {
    it('should filter tasks for today', async () => {
      // Arrange - Setup store with pre-populated tasks
      const { result } = renderHook(() => useTestStore());

      // Pre-populate tasks
      await act(async () => {
        // Mock the store state directly
        result.current.tasks = {
          high: [{ ...sampleTasks.highPriorityTask, dueDate: testDates.today }],
          medium: [{ ...sampleTasks.mediumPriorityTask, dueDate: testDates.tomorrow }],
          low: [{ ...sampleTasks.lowPriorityTask, dueDate: testDates.nextWeek }],
        };
      });

      // Act
      let todayTasks;
      await act(async () => {
        todayTasks = result.current.getTodayTasks();
      });

      // Assert
      expect(todayTasks.length).toBe(1);
      expect(todayTasks[0].priority).toBe('High');
    });

    it('should filter tasks for the current week', async () => {
      // Arrange - Setup store with pre-populated tasks
      const { result } = renderHook(() => useTestStore());

      // Pre-populate tasks
      await act(async () => {
        // Mock the store state directly with tasks that are in this week and beyond
        result.current.tasks = {
          high: [{ ...sampleTasks.highPriorityTask, dueDate: testDates.today }],
          medium: [{ ...sampleTasks.mediumPriorityTask, dueDate: testDates.tomorrow }],
          low: [{ ...sampleTasks.lowPriorityTask, dueDate: testDates.nextWeek }],
        };
      });

      // Act
      let weekTasks;
      await act(async () => {
        weekTasks = result.current.getWeekTasks();
      });

      // Assert - Only high and medium should be in this week
      expect(weekTasks.length).toBe(2);
      const priorities = weekTasks.map((t) => t.priority);
      expect(priorities).toContain('High');
      expect(priorities).toContain('Medium');
      expect(priorities).not.toContain('Low');
    });
  });
});
