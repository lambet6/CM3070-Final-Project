/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { getMoodData, saveMood } from '../../../managers/wellbeing-manager';
import {
  getMoodDataFromRepo,
  updateMoodForToday,
} from '../../../repositories/wellbeing-repository';
import { Mood } from '../../../domain/Mood';

jest.mock('../../../repositories/wellbeing-repository', () => ({
  getMoodDataFromRepo: jest.fn(),
  updateMoodForToday: jest.fn(),
}));

describe('wellbeing-manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMoodData returns array of Mood objects', async () => {
    const mockMood = new Mood({ mood: 'Happy', date: '2024-01-01T00:00:00.000Z' });
    getMoodDataFromRepo.mockResolvedValue([mockMood]);

    const data = await getMoodData();
    expect(data[0]).toBeInstanceOf(Mood);
    expect(data[0].mood).toBe('Happy');
    expect(data[0].moodValue).toBe(4);
  });

  it('saveMood creates and saves new Mood object', async () => {
    updateMoodForToday.mockResolvedValue();
    const result = await saveMood('Happy');

    expect(result).toBeInstanceOf(Mood);
    expect(result.mood).toBe('Happy');
    expect(result.date).toBeInstanceOf(Date);
    expect(updateMoodForToday).toHaveBeenCalled();
  });

  it('should throw error for invalid mood value', async () => {
    await expect(saveMood('INVALID_MOOD')).rejects.toThrow(
      'Failed to save mood: Invalid mood value',
    );
  });

  it('should handle repository errors', async () => {
    getMoodDataFromRepo.mockRejectedValue(new Error('Storage error'));
    await expect(getMoodData()).rejects.toThrow('Failed to fetch mood data: Storage error');
  });
});
