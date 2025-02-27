import { describe, it, beforeEach, expect } from '@jest/globals';
import { act } from 'react-test-renderer';
import { isSameDay } from 'date-fns';
import { createWellbeingStore } from '../../../store/wellbeingStore';
import { createMockWellbeingManager } from '../../mocks/wellbeing-manager.mock';
import { createSampleMoods } from '../../fixtures/wellbeing-fixtures';
import { Mood } from '../../../domain/Mood';

describe('wellbeingStore', () => {
  let mockManager;
  let wellbeingStore;
  let moods;

  beforeEach(() => {
    moods = createSampleMoods();

    // Create mock manager and store for each test
    mockManager = createMockWellbeingManager();
    wellbeingStore = createWellbeingStore(mockManager);
  });

  it('loads mood data and updates state', async () => {
    mockManager.getMoodData.mockResolvedValue(moods.singleMood);

    await act(async () => {
      await wellbeingStore.getState().loadMoodData();
    });

    expect(mockManager.getMoodData).toHaveBeenCalled();
    expect(wellbeingStore.getState().moodData).toEqual(moods.singleMood);
    expect(wellbeingStore.getState().isLoading).toBe(false);
    expect(wellbeingStore.getState().error).toBe(null);
  });

  it('adds a mood and replaces any existing entry for today', async () => {
    const today = new Date();
    const existing = new Mood({ mood: 'Low', date: today });
    wellbeingStore.setState({ moodData: [existing] });

    const newMood = new Mood({ mood: 'Happy', date: today });
    mockManager.saveMood.mockResolvedValue(newMood);

    await act(async () => {
      await wellbeingStore.getState().addMood('Happy');
    });

    expect(mockManager.saveMood).toHaveBeenCalledWith('Happy');

    const state = wellbeingStore.getState();
    const todayEntries = state.moodData.filter((entry) => isSameDay(entry.date, today));
    expect(todayEntries).toHaveLength(1);
    expect(todayEntries[0]).toEqual(newMood);
  });

  it('returns correct structure for the last 14 days mood data', () => {
    wellbeingStore.setState({ moodData: moods.multipleDay });
    const { labels, data } = wellbeingStore.getState().getLast14DaysMoodData();

    expect(labels).toHaveLength(14);
    expect(data).toHaveLength(14);
    // Check that we have some non-zero values where we have mood data
    expect(data.some((value) => value > 0)).toBe(true);
  });

  it('handles errors when loading data', async () => {
    mockManager.getMoodData.mockRejectedValue(new Error('Failed to load'));

    await act(async () => {
      await wellbeingStore.getState().loadMoodData();
    });

    expect(wellbeingStore.getState().error).toBe('Failed to load');
    expect(wellbeingStore.getState().isLoading).toBe(false);
    expect(wellbeingStore.getState().moodData).toEqual([]);
  });
});
