import { create } from 'zustand';
import { getWeeklyCalendarEvents } from '../managers/calendar-manager';

/**
 * @typedef {import('../domain/CalendarEvent').CalendarEvent} CalendarEvent
 */

/**
 * Store for managing calendar events state.
 * @typedef {Object} CalendarStore
 * @property {CalendarEvent[]} events - Array of calendar events
 * @property {() => Promise<void>} loadCalendarEvents - Loads calendar events for the current week
 */

/**
 * Creates a store for managing calendar events.
 * @type {import('zustand').UseBoundStore<CalendarStore>}
 */
export const useCalendarStore = create((set) => ({
    events: [],
    loadCalendarEvents: async () => {
        const events = await getWeeklyCalendarEvents();
        set({ events });
    }
}));

