/*global jest*/
import { createGroupedTaskSets } from '../fixtures/task-fixtures';

/**
 * Creates a mock task manager for testing
 * @param {Object} customImplementations - Optional custom implementations for specific methods
 * @returns {Object} Mock task manager with all required methods
 */
export const createMockTaskManager = (customImplementations = {}) => {
  const groupedTaskSets = createGroupedTaskSets();

  // Default implementations
  const defaults = {
    getTasks: jest.fn().mockResolvedValue(groupedTaskSets.empty),
    createNewTask: jest.fn().mockResolvedValue(groupedTaskSets.singleHighTask),
    editExistingTask: jest.fn().mockResolvedValue(groupedTaskSets.singleHighTask),
    toggleTaskCompletion: jest.fn().mockResolvedValue(groupedTaskSets.withCompleted),
  };

  // Combine defaults with any custom implementations
  return {
    ...defaults,
    ...customImplementations,
  };
};
