import * as Calendar from 'expo-calendar';
import { getStoredCalendarEvents, addCalendarEvent } from '../../../repositories/calendar-repository';

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

  // Fetching stored calendar events successfully
  it('should fetch stored calendar events', async () => {
    Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Calendar.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
    Calendar.getEventsAsync.mockResolvedValue([
      { id: '1', title: 'Test Event', startDate: '2025-02-10T10:00:00.000Z', endDate: '2025-02-10T12:00:00.000Z' }
    ]);

    const events = await getStoredCalendarEvents(new Date('2025-02-10'), new Date('2025-02-11'));

    expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Calendar.getDefaultCalendarAsync).toHaveBeenCalledTimes(1);
    expect(Calendar.getEventsAsync).toHaveBeenCalledWith(['default-calendar'], new Date('2025-02-10'), new Date('2025-02-11'));
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Test Event');
  });

  // Returns empty array when permission is denied
  it('should return an empty array if calendar permission is denied', async () => {
    Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const events = await getStoredCalendarEvents(new Date(), new Date());

    expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(events).toEqual([]);
  });

  // Returns empty array when no default calendar is found
  it('should return an empty array if no default calendar is found', async () => {
    Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Calendar.getDefaultCalendarAsync.mockResolvedValue(null);

    const events = await getStoredCalendarEvents(new Date(), new Date());

    expect(Calendar.getDefaultCalendarAsync).toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  // Adds a calendar event successfully
  it('should add a new calendar event', async () => {
    Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Calendar.getDefaultCalendarAsync.mockResolvedValue({ id: 'default-calendar' });
    Calendar.createEventAsync.mockResolvedValue('event-id');

    const eventId = await addCalendarEvent('Meeting', new Date('2025-02-10T10:00:00.000Z'), new Date('2025-02-10T12:00:00.000Z'));

    expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Calendar.getDefaultCalendarAsync).toHaveBeenCalledTimes(1);
    expect(Calendar.createEventAsync).toHaveBeenCalledWith('default-calendar', {
      title: 'Meeting',
      startDate: new Date('2025-02-10T10:00:00.000Z'),
      endDate: new Date('2025-02-10T12:00:00.000Z'),
      timeZone: 'UTC',
    });
    expect(eventId).toBe('event-id');
  });
});
