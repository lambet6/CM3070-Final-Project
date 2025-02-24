import { endOfWeek, startOfWeek } from 'date-fns';
import { getStoredCalendarEvents, addCalendarEvent } from '../repositories/calendar-repository';
import { CalendarEvent } from '../domain/CalendarEvent';

/**
 * Fetches calendar events for the current week.
 * @returns {Promise<CalendarEvent[]>}
 */
export async function getWeeklyCalendarEvents() {
  try {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    return await getStoredCalendarEvents(startDate, endDate);
  } catch (error) {
    console.error('Error getting weekly calendar data:', error);
    throw new Error(`Failed to get weekly calendar events: ${error.message}`);
  }
}

/**
 * Creates a new calendar event.
 * @param {string} title - The event title.
 * @param {Date|string} startDate - The event start date.
 * @param {Date|string} endDate - The event end date.
 * @returns {Promise<CalendarEvent>}
 */
export async function createNewCalendarEvent(title, startDate, endDate) {
  try {
    // Let the domain model handle validation
    const event = new CalendarEvent({
      id: 'temp',
      title,
      startDate,
      endDate,
    });
    return await addCalendarEvent(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}
