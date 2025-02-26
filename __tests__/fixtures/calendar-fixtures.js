import { CalendarEvent } from '../../domain/CalendarEvent';
import { addDays } from 'date-fns';

/**
 * Creates fresh sample calendar event instances for testing
 * @returns {Object} Object containing sample calendar event instances
 */
export const createSampleCalendarEvents = () => {
  // Base date for testing
  const baseDate = new Date('2025-02-15T10:00:00.000Z');

  return {
    meeting: new CalendarEvent({
      id: '1',
      title: 'Team Meeting',
      startDate: baseDate,
      endDate: new Date(baseDate.getTime() + 60 * 60 * 1000), // 1 hour after start
    }),

    lunch: new CalendarEvent({
      id: '2',
      title: 'Lunch with Client',
      startDate: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours after base
      endDate: new Date(baseDate.getTime() + 4.5 * 60 * 60 * 1000), // 1.5 hours long
    }),

    conference: new CalendarEvent({
      id: '3',
      title: 'Industry Conference',
      startDate: addDays(baseDate, 1), // Next day
      endDate: addDays(baseDate, 3), // 2 days long
    }),

    appointment: new CalendarEvent({
      id: '4',
      title: 'Doctor Appointment',
      startDate: addDays(baseDate, 2),
      endDate: addDays(baseDate, 2, 1), // 1 hour long
    }),
  };
};

/**
 * Creates a collection of events for different test scenarios
 * @returns {Object} Various event collections for testing
 */
export const createEventCollections = () => {
  const events = createSampleCalendarEvents();

  return {
    empty: [],
    singleEvent: [events.meeting],
    dailyEvents: [events.meeting, events.lunch],
    weeklyEvents: [events.meeting, events.lunch, events.conference, events.appointment],
  };
};

/**
 * Creates fresh test dates related to calendar functionality
 * @returns {Object} Object containing common test dates
 */
export const createCalendarTestDates = () => {
  const baseDate = new Date('2025-02-15T12:00:00.000Z');

  return {
    today: baseDate,
    tomorrow: addDays(baseDate, 1),
    nextWeek: addDays(baseDate, 7),
    weekStart: new Date('2025-02-10T00:00:00.000Z'), // Monday
    weekEnd: new Date('2025-02-16T23:59:59.999Z'), // Sunday
  };
};
