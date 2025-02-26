import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '../domain/CalendarEvent';

/**
 * Creates a calendar repository with the specified calendar API
 * @param {Object} calendarApi - Calendar API implementation (defaults to expo-calendar)
 * @returns {Object} Repository object with methods for calendar operations
 */
export const createCalendarRepository = (calendarApi = Calendar) => {
  /**
   * Retrieves stored calendar events within a specified date range.
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<CalendarEvent[]>}
   * @throws {Error} with context if retrieval fails.
   */
  const getStoredCalendarEvents = async (startDate, endDate) => {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('Invalid end date');
    }
    if (endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }

    const { status } = await calendarApi.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    try {
      const defaultCalendarId = await getDefaultCalendarId();
      if (!defaultCalendarId) {
        throw new Error('No default calendar found');
      }
      const events = await calendarApi.getEventsAsync([defaultCalendarId], startDate, endDate);
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
  };

  /**
   * Adds a calendar event to the default calendar.
   * @param {CalendarEvent} event
   * @returns {Promise<CalendarEvent>}
   * @throws {Error} with context if creation fails.
   */
  const addCalendarEvent = async (event) => {
    try {
      const { status } = await calendarApi.requestCalendarPermissionsAsync();
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

      const eventId = await calendarApi.createEventAsync(defaultCalendarId, {
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
  };

  /**
   * Gets the default calendar ID based on the platform
   * @returns {Promise<string>} Calendar ID
   * @throws {Error} if no suitable calendar is found
   */
  const getDefaultCalendarId = async () => {
    try {
      if (Platform.OS === 'ios') {
        const defaultCalendar = await calendarApi.getDefaultCalendarAsync();
        if (!defaultCalendar?.id) {
          throw new Error('No default calendar found on iOS');
        }
        return defaultCalendar.id;
      } else {
        const calendars = await calendarApi.getCalendarsAsync();
        const primaryCalendar = calendars.find(
          (cal) => cal.accessLevel === 'owner' && cal.isPrimary,
        );
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
  };

  return {
    getStoredCalendarEvents,
    addCalendarEvent,
  };
};

export const calendarRepository = createCalendarRepository();
