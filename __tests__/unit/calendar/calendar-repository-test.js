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
      expect(events[0]).toEqual(
        expect.objectContaining({
          id: '1',
          title: 'Test Event',
          startDate: new Date('2025-02-10T10:00:00.000Z'),
          endDate: new Date('2025-02-10T12:00:00.000Z'),
        }),
      );
    });

    it('should return empty array when permission is denied', async () => {
      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const events = await getStoredCalendarEvents(new Date(), new Date());

      expect(events).toEqual([]);
    });
  });

  describe('Calendar Event Creation', () => {
    it('should save and return new calendar event', async () => {
      const event = new CalendarEvent({
        id: null,
        title: 'New Meeting',
        startDate: new Date('2025-02-10T10:00:00.000Z'),
        endDate: new Date('2025-02-10T11:00:00.000Z'),
      });

      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Calendar.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
      Calendar.createEventAsync.mockResolvedValue('new-event-1');

      const savedEvent = await addCalendarEvent(event);

      expect(savedEvent).toBeInstanceOf(CalendarEvent);
      expect(savedEvent).toEqual(
        expect.objectContaining({
          id: 'new-event-1',
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
        }),
      );
    });

    it('should throw error when calendar permission is denied', async () => {
      const event = new CalendarEvent({
        id: null,
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
      });

      Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(addCalendarEvent(event)).rejects.toThrow('Calendar permission not granted');
    });
  });
});
