/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { act } from 'react-test-renderer';
import { isSameDay } from 'date-fns';
import { useWellbeingStore } from '../../../store/wellbeingStore';
import { getMoodData, saveMood } from '../../../managers/wellbeing-manager';
import { Mood } from '../../../domain/Mood';

// Mock the manager functions used by the store
jest.mock('../../../managers/wellbeing-manager', () => ({
  getMoodData: jest.fn(),
  saveMood: jest.fn(),
}));

describe('wellbeingStore', () => {
  beforeEach(() => {
    useWellbeingStore.setState({ moodData: [] });
    jest.resetAllMocks();
  });

  it('loads mood data and updates state', async () => {
    const dummyData = [new Mood({ mood: 'Happy', date: '2024-01-01T00:00:00.000Z' })];
    getMoodData.mockResolvedValue(dummyData);
    await act(async () => {
      await useWellbeingStore.getState().loadMoodData();
    });
    expect(useWellbeingStore.getState().moodData).toEqual(dummyData);
  });

  it('adds a mood and replaces any existing entry for today', async () => {
    const today = new Date();
    const existing = new Mood({ mood: 'Low', date: today });
    act(() => {
      useWellbeingStore.setState({ moodData: [existing] });
    });

    const newMood = new Mood({ mood: 'Happy', date: today });
    saveMood.mockResolvedValue(newMood);

    await act(async () => {
      await useWellbeingStore.getState().addMood('Happy');
    });

    const state = useWellbeingStore.getState();
    const todayEntries = state.moodData.filter((entry) => isSameDay(entry.date, today));
    expect(todayEntries).toHaveLength(1);
    expect(todayEntries[0]).toEqual(newMood);
  });

  it('returns correct structure for the last 14 days mood data', () => {
    const { labels, data } = useWellbeingStore.getState().getLast14DaysMoodData([]);
    expect(labels).toHaveLength(14);
    expect(data).toHaveLength(14);
    expect(data.every((value) => value === 0)).toBeTruthy();
  });
});
