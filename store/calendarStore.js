import { create } from 'zustand';
import { getWeeklyCalendarEvents } from '../managers/calendar-manager';

export const useCalendarStore = create((set) => ({
  events: [],
  loadCalendarEvents: async () => {
    const events = await getWeeklyCalendarEvents();
    set({ events });
  }
}));

