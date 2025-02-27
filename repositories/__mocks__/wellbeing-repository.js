/*global jest*/

/**
 * Creates a mock wellbeing repository for testing
 * @param {Array} initialMoodData - Optional initial mood data
 * @returns {Object} Mock repository with wellbeing operations
 */
export const createWellbeingRepository = (initialData = []) => {
  // In-memory data store for the mock
  let moodData = [...initialData];

  return {
    // Mock implementation of getMoodData
    getMoodData: jest.fn().mockImplementation(() => {
      return Promise.resolve([...moodData]);
    }),

    // Mock implementation of saveMood
    saveMood: jest.fn().mockImplementation((mood) => {
      moodData = [...moodData, mood];
      return Promise.resolve();
    }),

    // Mock implementation of updateMoodForToday
    updateMoodForToday: jest.fn().mockImplementation((mood) => {
      const filteredData = moodData.filter((entry) => !entry.isToday());
      moodData = [...filteredData, mood];
      return Promise.resolve();
    }),
  };
};

export const MOOD_DATA_KEY = 'mock-mood-key';
