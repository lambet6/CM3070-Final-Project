/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { createWellbeingManager } from '../../../managers/wellbeing-manager';
import { Mood } from '../../../domain/Mood';
import { createSampleMoods } from '../../fixtures/wellbeing-fixtures';
import { createWellbeingRepository } from '../../../repositories/wellbeing-repository';

// Automatically mock the repository
jest.mock('../../../repositories/wellbeing-repository');

describe('wellbeing-manager', () => {
  let mockRepository;
  let wellbeingManager;
  let moods;

  beforeEach(() => {
    // Create fresh mocks and manager for each test
    moods = createSampleMoods();
    mockRepository = createWellbeingRepository();
    wellbeingManager = createWellbeingManager(mockRepository);
  });

  it('getMoodData returns array of Mood objects', async () => {
    mockRepository.getMoodData.mockResolvedValue(moods.singleMood);

    const data = await wellbeingManager.getMoodData();

    expect(mockRepository.getMoodData).toHaveBeenCalled();
    expect(data[0]).toBeInstanceOf(Mood);
    expect(data[0].mood).toBe('Happy');
    expect(data[0].moodValue).toBe(4);
  });

  it('saveMood creates and saves new Mood object', async () => {
    const result = await wellbeingManager.saveMood('Happy');

    expect(result).toBeInstanceOf(Mood);
    expect(result.mood).toBe('Happy');
    expect(result.date).toBeInstanceOf(Date);
    expect(mockRepository.updateMoodForToday).toHaveBeenCalledWith(expect.any(Mood));
  });

  it('throws error for invalid mood value', async () => {
    await expect(wellbeingManager.saveMood('INVALID_MOOD')).rejects.toThrow(
      'Failed to save mood: Invalid mood value',
    );
    expect(mockRepository.updateMoodForToday).not.toHaveBeenCalled();
  });

  it('handles repository errors', async () => {
    mockRepository.getMoodData.mockRejectedValue(new Error('Storage error'));
    await expect(wellbeingManager.getMoodData()).rejects.toThrow('Failed to fetch mood data');
  });
});
