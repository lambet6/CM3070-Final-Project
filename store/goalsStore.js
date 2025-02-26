import { create } from 'zustand';
import { createGoalsManager } from '../managers/goals-manager';
import { goalsRepository } from '../repositories/goals-repository';

/**
 * Creates a goals store with the provided goals manager
 * @param {Object} customGoalsManager - Optional custom goals manager to use
 * @returns {Function} Zustand store hook
 */
export const createGoalsStore = (customGoalsManager = null) => {
  // Use provided goals manager or create default one
  const goalsManager = customGoalsManager || createGoalsManager(goalsRepository);

  return create((set) => ({
    goals: [],
    error: null,
    isLoading: false,

    loadGoals: async () => {
      set({ isLoading: true, error: null });
      try {
        const fetchedGoals = await goalsManager.fetchGoals();
        set({ goals: fetchedGoals, error: null, isLoading: false });
      } catch (error) {
        console.error('Failed to load goals:', error);
        set({ goals: [], error: error.message, isLoading: false });
      }
    },

    addNewGoal: async (title, hours) => {
      set({ error: null });
      try {
        const updatedGoals = await goalsManager.addGoal(title, hours);
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
        const updatedGoals = await goalsManager.updateGoalData(goalId, newTitle, newHours);
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
        const updatedGoals = await goalsManager.deleteGoal(goalId);
        set({ goals: updatedGoals, error: null });
        return updatedGoals;
      } catch (error) {
        console.error('Failed to delete goal:', error);
        set({ error: error.message });
        throw error;
      }
    },
  }));
};

/**
 * Default goals store instance for use in components
 */
export const useGoalsStore = createGoalsStore();
