import { endOfWeek, startOfWeek } from 'date-fns';
import { getStoredCalendarEvents, addCalendarEvent } from '../repositories/calendar-repository';
import { CalendarEvent } from '../domain/CalendarEvent';

/**
 * Fetches calendar events for the current week.
 * @returns {Promise<CalendarEvent[]>} A promise that resolves to an array of calendar events.
 */
export async function getWeeklyCalendarEvents() {
  try {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    return await getStoredCalendarEvents(startDate, endDate);
  } catch (err) {
    console.warn('Error getting weekly calendar data:', err);
    return [];
  }
}

/**
 * Creates a new calendar event.
 * @param {string} title - The title of the event.
 * @param {Date|string} startDate - The start date of the event.
 * @param {Date|string} endDate - The end date of the event.
 * @returns {Promise<CalendarEvent>} A promise that resolves to the newly created CalendarEvent object.
 */
export async function createNewCalendarEvent(title, startDate, endDate) {
  return await addCalendarEvent(
    new CalendarEvent({
      id: 'temp',
      title,
      startDate,
      endDate,
    }),
  );
}
