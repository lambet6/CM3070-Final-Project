/*global jest*/
import { createGroupedTaskSets } from '../fixtures/task-fixtures';

/**
 * Creates a mock task manager for testing
 * @param {Object} customImplementations - Optional custom implementations for specific methods
 * @returns {Object} Mock task manager with all required methods
 */
export const createMockTaskManager = (
  initialTaskSets = createGroupedTaskSets(),
  customImplementations = {},
) => {
  // Default implementations
  const defaults = {
    getTasks: jest.fn().mockResolvedValue(initialTaskSets.empty),
    createNewTask: jest.fn().mockResolvedValue(initialTaskSets.singleHighTask),
    editExistingTask: jest.fn().mockResolvedValue(initialTaskSets.singleHighTask),
    toggleTaskCompletion: jest.fn().mockResolvedValue(initialTaskSets.withCompleted),
  };

  // Combine defaults with any custom implementations
  return {
    ...defaults,
    ...customImplementations,
  };
};
