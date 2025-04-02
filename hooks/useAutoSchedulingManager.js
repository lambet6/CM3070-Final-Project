import { createAutoSchedulingManager } from '../managers/auto-scheduling-manager';
import { taskManager } from './useTaskManager';
import { calendarManager } from './useCalendarManager';
import { autoSchedulingRepository } from '../repositories/auto-scheduling-repository';

// Create a singleton manager instance with all dependencies
export const autoSchedulingManager = createAutoSchedulingManager({
  taskManager,
  calendarManager,
  repository: autoSchedulingRepository,
});

/**
 * Hook to access the auto-scheduling manager in components
 * @returns {Object} Auto-scheduling manager methods
 */
export const useAutoSchedulingManager = () => {
  return autoSchedulingManager;
};
