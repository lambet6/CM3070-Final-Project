/*global jest*/
import { createGoalCollections } from '../fixtures/goal-fixtures';

/**
 * Creates a mock goals repository for testing
 * @param {Array} initialGoals - Optional initial goals data
 * @returns {Object} Mock repository with goals operations
 */
export const createMockGoalsRepository = (initialGoals = createGoalCollections().empty) => {
  // In-memory data store for the mock
  let goalsData = [...initialGoals];

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

    // Helper to reset the mock data
    __resetData: (newData = []) => {
      goalsData = [...newData];
    },

    // Helper to get the current mock data directly
    __getData: () => [...goalsData],
  };
};
