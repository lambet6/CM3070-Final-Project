/*global jest*/

/**
 * Creates a mock goals repository for testing
 * @param {Array} initialGoals - Optional initial goals data
 * @returns {Object} Mock repository with goals operations
 */
export const createMockGoalsRepository = (initialData = []) => {
  // In-memory data store for the mock
  let goalsData = [...initialData];

  return {
    // Mock implementation of getGoals
    getGoals: jest.fn().mockImplementation(() => {
      return Promise.resolve([...goalsData]);
    }),

    // Mock implementation of saveGoals
    saveGoals: jest.fn().mockImplementation((goals) => {
      goalsData = [...goals];
      return Promise.resolve();
    }),
  };
};
