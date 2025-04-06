/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { createWellbeingManager } from '../../../managers/wellbeing-manager';
import { Mood } from '../../../domain/Mood';
import { createSampleMoods } from '../../fixtures/wellbeing-fixtures';
import { createWellbeingRepository } from '../../../repositories/wellbeing-repository';
import { subDays, startOfDay } from 'date-fns';

// Automatically mock the repository
jest.mock('../../../repositories/wellbeing-repository');

describe('wellbeing-manager', () => {
  let mockRepository;
  let mockStore;
  let wellbeingManager;
  let moods;

  beforeEach(() => {
    // Create fresh mocks and manager for each test
    moods = createSampleMoods();
    mockRepository = createWellbeingRepository();

    // Mock the store with required methods and state
    mockStore = {
      setLoading: jest.fn(),
      setError: jest.fn(),
      setMoodData: jest.fn(),
      moodData: [],
    };

    const getStore = () => mockStore;

    wellbeingManager = createWellbeingManager(mockRepository, getStore);

    // Spy on console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('getMoodData returns array of Mood objects and updates store', async () => {
    mockRepository.getMoodData.mockResolvedValue(moods.singleMood);

    const data = await wellbeingManager.getMoodData();

    expect(mockRepository.getMoodData).toHaveBeenCalled();
    expect(data[0]).toBeInstanceOf(Mood);
    expect(data[0].mood).toBe('Happy');
    expect(data[0].moodValue).toBe(4);

    // Test store interactions
    expect(mockStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    expect(mockStore.setMoodData).toHaveBeenCalledWith(moods.singleMood);
    expect(mockStore.setError).toHaveBeenCalledWith(null);
  });

  it('saveMood creates and saves new Mood object and updates store', async () => {
    // Setup mock store with existing data
    const existingMood = new Mood({ mood: 'Sad', date: subDays(new Date(), 1) });
    mockStore.moodData = [existingMood];

    const result = await wellbeingManager.saveMood('Happy');

    expect(result).toBeInstanceOf(Mood);
    expect(result.mood).toBe('Happy');
    expect(result.date).toBeInstanceOf(Date);
    expect(mockRepository.updateMoodForToday).toHaveBeenCalledWith(expect.any(Mood));

    // Test store interactions
    expect(mockStore.setError).toHaveBeenCalledWith(null);
    expect(mockStore.setMoodData).toHaveBeenCalled();

    // Verify the store was updated correctly
    const updatedMoodData = mockStore.setMoodData.mock.calls[0][0];
    expect(updatedMoodData).toHaveLength(2); // Old mood + new mood
    expect(updatedMoodData).toContain(existingMood);
    expect(updatedMoodData[1].mood).toBe('Happy');
  });

  it('throws error for invalid mood value and updates store', async () => {
    const error = new Error('Invalid mood value');

    // Mock the Mood constructor to throw an error for invalid mood
    jest.spyOn(global, 'Mood').mockImplementationOnce(() => {
      throw error;
    });

    await expect(wellbeingManager.saveMood('INVALID_MOOD')).rejects.toThrow(error);
    expect(mockRepository.updateMoodForToday).not.toHaveBeenCalled();

    // Test store interactions
    expect(mockStore.setError).toHaveBeenCalledWith(`Failed to save mood: ${error.message}`);
  });

  it('handles repository errors during getMoodData and updates store', async () => {
    const error = new Error('Storage error');
    mockRepository.getMoodData.mockRejectedValue(error);

    await expect(wellbeingManager.getMoodData()).rejects.toThrow(error);

    // Test store interactions
    expect(mockStore.setLoading).toHaveBeenCalledWith(true);
    expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    expect(mockStore.setError).toHaveBeenCalledWith(`Failed to fetch mood data: ${error.message}`);
    expect(mockStore.setMoodData).toHaveBeenCalledWith([]);
  });

  it('getLast14DaysMoodData returns formatted data for the last 14 days', () => {
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Set up mock data in the store
    const happyMood = new Mood({ mood: 'Happy', date: today });
    const sadMood = new Mood({ mood: 'Sad', date: yesterday });

    mockStore.moodData = [happyMood, sadMood];

    const result = wellbeingManager.getLast14DaysMoodData();

    expect(result).toHaveProperty('labels');
    expect(result).toHaveProperty('data');
    expect(result.labels).toHaveLength(14);
    expect(result.data).toHaveLength(14);

    // Find indices for yesterday and today in the result
    const todayISO = today.toISOString().slice(0, 10);
    const yesterdayISO = yesterday.toISOString().slice(0, 10);

    const todayIndex = result.labels.indexOf(todayISO);
    const yesterdayIndex = result.labels.indexOf(yesterdayISO);

    // Verify mood values appear in the correct position
    expect(result.data[todayIndex]).toBe(happyMood.moodValue);
    expect(result.data[yesterdayIndex]).toBe(sadMood.moodValue);
  });
});
