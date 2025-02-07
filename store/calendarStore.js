import { create } from 'zustand';
import { getWeeklyCalendarData } from '../managers/calendar-manager';

export const useCalendarStore = create((set) => ({
  events: [],
  loadCalendarData: async () => {
    const { events } = await getWeeklyCalendarData();
    set({ events });
  }
}));

