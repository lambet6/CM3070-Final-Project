import { createGoalsManager } from '../managers/goals-manager';
import { goalsRepository } from '../repositories/goals-repository';
import { useGoalsStore } from '../store/goalsStore';

// Create the singleton manager instance
const getStore = () => useGoalsStore.getState();
export const goalsManager = createGoalsManager(goalsRepository, getStore);

/**
 * Hook to access the goals manager in components
 * @returns {Object} Goals manager methods
 */
export const useGoalsManager = () => {
  return goalsManager;
};
