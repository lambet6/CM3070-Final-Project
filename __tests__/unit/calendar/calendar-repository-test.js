/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import * as Calendar from 'expo-calendar';
import {
  getStoredCalendarEvents,
  addCalendarEvent,
} from '../../../repositories/calendar-repository';
import { CalendarEvent } from '../../../domain/CalendarEvent';

jest.mock('expo-calendar', () => ({
  requestCalendarPermissionsAsync: jest.fn(),
  getEventsAsync: jest.fn(),
  createEventAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  getDefaultCalendarAsync: jest.fn(),
}));

describe('Calendar Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Calendar Event Retrieval', () => {
    it('should fetch and transform stored calendar events', async () => {
      const mockNativeEvent = {
        id: '1',
        title: 'Test Event',
        startDate: '2025-02-10T10:00:00.000Z',
        endDate: '2025-02-10T12:00:00.000Z',
      };

      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Calendar.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
      Calendar.getEventsAsync.mockResolvedValue([mockNativeEvent]);

      const events = await getStoredCalendarEvents(new Date('2025-02-10'), new Date('2025-02-11'));

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
      await expect(getStoredCalendarEvents('invalid-date', new Date())).rejects.toThrow(
        'Invalid start date',
      );
    });

    it('should throw error for invalid end date', async () => {
      await expect(getStoredCalendarEvents(new Date(), 'invalid-date')).rejects.toThrow(
        'Invalid end date',
      );
    });

    it('should throw error when end date is before start date', async () => {
      const endDate = new Date('2025-02-10');
      const startDate = new Date('2025-02-11');
      await expect(getStoredCalendarEvents(startDate, endDate)).rejects.toThrow(
        'End date cannot be before start date',
      );
    });

    it('should throw error when permission is denied', async () => {
      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(getStoredCalendarEvents(new Date(), new Date())).rejects.toThrow(
        'Calendar permission not granted',
      );
    });

    it('should throw error when no default calendar is found', async () => {
      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Calendar.getDefaultCalendarAsync.mockResolvedValue(null);
      Calendar.getCalendarsAsync.mockResolvedValue([]);

      await expect(getStoredCalendarEvents(new Date(), new Date())).rejects.toThrow(
        'No default calendar found',
      );
    });
  });

  describe('Calendar Event Creation', () => {
    it('should save and return new calendar event', async () => {
      const event = new CalendarEvent({
        id: 'temp', // Changed from null to 'temp'
        title: 'New Meeting',
        startDate: new Date('2025-02-10T10:00:00.000Z'),
        endDate: new Date('2025-02-10T11:00:00.000Z'),
      });

      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Calendar.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
      Calendar.createEventAsync.mockResolvedValue('new-event-1');

      const savedEvent = await addCalendarEvent(event);

      expect(savedEvent).toBeInstanceOf(CalendarEvent);
      expect(savedEvent.toJSON()).toEqual({
        id: 'new-event-1',
        title: 'New Meeting',
        startDate: '2025-02-10T10:00:00.000Z',
        endDate: '2025-02-10T11:00:00.000Z',
      });
    });

    it('should throw error when dates are invalid', async () => {
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
      // Create event with valid dates first
      const validEvent = new CalendarEvent({
        id: 'temp',
        title: 'New Meeting',
        startDate: new Date('2025-02-10T10:00:00.000Z'),
        endDate: new Date('2025-02-10T11:00:00.000Z'),
      });

      // Then try to update end date to invalid value
      expect(() => validEvent.setEndDate(new Date('2025-02-10T09:00:00.000Z'))).toThrow(
        'End date cannot be before start date',
      );
    });

    it('should throw error when calendar permission is denied', async () => {
      const event = new CalendarEvent({
        id: 'temp',
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      });

      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(addCalendarEvent(event)).rejects.toThrow('Calendar permission not granted');
    });

    it('should throw error when no default calendar is found', async () => {
      const event = new CalendarEvent({
        id: 'temp',
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      });

      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Calendar.getDefaultCalendarAsync.mockResolvedValue(null);
      Calendar.getCalendarsAsync.mockResolvedValue([]);

      await expect(addCalendarEvent(event)).rejects.toThrow('No default calendar found');
    });
  });
});
