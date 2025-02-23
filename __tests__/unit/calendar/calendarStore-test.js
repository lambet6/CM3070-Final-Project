/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useCalendarStore } from '../../../store/calendarStore';
import { getWeeklyCalendarEvents } from '../../../managers/calendar-manager';

jest.mock('../../../managers/calendar-manager', () => ({
  getWeeklyCalendarEvents: jest.fn(),
}));

describe('Calendar Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loads weekly calendar events successfully
  it('should load weekly calendar events into the store', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Meeting',
        startDate: '2025-02-12T10:00:00.000Z',
        endDate: '2025-02-12T12:00:00.000Z',
      },
    ];
    getWeeklyCalendarEvents.mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useCalendarStore());

    await act(async () => {
      await result.current.loadCalendarEvents();
    });

    expect(getWeeklyCalendarEvents).toHaveBeenCalledTimes(1);
    expect(result.current.events).toEqual(mockEvents);
  });
});
