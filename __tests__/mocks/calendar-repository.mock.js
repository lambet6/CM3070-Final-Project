/*global jest*/
import { createEventCollections } from '../fixtures/calendar-fixtures';

/**
 * Creates a mock calendar repository for testing
 * @param {Object} initialData - Optional data to initialize the mock repository
 * @returns {Object} Mock repository with calendar operations
 */
export const createMockCalendarRepository = (initialEvents = createEventCollections().empty) => {
  // In-memory data store for the mock
  let eventsData = [...initialEvents];

  return {
    // Mock implementation of getStoredCalendarEvents
    getStoredCalendarEvents: jest.fn().mockImplementation((startDate, endDate) => {
      // Filter events within date range
      const filteredEvents = eventsData.filter((event) => {
        return event.startDate >= startDate && event.endDate <= endDate;
      });

      return Promise.resolve([...filteredEvents]);
    }),

    // Mock implementation of addCalendarEvent
    addCalendarEvent: jest.fn().mockImplementation((event) => {
      const newEventWithId = {
        ...event,
        id: `mock-event-${Date.now()}`,
      };

      eventsData.push(newEventWithId);
      return Promise.resolve(newEventWithId);
    }),

    // Helper to reset the mock data
    __resetData: (newData = []) => {
      eventsData = [...newData];
    },

    // Helper to get the current mock data directly
    __getData: () => [...eventsData],
  };
};
