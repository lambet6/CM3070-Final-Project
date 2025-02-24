import { create } from 'zustand';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../managers/goals-manager';

/**
 * Store for managing goals state.
 */
export const useGoalsStore = create((set) => ({
  goals: [],
  error: null,
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const fetchedGoals = await fetchGoals();
      set({ goals: fetchedGoals, error: null, isLoading: false });
    } catch (error) {
      console.error('Failed to load goals:', error);
      set({ goals: [], error: error.message, isLoading: false });
    }
  },

  addNewGoal: async (title, hours) => {
    set({ error: null });
    try {
      const updatedGoals = await addGoal(title, hours);
      set({ goals: updatedGoals, error: null });
      return updatedGoals;
    } catch (error) {
      console.error('Failed to add goal:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateGoal: async (goalId, newTitle, newHours) => {
    set({ error: null });
    try {
      const updatedGoals = await updateGoalData(goalId, newTitle, newHours);
      set({ goals: updatedGoals, error: null });
      return updatedGoals;
    } catch (error) {
      console.error('Failed to update goal:', error);
      set({ error: error.message });
      throw error;
    }
  },

  deleteGoal: async (goalId) => {
    set({ error: null });
    try {
      const updatedGoals = await deleteGoal(goalId);
      set({ goals: updatedGoals, error: null });
      return updatedGoals;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      set({ error: error.message });
      throw error;
    }
  },
}));
