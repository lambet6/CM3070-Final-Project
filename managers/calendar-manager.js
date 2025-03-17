import { endOfWeek, startOfWeek, addYears, subYears } from 'date-fns';
import { CalendarEvent } from '../domain/CalendarEvent';

/**
 * Creates a calendar manager that uses the provided repository and store
 * @param {Object} repository - Repository with calendar operations
 * @param {Function} getStore - Function to get the current store state and actions
 * @returns {Object} Calendar manager functions
 */
export const createCalendarManager = (repository, getStore) => {
  /**
   * Fetches calendar events for the current week.
   * @returns {Promise<void>}
   */
  const loadWeeklyCalendarEvents = async () => {
    const store = getStore();
    store.setLoading(true);

    try {
      const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
      const events = await repository.getStoredCalendarEvents(startDate, endDate);

      store.setEvents(events);
      store.setError(null);
    } catch (error) {
      console.error('Error getting weekly calendar data:', error);
      store.setError(`Failed to get weekly calendar events: ${error.message}`);
      store.setEvents([]);
    } finally {
      store.setLoading(false);
    }
  };

  /**
   * Fetches calendar events for the previous and next year from current date.
   * @returns {Promise<void>}
   */
  const loadYearlyCalendarEvents = async () => {
    const store = getStore();
    store.setLoading(true);

    try {
      const currentDate = new Date();
      const startDate = subYears(currentDate, 1);
      const endDate = addYears(currentDate, 1);
      const events = await repository.getStoredCalendarEvents(startDate, endDate);

      store.setEvents(events);
      store.setError(null);
    } catch (error) {
      console.error('Error getting yearly calendar data:', error);
      store.setError(`Failed to get yearly calendar events: ${error.message}`);
      store.setEvents([]);
    } finally {
      store.setLoading(false);
    }
  };

  /**
   * Creates a new calendar event.
   * @param {string} title - The event title.
   * @param {Date|string} startDate - The event start date.
   * @param {Date|string} endDate - The event end date.
   * @returns {Promise<CalendarEvent>}
   */
  const createCalendarEvent = async (title, startDate, endDate) => {
    const store = getStore();

    try {
      // Let the domain model handle validation
      const event = new CalendarEvent({
        id: 'temp',
        title,
        startDate,
        endDate,
      });

      const newEvent = await repository.addCalendarEvent(event);

      // Update store with the new event
      store.addEvent(newEvent);
      store.setError(null);

      return newEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      store.setError(`Failed to create calendar event: ${error.message}`);
      throw error;
    }
  };

  return {
    loadWeeklyCalendarEvents,
    loadYearlyCalendarEvents,
    createCalendarEvent,
  };
};
