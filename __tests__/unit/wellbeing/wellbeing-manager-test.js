/*global jest*/
import { describe, beforeAll, afterAll, beforeEach, expect, afterEach, it } from '@jest/globals';
import { createWellbeingManager } from '../../../managers/wellbeing-manager';
import { createWellbeingRepository } from '../../../repositories/wellbeing-repository';
import { useWellbeingStore } from '../../../store/wellbeingStore';
import { Mood } from '../../../domain/Mood';
import { startOfDay, subDays } from 'date-fns';

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

const resetWellbeingStore = () => {
  useWellbeingStore.setState({
    moodData: [],
    error: null,
    isLoading: false,
  });
};

jest.mock('../../../repositories/wellbeing-repository');
jest.mock('../../../store/wellbeingStore');

afterAll(() => {
  console.error = originalConsoleError;
});

const createMockMood = ({ mood, date }) => {
  const moodValues = {
    'Very happy': 5,
    Happy: 4,
    Neutral: 3,
    Low: 2,
    'Very low': 1,
  };

  return {
    mood,
    date: date instanceof Date ? date : new Date(date),
    moodValue: moodValues[mood] || 3,
    isToday: function () {
      const today = new Date();
      return (
        this.date.getDate() === today.getDate() &&
        this.date.getMonth() === today.getMonth() &&
        this.date.getFullYear() === today.getFullYear()
      );
    },
    toJSON: function () {
      return {
        mood: this.mood,
        date: this.date.toISOString(),
      };
    },
  };
};

jest.mock('../../../domain/Mood', () => {
  const OriginalMood = jest.requireActual('../../../domain/Mood').Mood;

  // Create a mock constructor that Jest can spy on
  const MockMood = jest.fn().mockImplementation(function (params) {
    // Use Object.assign to add properties to 'this'
    Object.assign(this, createMockMood(params));

    // Add properties to ensure instanceof checks pass
    Object.setPrototypeOf(this, OriginalMood.prototype);
  });

  // Copy static properties and prototype
  Object.setPrototypeOf(MockMood, OriginalMood);

  return { Mood: MockMood };
});

