import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '../domain/CalendarEvent';

/**
 * Retrieves stored calendar events within a specified date range.
 *
 * @param {Date} startDate - The start date of the range to retrieve events.
 * @param {Date} endDate - The end date of the range to retrieve events.
 * @returns {Promise<CalendarEvent[]>} A promise that resolves to an array of CalendarEvent objects.
 * @throws {Error} If calendar permissions are not granted or an error occurs during retrieval.
 */
export async function getStoredCalendarEvents(startDate, endDate) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') throw new Error('Calendar permission not granted');

    const defaultCalendarId = await getDefaultCalendarId();
    if (!defaultCalendarId) {
      console.warn('No default calendar found, returning empty events');
      return [];
    }

    const events = await Calendar.getEventsAsync([defaultCalendarId], startDate, endDate);
    return events.map(
      (event) =>
        new CalendarEvent({
          id: event.id,
          title: event.title,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
        }),
    );
  } catch (error) {
    console.warn('Error retrieving calendar events:', error);
    return [];
  }
}

/**
 * Adds a calendar event to the default calendar.
 *
 * @param {CalendarEvent} event - The event to add.
 * @returns {Promise<CalendarEvent>} A promise that resolves to the created CalendarEvent.
 * @throws {Error} If calendar permissions are not granted or no default calendar is found.
 */
export async function addCalendarEvent(event) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') throw new Error('Calendar permission not granted');

    const defaultCalendarId = await getDefaultCalendarId();
    if (!defaultCalendarId) throw new Error('No default calendar found');

    const eventId = await Calendar.createEventAsync(defaultCalendarId, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      timeZone: 'UTC',
    });

    return new CalendarEvent({
      id: eventId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
    });
  } catch (error) {
    console.error('Error adding calendar event:', error);
    throw error;
  }
}

async function getDefaultCalendarId() {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar?.id || null;
  } else {
    const calendars = await Calendar.getCalendarsAsync();
    const primaryCalendar = calendars.find((cal) => cal.accessLevel === 'owner' && cal.isPrimary);
    return primaryCalendar ? primaryCalendar.id : calendars[0]?.id || null;
  }
}
