import { create } from 'zustand';

/**
 * Direct Zustand store for goals management
 */
export const useGoalsStore = create((set) => ({
  // State
  goals: [],
  error: null,
  isLoading: false,

  // Simple setters
  setGoals: (goals) => set({ goals }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
