/*global jest*/
import { Mood } from '../../domain/Mood';
import { createSampleMoods } from '../../__tests__/fixtures/wellbeing-fixtures';

/**
 * Creates a mock wellbeing manager for testing
 * @param {Object} customImplementations - Optional custom implementations for methods
 * @returns {Object} Mock wellbeing manager with all required methods
 */
export const createWellbeingManager = (
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
    getLast14DaysMoodData: jest.fn().mockImplementation(() => {
      return {
        labels: Array.from({ length: 14 }, (_, i) => `2025-03-${String(i + 1).padStart(2, '0')}`),
        data: Array.from({ length: 14 }, () => Math.floor(Math.random() * 5) + 1),
      };
    }),

    // Override with any custom implementations provided
    ...customImplementations,
  };
};
