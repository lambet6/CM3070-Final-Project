import { createWellbeingManager } from '../managers/wellbeing-manager';
import { wellbeingRepository } from '../repositories/wellbeing-repository';
import { useWellbeingStore } from '../store/wellbeingStore';

// Create the singleton manager instance
const getStore = () => useWellbeingStore.getState();
export const wellbeingManager = createWellbeingManager(wellbeingRepository, getStore);

/**
 * Hook to access the wellbeing manager in components
 * @returns {Object} Wellbeing manager methods
 */
export const useWellbeingManager = () => {
  return wellbeingManager;
};
