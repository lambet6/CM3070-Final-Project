/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSameDay } from 'date-fns';
import {
  createWellbeingRepository,
  MOOD_DATA_KEY,
} from '../../../repositories/wellbeing-repository';
import { Mood } from '../../../domain/Mood';
import { createSampleMoods } from '../../fixtures/wellbeing-fixtures';

describe('wellbeing-repository', () => {
  let wellbeingRepository;
  let moods;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();

    // Create fresh repository and fixtures for each test
    wellbeingRepository = createWellbeingRepository();
    moods = createSampleMoods();

    // Spy on console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('getMoodData returns empty array if no data exists', async () => {
    const data = await wellbeingRepository.getMoodData();
    expect(data).toEqual([]);
  });

  it('getMoodData returns array of Mood objects', async () => {
    const testDate = new Date('2024-01-01T00:00:00.000Z');
    const sampleData = [{ mood: 'Happy', date: testDate.toISOString() }];
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(sampleData));

    const data = await wellbeingRepository.getMoodData();
    expect(data[0]).toBeInstanceOf(Mood);
    expect(data[0].mood).toBe('Happy');
    expect(data[0].moodValue).toBe(4);
    expect(isSameDay(data[0].date, testDate)).toBe(true);
  });

  it('updateMoodForToday replaces existing mood for today', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Use fixture helpers to create test data
    const testData = moods.createCustomMoods([
      { mood: 'Low', date: today },
      { mood: 'Neutral', daysAgo: 1 },
    ]);

    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(testData));

    const newMood = new Mood({ mood: 'Happy', date: today });
    await wellbeingRepository.updateMoodForToday(newMood);

    const storedData = await wellbeingRepository.getMoodData();
    expect(storedData).toHaveLength(2);

    const todayEntry = storedData.find((m) => m.isToday());
    const yesterdayEntry = storedData.find((m) => !m.isToday());

    expect(todayEntry.mood).toBe('Happy');
    expect(yesterdayEntry.mood).toBe('Neutral');
  });

  it('handles storage errors when getting data', async () => {
    // Create repository with custom storage that throws errors
    const mockStorage = {
      getItem: jest.fn().mockRejectedValue(new Error('Storage error')),
    };

    const errorRepository = createWellbeingRepository(mockStorage);
    await expect(errorRepository.getMoodData()).rejects.toThrow('Failed to fetch mood data');
  });

  it('handles storage errors when saving data', async () => {
    // Create repository with custom storage that throws errors
    const mockStorage = {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockRejectedValue(new Error('Storage error')),
    };

    const errorRepository = createWellbeingRepository(mockStorage);
    const mood = new Mood({ mood: 'Happy', date: new Date() });

    await expect(errorRepository.saveMood(mood)).rejects.toThrow('Failed to save mood');
  });
});
