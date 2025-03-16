import { create } from 'zustand';
import { createCalendarManager } from '../managers/calendar-manager';
import { calendarRepository } from '../repositories/calendar-repository';

/**
 * Creates a calendar store with the provided calendar manager
 * @param {Object} customCalendarManager - Optional custom calendar manager to use
 * @returns {Function} Zustand store hook
 */
export const createCalendarStore = (customCalendarManager = null) => {
  // Use provided calendar manager or create default one
  const calendarManager = customCalendarManager || createCalendarManager(calendarRepository);

  return create((set) => ({
    events: [],
    error: null,
    isLoading: false,

    loadCalendarEvents: async () => {
      set({ isLoading: true, error: null });
      try {
        const fetchedEvents = await calendarManager.getYearlyCalendarEvents();
        set({ events: fetchedEvents, error: null, isLoading: false });
      } catch (error) {
        console.error('Calendar store error:', error);
        set({
          error: error.message || 'Failed to load calendar events',
          events: [],
          isLoading: false,
        });
      }
    },

    createEvent: async (title, startDate, endDate) => {
      set({ error: null });
      try {
        const newEvent = await calendarManager.createNewCalendarEvent(title, startDate, endDate);
        set((state) => ({
          events: [...state.events, newEvent],
          error: null,
        }));
        return newEvent;
      } catch (error) {
        set({ error: error.message });
        throw error;
      }
    },
  }));
};

/**
 * Default calendar store instance for use in components
 * This maintains backward compatibility with existing code
 */
export const useCalendarStore = createCalendarStore();
