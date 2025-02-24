import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '../domain/CalendarEvent';

/**
 * Retrieves stored calendar events within a specified date range.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<CalendarEvent[]>}
 * @throws {Error} with context if retrieval fails.
 */
export async function getStoredCalendarEvents(startDate, endDate) {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new Error('Invalid start date');
  }
  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new Error('Invalid end date');
  }
  if (endDate < startDate) {
    throw new Error('End date cannot be before start date');
  }

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission not granted');
  }

  try {
    const defaultCalendarId = await getDefaultCalendarId();
    if (!defaultCalendarId) {
      throw new Error('No default calendar found');
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
    console.error('Error retrieving calendar events:', error);
    throw new Error(`Failed to retrieve calendar events: ${error.message}`);
  }
}

/**
 * Adds a calendar event to the default calendar.
 * @param {CalendarEvent} event
 * @returns {Promise<CalendarEvent>}
 * @throws {Error} with context if creation fails.
 */
export async function addCalendarEvent(event) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') throw new Error('Calendar permission not granted');

    const defaultCalendarId = await getDefaultCalendarId();
    if (!defaultCalendarId) throw new Error('No default calendar found');

    // Create new event using the domain model for validation.
    const newEvent = new CalendarEvent({
      id: 'temp', // Temporary ID
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
    });

    const eventId = await Calendar.createEventAsync(defaultCalendarId, {
      title: newEvent.title,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      timeZone: 'UTC',
    });

    return new CalendarEvent({
      id: eventId,
      title: newEvent.title,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
    });
  } catch (error) {
    console.error('Error adding calendar event:', error);
    throw new Error(`Failed to add calendar event: ${error.message}`);
  }
}

async function getDefaultCalendarId() {
  try {
    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      if (!defaultCalendar?.id) {
        throw new Error('No default calendar found on iOS');
      }
      return defaultCalendar.id;
    } else {
      const calendars = await Calendar.getCalendarsAsync();
      const primaryCalendar = calendars.find((cal) => cal.accessLevel === 'owner' && cal.isPrimary);
      const selectedCalendar = primaryCalendar || calendars[0];
      if (!selectedCalendar?.id) {
        throw new Error('No suitable calendar found on Android');
      }
      return selectedCalendar.id;
    }
  } catch (error) {
    console.error('Error getting default calendar:', error);
    throw new Error(`Failed to get default calendar: ${error.message}`);
  }
}
