/*global jest*/
import { Mood } from '../../domain/Mood';
import { createSampleMoods } from '../fixtures/wellbeing-fixtures';

/**
 * Creates a mock wellbeing manager for testing
 * @param {Object} customImplementations - Optional custom implementations for methods
 * @returns {Object} Mock wellbeing manager with all required methods
 */
export const createMockWellbeingManager = (
  initialMoods = createSampleMoods(),
  customImplementations = {},
) => {
  return {
    // Default mock implementations
    getMoodData: jest.fn().mockResolvedValue(initialMoods.empty),
    saveMood: jest.fn().mockImplementation((moodValue) => {
      const newMood = new Mood({
        mood: moodValue,
        date: new Date(),
      });
      return Promise.resolve(newMood);
    }),

    // Override with any custom implementations provided
    ...customImplementations,
  };
};
