/*global jest*/
import { createGoalCollections } from '../../__tests__/fixtures/goal-fixtures';

/**
 * Creates a mock goals manager for testing
 * @param {Object} customImplementations - Optional custom implementations for specific methods
 * @returns {Object} Mock goals manager with all required methods
 */
export const createGoalsManager = (
  initialGoals = createGoalCollections(),
  customImplementations = {},
) => {
  // Default implementations
  const defaults = {
    fetchGoals: jest.fn().mockResolvedValue(initialGoals.empty),
    addGoal: jest.fn().mockImplementation((title, hours) => {
      const updatedGoals = [
        ...initialGoals.empty,
        {
          id: Date.now().toString(),
          title,
          hoursPerWeek: hours,
        },
      ];
      return Promise.resolve(updatedGoals);
    }),
    updateGoalData: jest.fn().mockResolvedValue(initialGoals.singleGoal),
    deleteGoal: jest.fn().mockResolvedValue([]),
  };

  // Combine defaults with any custom implementations
  return {
    ...defaults,
    ...customImplementations,
  };
};
