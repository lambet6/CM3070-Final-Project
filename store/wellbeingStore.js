import { create } from 'zustand';
import { createWellbeingManager } from '../managers/wellbeing-manager';
import { wellbeingRepository } from '../repositories/wellbeing-repository';
import { subDays, startOfDay, isSameDay } from 'date-fns';

/**
 * Creates a wellbeing store with the provided wellbeing manager
 * @param {Object} customWellbeingManager - Optional custom wellbeing manager to use
 * @returns {Function} Zustand store hook
 */
export const createWellbeingStore = (customWellbeingManager = null) => {
  // Use provided wellbeing manager or create default one
  const wellbeingManager = customWellbeingManager || createWellbeingManager(wellbeingRepository);

  return create((set, get) => ({
    moodData: [],
    error: null,
    isLoading: false,

    loadMoodData: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await wellbeingManager.getMoodData();
        set({ moodData: data, error: null, isLoading: false });
      } catch (error) {
        console.error('Failed to load mood data:', error);
        set({ moodData: [], error: error.message, isLoading: false });
      }
    },

    addMood: async (moodValue) => {
      set({ error: null });
      try {
        const newMood = await wellbeingManager.saveMood(moodValue);
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
};

/**
 * Default wellbeing store instance for use in components
 */
export const useWellbeingStore = createWellbeingStore();
