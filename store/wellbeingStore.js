import { create } from 'zustand';
import { getMoodData, saveMood } from '../managers/wellbeing-manager';

export const useWellbeingStore = create((set) => ({
  moodData: [],
  loadMoodData: async () => {
    const data = await getMoodData();
    set({ moodData: data });
  },
  addMood: async (mood) => {
    const newMoodData = await saveMood(mood);
    set((state) => ({ moodData: [...state.moodData, newMoodData] }));
  },
}));
