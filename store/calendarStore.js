import { create } from 'zustand';
import { isSameDay } from 'date-fns/isSameDay';

export const useCalendarStore = create((set, get) => ({
  // State
  events: [],
  error: null,
  isLoading: false,

  // Simple setters
  setEvents: (events) => set({ events }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  // Combined state setters
  setLoadingState: (isLoading, error = null) => set({ isLoading, error }),

  getEventsForDate: (date) => {
    const { events } = get();
    return events.filter((event) => isSameDay(event.startDate, date));
  },

  // Add a single event to the existing events array
  addEvent: (newEvent) =>
    set((state) => ({
      events: [...state.events, newEvent],
    })),

  // Reset the store to its initial state
  reset: () => set({ events: [], error: null, isLoading: false }),
}));
