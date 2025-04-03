import {
  endOfWeek,
  startOfWeek,
  addYears,
  subYears,
  startOfDay,
  endOfDay,
  isSameDay,
  isBefore,
  isAfter,
} from 'date-fns';
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

  /**
   * Creates a new recurring calendar event.
   * @param {string} title - The event title.
   * @param {Date|string} startDate - The event start date.
   * @param {Date|string} endDate - The event end date.
   * @param {string} recurrenceType - The recurrence type (daily, weekly, monthly).
   * @returns {Promise<CalendarEvent>}
   */
  const createRecurringCalendarEvent = async (title, startDate, endDate, recurrenceType) => {
    const store = getStore();

    try {
      // Convert recurrenceType to a frequency rule recognized by calendar providers
      let frequency;
      switch (recurrenceType) {
        case 'daily':
          frequency = 'daily';
          break;
        case 'weekly':
          frequency = 'weekly';
          break;
        case 'monthly':
          frequency = 'monthly';
          break;
        default:
          throw new Error('Invalid recurrence type');
      }

      // Let the domain model handle validation for the base event
      const event = new CalendarEvent({
        id: 'temp',
        title,
        startDate,
        endDate,
      });

      // Add recurrence information
      const recurrenceRule = {
        frequency,
        interval: 1, // Every 1 day, week, or month
        endDate: null, // No end date (can be updated to support ending after X occurrences)
      };

      // Use repository to create the recurring event
      const newEvent = await repository.addRecurringCalendarEvent(event, recurrenceRule);

      // Update store with the new event
      store.addEvent(newEvent);
      store.setError(null);

      return newEvent;
    } catch (error) {
      console.error('Error creating recurring calendar event:', error);
      store.setError(`Failed to create recurring calendar event: ${error.message}`);
      throw error;
    }
  };

  /**
   * Creates a calendar event for a goal, which could be recurring or one-time.
   * @param {string} title - The event title (usually the goal title).
   * @param {Date} startDate - The event start date and time.
   * @param {Date} endDate - The event end date and time.
   * @param {boolean} isRecurring - Whether this is a recurring event.
   * @param {string} recurrenceType - The type of recurrence (daily, weekly, monthly).
   * @returns {Promise<CalendarEvent>} The created calendar event.
   */
  const createGoalCalendarEvent = async (
    title,
    startDate,
    endDate,
    isRecurring = false,
    recurrenceType = null,
  ) => {
    try {
      if (isRecurring && recurrenceType) {
        return await createRecurringCalendarEvent(title, startDate, endDate, recurrenceType);
      } else {
        return await createCalendarEvent(title, startDate, endDate);
      }
    } catch (error) {
      console.error('Error creating goal calendar event:', error);
      throw error;
    }
  };

  /**
   * Fetches calendar events specifically for a given date
   * @param {Date} date - The date to get events for
   * @returns {Promise<Array<CalendarEvent>>} Array of calendar events for the specified date
   */
  const getEventsForDate = async (date) => {
    try {
      const targetDate = startOfDay(new Date(date));
      const endDate = endOfDay(new Date(date));

      // Get events directly for this date from the repository
      const events = await repository.getStoredCalendarEvents(targetDate, endDate);

      // Filter events that occur on this date (starting, ending, or spanning)
      const eventsForDate = events.filter((event) => {
        // Event starts on the target day
        const startsOnDay = isSameDay(event.startDate, targetDate);

        // Event ends on the target day
        const endsOnDay = isSameDay(event.endDate, targetDate);

        // Event spans across the target day (starts before, ends after)
        const spansAcrossDay =
          isBefore(event.startDate, targetDate) && isAfter(event.endDate, endDate);

        return startsOnDay || endsOnDay || spansAcrossDay;
      });
      console.log('Events for date:', eventsForDate);
      return eventsForDate;
    } catch (error) {
      console.error('Error getting events for date:', error);
      return [];
    }
  };

  return {
    loadWeeklyCalendarEvents,
    loadYearlyCalendarEvents,
    createCalendarEvent,
    createRecurringCalendarEvent,
    createGoalCalendarEvent,
    getEventsForDate,
  };
};