describe('Wellbeing Manager', () => {
  let repository;
  let manager;
  let getStore;

  beforeEach(() => {
    // Reset store state
    resetWellbeingStore();

    // Create a fresh repository mock for each test
    repository = createWellbeingRepository();

    // Setup the getStore function
    getStore = () => useWellbeingStore.getState();

    // Create manager with mocks
    manager = createWellbeingManager(repository, getStore);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMoodData', () => {
    it('should fetch mood data and update store on success', async () => {
      // Arrange
      const mockMood = new Mood({ mood: 'Very happy', date: new Date() });
      const mockMoodData = [mockMood];
      repository.getMoodData.mockResolvedValueOnce(mockMoodData);

      // Act
      const result = await manager.getMoodData();

      // Assert
      expect(repository.getMoodData).toHaveBeenCalledTimes(1);
      expect(getStore().setLoading).toHaveBeenNthCalledWith(1, true);
      expect(getStore().setLoading).toHaveBeenLastCalledWith(false);
      expect(getStore().setMoodData).toHaveBeenCalledWith(mockMoodData);
      expect(getStore().setError).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockMoodData);
    });

    it('should handle errors when fetching mood data', async () => {
      // Arrange
      const mockError = new Error('Network error');
      repository.getMoodData.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(manager.getMoodData()).rejects.toThrow(mockError);
      expect(repository.getMoodData).toHaveBeenCalledTimes(1);
      expect(getStore().setLoading).toHaveBeenNthCalledWith(1, true);
      expect(getStore().setLoading).toHaveBeenLastCalledWith(false);
      expect(getStore().setMoodData).toHaveBeenCalledWith([]);
      expect(getStore().setError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch mood data'),
      );
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saveMood', () => {
    it('should save mood and update store on success', async () => {
      // Arrange
      const moodValue = 'Happy';
      const existingMood = new Mood({ mood: 'Low', date: subDays(new Date(), 1) });
      useWellbeingStore.getState().moodData = [existingMood];

      // Need to manually mock what happens when repository is called
      repository.updateMoodForToday.mockImplementation((mood) => {
        // Just resolve the promise
        return Promise.resolve();
      });

      // Act
      const result = await manager.saveMood(moodValue);

      // Assert
      expect(repository.updateMoodForToday).toHaveBeenCalledTimes(1);
      expect(getStore().setError).toHaveBeenCalledWith(null);

      // Verify the new mood was created with correct value
      expect(result.mood).toBe(moodValue);

      // Check store update - we need to access the actual mock call
      const storeSetMoodDataCall = getStore().setMoodData.mock.calls[0][0];
      expect(storeSetMoodDataCall.length).toBe(2);
      expect(storeSetMoodDataCall[0]).toBe(existingMood);
      expect(storeSetMoodDataCall[1].mood).toBe(moodValue);
    });

    it('should handle errors when saving mood', async () => {
      // Arrange
      const mockError = new Error('Save error');
      repository.updateMoodForToday.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(manager.saveMood('Happy')).rejects.toThrow(mockError);
      expect(repository.updateMoodForToday).toHaveBeenCalledTimes(1);
      expect(getStore().setError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save mood'),
      );
      expect(console.error).toHaveBeenCalled();
    });

    it('should replace an existing mood for today', async () => {
      // Arrange
      const oldMoodValue = 'Very low';
      const newMoodValue = 'Very happy';

      // Create a mood for today
      const oldMood = new Mood({ mood: oldMoodValue, date: new Date() });
      const today = new Date();

      // Set up state with existing mood
      useWellbeingStore.getState().moodData = [oldMood];

      // Special mock to verify correct behavior
      Mood.mockImplementationOnce(function ({ mood, date }) {
        Object.assign(this, createMockMood({ mood, date }));
        Object.setPrototypeOf(this, Mood.prototype);
      });

      // Mock updateMoodForToday to do nothing (just resolve)
      repository.updateMoodForToday.mockResolvedValueOnce();

      // Act
      const result = await manager.saveMood(newMoodValue);

      // Assert
      expect(result.mood).toBe(newMoodValue);

      // Check that only one mood was set in the store (the new one)
      const storeSetMoodDataCall = getStore().setMoodData.mock.calls[0][0];
      expect(storeSetMoodDataCall.length).toBe(1);
      expect(storeSetMoodDataCall[0].mood).toBe(newMoodValue);
    });
  });

  describe('getLast14DaysMoodData', () => {
    it('should format mood data for the last 14 days', () => {
      // Arrange
      const today = startOfDay(new Date());
      const yesterday = subDays(today, 1);
      const dayBefore = subDays(today, 2);

      // Create mock mood objects with proper moodValue property
      const mockMoodData = [
        createMockMood({ mood: 'Very happy', date: today }),
        createMockMood({ mood: 'Very low', date: yesterday }),
        createMockMood({ mood: 'Neutral', date: dayBefore }),
      ];

      // Set up the store with our mock data
      useWellbeingStore.getState().moodData = mockMoodData;

      // Act
      const result = manager.getLast14DaysMoodData();

      // Assert
      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('data');
      expect(result.labels).toHaveLength(14);
      expect(result.data).toHaveLength(14);

      // Check the last 3 days data (should match our mock data)
      const todayFormatted = today.toISOString().slice(0, 10);
      const yesterdayFormatted = yesterday.toISOString().slice(0, 10);
      const dayBeforeFormatted = dayBefore.toISOString().slice(0, 10);

      const todayIndex = result.labels.indexOf(todayFormatted);
      const yesterdayIndex = result.labels.indexOf(yesterdayFormatted);
      const dayBeforeIndex = result.labels.indexOf(dayBeforeFormatted);

      expect(result.data[todayIndex]).toBe(5); // Very happy
      expect(result.data[yesterdayIndex]).toBe(1); // Very low
      expect(result.data[dayBeforeIndex]).toBe(3); // Neutral
    });

    it('should handle missing mood data with zeros', () => {
      // Arrange - only set mood for today
      const today = startOfDay(new Date());

      // Create a single mood for today
      const mockMoodData = [createMockMood({ mood: 'Very happy', date: today })];

      // Set up the store
      useWellbeingStore.getState().moodData = mockMoodData;

      // Act
      const result = manager.getLast14DaysMoodData();

      // Assert
      const todayFormatted = today.toISOString().slice(0, 10);
      const todayIndex = result.labels.indexOf(todayFormatted);

      expect(result.data[todayIndex]).toBe(5); // Today's mood should be 5

      // All other days should be 0
      const otherDaysData = result.data.filter((_, index) => index !== todayIndex);
      expect(otherDaysData.every((value) => value === 0)).toBe(true);
    });

    it('should handle empty mood data', () => {
      // Arrange - empty mood data
      useWellbeingStore.getState().moodData = [];

      // Act
      const result = manager.getLast14DaysMoodData();

      // Assert
      expect(result.data).toEqual(Array(14).fill(0));
      expect(result.labels).toHaveLength(14);
    });

    it('should handle null mood data', () => {
      // Arrange - null mood data (edge case)
      useWellbeingStore.getState().moodData = null;

      // Act
      const result = manager.getLast14DaysMoodData();

      // Assert
      expect(result.data).toEqual(Array(14).fill(0));
      expect(result.labels).toHaveLength(14);
    });
  });
});
