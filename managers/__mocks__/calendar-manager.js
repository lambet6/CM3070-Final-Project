/*global jest*/
import { createEventCollections } from '../../__tests__/fixtures/calendar-fixtures';

/**
 * Creates a mock calendar manager for testing
 * @param {Object} customImplementations - Optional custom implementations for specific methods
 * @returns {Object} Mock calendar manager with all required methods
 */
export const createCalendarManager = (
  initialEvents = createEventCollections(),
  customImplementations = {},
) => {
  // Default implementations
  const defaults = {
    getWeeklyCalendarEvents: jest.fn().mockResolvedValue(initialEvents.empty),
    createNewCalendarEvent: jest.fn().mockResolvedValue(initialEvents.singleEvent),
  };

  // Combine defaults with any custom implementations
  return {
    ...defaults,
    ...customImplementations,
  };
};
