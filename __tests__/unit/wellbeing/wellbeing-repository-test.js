/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMoodDataFromRepo,
  updateMoodForToday,
  MOOD_DATA_KEY,
} from '../../../repositories/wellbeing-repository';
import { Mood } from '../../../domain/Mood';

describe('wellbeing-repository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('getMoodDataFromRepo returns empty array if no data exists', async () => {
    const data = await getMoodDataFromRepo();
    expect(data).toEqual([]);
  });

  it('getMoodDataFromRepo returns array of Mood objects', async () => {
    const sampleData = [{ mood: 'Happy', date: '2024-01-01T00:00:00.000Z' }];
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(sampleData));

    const data = await getMoodDataFromRepo();
    expect(data[0]).toBeInstanceOf(Mood);
    expect(data[0].mood).toBe('Happy');
    expect(data[0].moodValue).toBe(4);
  });

  it('updateMoodForToday replaces existing mood for today', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const oldMood = new Mood({ mood: 'Low', date: today });
    const yesterdayMood = new Mood({ mood: 'Neutral', date: yesterday });
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify([oldMood, yesterdayMood]));

    const newMood = new Mood({ mood: 'Happy', date: today });
    await updateMoodForToday(newMood);

    const storedData = await getMoodDataFromRepo();
    expect(storedData).toHaveLength(2);
    expect(storedData.find((m) => m.isToday()).mood).toBe('Happy');
    expect(storedData.find((m) => !m.isToday()).mood).toBe('Neutral');
  });

  it('throws error for invalid mood value', async () => {
    await expect(async () => {
      await updateMoodForToday(new Mood({ mood: 'Invalid', date: new Date() }));
    }).rejects.toThrow('Invalid mood value');
  });
});
