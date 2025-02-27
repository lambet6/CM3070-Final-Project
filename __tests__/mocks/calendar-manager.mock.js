/*global jest*/
import { createEventCollections } from '../fixtures/calendar-fixtures';

/**
 * Creates a mock calendar manager for testing
 * @param {Object} customImplementations - Optional custom implementations for specific methods
 * @returns {Object} Mock calendar manager with all required methods
 */
export const createMockCalendarManager = (
  initialEvents = createEventCollections(),
  customImplementations = {},
) => {
  // Default implementations
  const defaults = {
    getWeeklyCalendarEvents: jest.fn().mockResolvedValue(initialEvents.empty),
    createNewCalendarEvent: jest.fn().mockResolvedValue(initialEvents.singleEvent[0]),
  };

  // Combine defaults with any custom implementations
  return {
    ...defaults,
    ...customImplementations,
  };
};
