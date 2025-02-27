/*global jest*/

/**
 * Creates a mock task repository for testing
 * @param {Object} initialData - Optional data to initialize the mock repository
 * @returns {Object} Mock repository with getTasks and saveTasks functions
 */
export const createMockTaskRepository = (initialData = []) => {
  // In-memory data store for the mock
  let tasksData = [...initialData];

  return {
    // Mock implementation of getTasks
    getTasks: jest.fn().mockImplementation(() => {
      return Promise.resolve([...tasksData]);
    }),

    // Mock implementation of saveTasks
    saveTasks: jest.fn().mockImplementation((tasks) => {
      tasksData = [...tasks];
      return Promise.resolve();
    }),
  };
};
