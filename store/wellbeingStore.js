import { create } from 'zustand';
import { getMoodData, saveMood } from '../managers/wellbeing-manager';
import { subDays, startOfDay, isSameDay } from 'date-fns';

/**
 * Store for managing wellbeing/mood state.
 */
export const useWellbeingStore = create((set, get) => ({
  moodData: [],
  error: null,
  isLoading: false,

  loadMoodData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMoodData();
      set({ moodData: data, error: null, isLoading: false });
    } catch (error) {
      console.error('Failed to load mood data:', error);
      set({ moodData: [], error: error.message, isLoading: false });
    }
  },

  addMood: async (moodValue) => {
    set({ error: null });
    try {
      const newMood = await saveMood(moodValue);
      // Remove any existing mood for today, then add the new one.
      set((state) => {
        const filteredMoodData = state.moodData.filter((entry) => !entry.isToday());
        return { moodData: [...filteredMoodData, newMood] };
      });
    } catch (error) {
      console.error('Failed to add mood:', error);
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Returns mood chart data for the last 14 days.
   * @returns {{labels: string[], data: number[]}}
   */
  getLast14DaysMoodData: () => {
    const moodData = get().moodData;
    const today = startOfDay(new Date());
    const last14Days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

    const fullData = last14Days.map((date) => {
      const entry = moodData.find((entry) => isSameDay(entry.date, date));
      return { date, moodValue: entry ? entry.moodValue : 0 };
    });

    return {
      labels: fullData.map((item) => item.date.toISOString().slice(0, 10)),
      data: fullData.map((item) => item.moodValue),
    };
  },
}));
