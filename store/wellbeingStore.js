import { create } from 'zustand';
import { getMoodData, saveMood } from '../managers/wellbeing-manager';
import { subDays, startOfDay, isSameDay } from 'date-fns';

/**
 * @typedef {import('../domain/Mood').Mood} Mood
 */

/**
 * @typedef {Object} MoodChartData
 * @property {string[]} labels - Array of date labels
 * @property {number[]} data - Array of mood values corresponding to labels
 */

/**
 * Store for managing wellbeing/mood state.
 * @typedef {Object} WellbeingStore
 * @property {Mood[]} moodData - Array of mood entries
 * @property {() => Promise<void>} loadMoodData - Loads all mood entries
 * @property {(mood: string) => Promise<void>} addMood - Adds or updates mood for current day
 * @property {() => MoodChartData} getLast14DaysMoodData - Gets mood data for the last 14 days
 */

/**
 * Creates a store for managing wellbeing/mood data.
 * @type {import('zustand').UseBoundStore<WellbeingStore>}
 */
export const useWellbeingStore = create((set) => ({
  moodData: [],
  loadMoodData: async () => {
    const data = await getMoodData();
    set({ moodData: data });
  },
  addMood: async (mood) => {
    const newMoodData = await saveMood(mood);
    set((state) => {
      const filteredMoodData = state.moodData.filter((entry) => !entry.isToday());
      return { moodData: [...filteredMoodData, newMoodData] };
    });
  },
  getLast14DaysMoodData: () => {
    const moodData = useWellbeingStore.getState().moodData;
    const today = startOfDay(new Date());
    const last14Days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

    const fullData = last14Days.map((date) => {
      const entry = moodData.find((entry) => isSameDay(entry.date, date));
      return { date, moodValue: entry ? entry.moodValue : 0 };
    });

    return {
      labels: fullData.map((item) => item.date),
      data: fullData.map((item) => item.moodValue),
    };
  },
}));
