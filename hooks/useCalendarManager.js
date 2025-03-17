import { useRef } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { calendarRepository } from '../repositories/calendar-repository';
import { createCalendarManager } from '../managers/calendar-manager';

// Singleton instance - maintained across component instances
let calendarManagerInstance = null;

/**
 * Custom hook that provides access to the calendar manager singleton
 * Creates a singleton instance that persists across renders and components
 *
 * @returns {Object} Calendar manager functions
 */
export const useCalendarManager = () => {
  // Use a ref to ensure stable reference within a component
  const managerRef = useRef(null);

  // Create singleton instance if it doesn't exist yet
  if (!calendarManagerInstance) {
    // Function to get the store's current state and actions
    const getStore = () => useCalendarStore.getState();

    // Create and store the singleton instance
    calendarManagerInstance = createCalendarManager(calendarRepository, getStore);
  }

  // Store the singleton in ref for this component instance
  if (!managerRef.current) {
    managerRef.current = calendarManagerInstance;
  }

  return managerRef.current;
};
