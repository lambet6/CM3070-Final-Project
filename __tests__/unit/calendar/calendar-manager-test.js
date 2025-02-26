/*global jest*/
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { createCalendarManager } from '../../../managers/calendar-manager';
import { createMockCalendarRepository } from '../../mocks/calendar-repository.mock';
import { createSampleCalendarEvents } from '../../fixtures/calendar-fixtures';
import { startOfWeek, endOfWeek } from 'date-fns';

describe('Calendar Manager', () => {
  const MOCK_DATE = new Date('2025-02-12T00:00:00.000Z');
  const MOCK_TIMESTAMP = MOCK_DATE.getTime();

  let mockRepository;
  let calendarManager;
  let sampleEvents;

  beforeEach(() => {
    // Create fresh test data for each test
    sampleEvents = createSampleCalendarEvents();
    // Setup mock repository and create manager with dependency injection
    mockRepository = createMockCalendarRepository();
    calendarManager = createCalendarManager(mockRepository);

    // Create a class that extends Date for consistent date testing
    const MockDate = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(MOCK_TIMESTAMP);
        } else {
          super(...args);
        }
      }
      static now() {
        return MOCK_TIMESTAMP;
      }
    };
    global.Date = MockDate;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Calendar Event Creation', () => {
    it('should create and save a new calendar event', async () => {
      // Arrange
      const title = 'Team Meeting';
      const startDate = new Date('2025-02-12T10:00:00.000Z');
      const endDate = new Date('2025-02-12T11:00:00.000Z');

      mockRepository.addCalendarEvent.mockResolvedValueOnce(sampleEvents.meeting);

      // Act
      const result = await calendarManager.createNewCalendarEvent(title, startDate, endDate);

      // Assert
      expect(result).toEqual(sampleEvents.meeting);
      expect(mockRepository.addCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'temp',
          title,
          startDate,
          endDate,
        }),
      );
    });

    it('should throw error for invalid date parameters', async () => {
      // Arrange
      const title = 'Team Meeting';
      const startDate = 'invalid-date';
      const endDate = new Date('2025-02-12T11:00:00.000Z');

      // Act & Assert
      await expect(
        calendarManager.createNewCalendarEvent(title, startDate, endDate),
      ).rejects.toThrow('Failed to create calendar event: Invalid start date');
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const title = 'Team Meeting';
      const startDate = new Date('2025-02-12T10:00:00.000Z');
      const endDate = new Date('2025-02-12T11:00:00.000Z');

      mockRepository.addCalendarEvent.mockRejectedValueOnce(
        new Error('Calendar permission not granted'),
      );

      // Act & Assert
      await expect(
        calendarManager.createNewCalendarEvent(title, startDate, endDate),
      ).rejects.toThrow('Failed to create calendar event: Calendar permission not granted');
    });
  });

  describe('Calendar Event Retrieval', () => {
    it('should fetch weekly calendar events from repository', async () => {
      // Arrange
      mockRepository.getStoredCalendarEvents.mockResolvedValueOnce([sampleEvents.meeting]);

      // Act
      const events = await calendarManager.getWeeklyCalendarEvents();

      // Assert
      const expectedStartDate = startOfWeek(new Date(MOCK_DATE), { weekStartsOn: 1 });
      const expectedEndDate = endOfWeek(new Date(MOCK_DATE), { weekStartsOn: 1 });

      expect(mockRepository.getStoredCalendarEvents).toHaveBeenCalledWith(
        expectedStartDate,
        expectedEndDate,
      );
      expect(events).toEqual([sampleEvents.meeting]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepository.getStoredCalendarEvents.mockRejectedValueOnce(
        new Error('Calendar permission not granted'),
      );

      // Act & Assert
      await expect(calendarManager.getWeeklyCalendarEvents()).rejects.toThrow(
        'Failed to get weekly calendar events: Calendar permission not granted',
      );
    });

    it('should throw error when repository fails with network error', async () => {
      // Arrange
      mockRepository.getStoredCalendarEvents.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(calendarManager.getWeeklyCalendarEvents()).rejects.toThrow(
        'Failed to get weekly calendar events: Network error',
      );
    });

    it('should pass correct date range to repository', async () => {
      // Arrange
      mockRepository.getStoredCalendarEvents.mockResolvedValueOnce([]);

      // Act
      await calendarManager.getWeeklyCalendarEvents();

      // Assert
      const expectedStartDate = startOfWeek(MOCK_DATE, { weekStartsOn: 1 });
      const expectedEndDate = endOfWeek(MOCK_DATE, { weekStartsOn: 1 });

      expect(mockRepository.getStoredCalendarEvents).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );

      // Verify date parameters match expected values
      const actualStartDate = mockRepository.getStoredCalendarEvents.mock.calls[0][0];
      const actualEndDate = mockRepository.getStoredCalendarEvents.mock.calls[0][1];

      expect(actualStartDate.toISOString()).toBe(expectedStartDate.toISOString());
      expect(actualEndDate.toISOString()).toBe(expectedEndDate.toISOString());
    });
  });
});
