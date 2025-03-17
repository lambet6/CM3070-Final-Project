import { create } from 'zustand';

/**
 * Creates a calendar store that only manages state with simple setters/getters
 * @returns {Function} Zustand store hook
 */
export const createCalendarStore = () => {
  return create((set) => ({
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

    // Add a single event to the existing events array
    addEvent: (newEvent) =>
      set((state) => ({
        events: [...state.events, newEvent],
      })),

    // Reset the store to its initial state
    reset: () => set({ events: [], error: null, isLoading: false }),
  }));
};

/**
 * Default calendar store instance for use in components
 */
export const useCalendarStore = createCalendarStore();
