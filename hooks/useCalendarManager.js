import { useCalendarStore } from '../store/calendarStore';
import { calendarRepository } from '../repositories/calendar-repository';
import { createCalendarManager } from '../managers/calendar-manager';

// Create the singleton manager instance
const getStore = () => useCalendarStore.getState();
export const calendarManager = createCalendarManager(calendarRepository, getStore);

/**
 * Hook to access the calendar manager in components
 * @returns {Object} Calendar manager methods
 */
export const useCalendarManager = () => {
  return calendarManager;
};
