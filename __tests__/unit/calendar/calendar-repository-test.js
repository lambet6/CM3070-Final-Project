/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import * as Calendar from 'expo-calendar';
import { createCalendarRepository } from '../../../repositories/calendar-repository';
import { CalendarEvent } from '../../../domain/CalendarEvent';

// Mock expo-calendar
jest.mock('expo-calendar', () => ({
  requestCalendarPermissionsAsync: jest.fn(),
  getEventsAsync: jest.fn(),
  createEventAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  getDefaultCalendarAsync: jest.fn(),
}));

describe('Calendar Repository', () => {
  let calendarRepository;
  let mockCalendarApi;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock calendar API
    mockCalendarApi = {
      requestCalendarPermissionsAsync: Calendar.requestCalendarPermissionsAsync,
      getEventsAsync: Calendar.getEventsAsync,
      createEventAsync: Calendar.createEventAsync,
      getCalendarsAsync: Calendar.getCalendarsAsync,
      getDefaultCalendarAsync: Calendar.getDefaultCalendarAsync,
    };

    // Create repository with mock calendar API
    calendarRepository = createCalendarRepository(mockCalendarApi);
  });

  describe('Calendar Event Retrieval', () => {
    it('should fetch and transform stored calendar events', async () => {
      // Arrange
      const mockNativeEvent = {
        id: '1',
        title: 'Test Event',
        startDate: '2025-02-10T10:00:00.000Z',
        endDate: '2025-02-10T12:00:00.000Z',
      };

      mockCalendarApi.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockCalendarApi.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
      mockCalendarApi.getEventsAsync.mockResolvedValue([mockNativeEvent]);

      // Act
      const events = await calendarRepository.getStoredCalendarEvents(
        new Date('2025-02-10'),
        new Date('2025-02-11'),
      );

      // Assert
      expect(events[0]).toBeInstanceOf(CalendarEvent);
      expect(events[0].startDate).toBeInstanceOf(Date);
      expect(events[0].endDate).toBeInstanceOf(Date);
      expect(events[0].toJSON()).toEqual({
        id: '1',
        title: 'Test Event',
        startDate: '2025-02-10T10:00:00.000Z',
        endDate: '2025-02-10T12:00:00.000Z',
      });
    });

    it('should throw error for invalid start date', async () => {
      // Act & Assert
      await expect(
        calendarRepository.getStoredCalendarEvents('invalid-date', new Date()),
      ).rejects.toThrow('Invalid start date');
    });

    it('should throw error for invalid end date', async () => {
      // Act & Assert
      await expect(
        calendarRepository.getStoredCalendarEvents(new Date(), 'invalid-date'),
      ).rejects.toThrow('Invalid end date');
    });

    it('should throw error when end date is before start date', async () => {
      // Arrange
      const endDate = new Date('2025-02-10');
      const startDate = new Date('2025-02-11');

      // Act & Assert
      await expect(calendarRepository.getStoredCalendarEvents(startDate, endDate)).rejects.toThrow(
        'End date cannot be before start date',
      );
    });

    it('should throw error when permission is denied', async () => {
      // Arrange
      mockCalendarApi.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      // Act & Assert
      await expect(
        calendarRepository.getStoredCalendarEvents(new Date(), new Date()),
      ).rejects.toThrow('Calendar permission not granted');
    });

    it('should throw error when no default calendar is found', async () => {
      // Arrange
      mockCalendarApi.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockCalendarApi.getDefaultCalendarAsync.mockResolvedValue(null);
      mockCalendarApi.getCalendarsAsync.mockResolvedValue([]);

      // Act & Assert
      await expect(
        calendarRepository.getStoredCalendarEvents(new Date(), new Date()),
      ).rejects.toThrow('No default calendar found');
    });
  });

  describe('Calendar Event Creation', () => {
    it('should save and return new calendar event', async () => {
      // Arrange
      const event = new CalendarEvent({
        id: 'temp',
        title: 'New Meeting',
        startDate: new Date('2025-02-10T10:00:00.000Z'),
        endDate: new Date('2025-02-10T11:00:00.000Z'),
      });

      mockCalendarApi.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockCalendarApi.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
      mockCalendarApi.createEventAsync.mockResolvedValue('new-event-1');

      // Act
      const savedEvent = await calendarRepository.addCalendarEvent(event);

      // Assert
      expect(savedEvent).toBeInstanceOf(CalendarEvent);
      expect(savedEvent.toJSON()).toEqual({
        id: 'new-event-1',
        title: 'New Meeting',
        startDate: '2025-02-10T10:00:00.000Z',
        endDate: '2025-02-10T11:00:00.000Z',
      });
    });

    it('should throw error when dates are invalid', async () => {
      // Act & Assert
      await expect(
        () =>
          new CalendarEvent({
            id: 'temp',
            title: 'New Meeting',
            startDate: 'invalid-date',
            endDate: new Date('2025-02-10T11:00:00.000Z'),
          }),
      ).toThrow('Invalid start date');
    });

    it('should validate dates before saving event', async () => {
      // Arrange - Create event with valid dates first
      const validEvent = new CalendarEvent({
        id: 'temp',
        title: 'New Meeting',
        startDate: new Date('2025-02-10T10:00:00.000Z'),
        endDate: new Date('2025-02-10T11:00:00.000Z'),
      });

      // Act & Assert - Try to update end date to invalid value
      expect(() => validEvent.setEndDate(new Date('2025-02-10T09:00:00.000Z'))).toThrow(
        'End date cannot be before start date',
      );
    });

    it('should throw error when calendar permission is denied', async () => {
      // Arrange
      const event = new CalendarEvent({
        id: 'temp',
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      });

      mockCalendarApi.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      // Act & Assert
      await expect(calendarRepository.addCalendarEvent(event)).rejects.toThrow(
        'Calendar permission not granted',
      );
    });

    it('should throw error when no default calendar is found', async () => {
      // Arrange
      const event = new CalendarEvent({
        id: 'temp',
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      });

      mockCalendarApi.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockCalendarApi.getDefaultCalendarAsync.mockResolvedValue(null);
      mockCalendarApi.getCalendarsAsync.mockResolvedValue([]);

      // Act & Assert
      await expect(calendarRepository.addCalendarEvent(event)).rejects.toThrow(
        'No default calendar found',
      );
    });
  });
});
