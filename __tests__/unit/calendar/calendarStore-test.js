/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useCalendarStore } from '../../../store/calendarStore';
import { getWeeklyCalendarEvents } from '../../../managers/calendar-manager';
import { CalendarEvent } from '../../../domain/CalendarEvent';

jest.mock('../../../managers/calendar-manager', () => ({
  getWeeklyCalendarEvents: jest.fn(),
}));

describe('Calendar Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load weekly calendar events into the store', async () => {
    const mockEvent = new CalendarEvent({
      id: '1',
      title: 'Meeting',
      startDate: new Date('2025-02-12T10:00:00.000Z'),
      endDate: new Date('2025-02-12T12:00:00.000Z'),
    });

    getWeeklyCalendarEvents.mockResolvedValue([mockEvent]);

    const { result } = renderHook(() => useCalendarStore());

    await act(async () => {
      await result.current.loadCalendarEvents();
    });

    expect(getWeeklyCalendarEvents).toHaveBeenCalledTimes(1);
    expect(result.current.events[0]).toBeInstanceOf(CalendarEvent);
    expect(result.current.events[0].toJSON()).toEqual({
      id: '1',
      title: 'Meeting',
      startDate: '2025-02-12T10:00:00.000Z',
      endDate: '2025-02-12T12:00:00.000Z',
    });
  });
});
