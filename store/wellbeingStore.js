import { create } from 'zustand';

/**
 * Direct Zustand store for wellbeing management
 */
export const useWellbeingStore = create((set) => ({
  // State
  moodData: [],
  error: null,
  isLoading: false,

  // Simple setters
  setMoodData: (moodData) => set({ moodData }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
