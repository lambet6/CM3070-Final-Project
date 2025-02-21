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
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const updatedMoodData = state.moodData.filter(entry => entry.date.split('T')[0] !== today);
      updatedMoodData.push(newMoodData);
      return { moodData: updatedMoodData };
    });
  },
  getLast14DaysMoodData: () => {
    const moodData = useWellbeingStore.getState().moodData;
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date.toISOString().split('T')[0];
    });
    const fullData = last14Days.map(date => {
      const entry = moodData.find(entry => entry.date.split('T')[0] === date);
      return { date, moodValue: entry ? entry.moodValue : 0 };
    });
    
    return { labels: last14Days, data: fullData.map(item => item.moodValue) };
  }
}));
