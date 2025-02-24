import { create } from 'zustand';
import { getWeeklyCalendarEvents, createNewCalendarEvent } from '../managers/calendar-manager';

/**
 * Store for managing calendar events state.
 */
export const useCalendarStore = create((set) => ({
  events: [],
  error: null,
  isLoading: false,

  loadCalendarEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const fetchedEvents = await getWeeklyCalendarEvents();
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
      const newEvent = await createNewCalendarEvent(title, startDate, endDate);
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
