import { getWeeklyCalendarEvents, createNewCalendarEvent } from '../../../managers/calendar-manager';
import { getStoredCalendarEvents, addCalendarEvent } from '../../../repositories/calendar-repository';
import { startOfWeek, endOfWeek } from 'date-fns';

jest.mock('../../../repositories/calendar-repository', () => ({
  getStoredCalendarEvents: jest.fn(),
  addCalendarEvent: jest.fn(),
}));

describe('Calendar Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Fetching weekly calendar events successfully
  it('should fetch weekly calendar events from the repository', async () => {
    const mockEvents = [
      { id: '1', title: 'Meeting', startDate: '2025-02-12T10:00:00.000Z', endDate: '2025-02-12T12:00:00.000Z' },
      { id: '2', title: 'Lunch', startDate: '2025-02-14T13:00:00.000Z', endDate: '2025-02-14T14:00:00.000Z' },
    ];

    getStoredCalendarEvents.mockResolvedValue(mockEvents);

    const events = await getWeeklyCalendarEvents();

    expect(getStoredCalendarEvents).toHaveBeenCalledWith(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      endOfWeek(new Date(), { weekStartsOn: 1 })
    );
    expect(events).toEqual(mockEvents);
  });

  // Returns empty array when repository throws an error
  it('should return an empty array if an error occurs while fetching weekly calendar events', async () => {
    getStoredCalendarEvents.mockRejectedValue(new Error('Database failure'));

    const events = await getWeeklyCalendarEvents();

    expect(getStoredCalendarEvents).toHaveBeenCalledTimes(1);
    expect(events).toEqual([]);
  });

  // Adds a new calendar event successfully
  it('should add a new calendar event', async () => {
    addCalendarEvent.mockResolvedValue('event-id');

    const eventId = await createNewCalendarEvent('Meeting', new Date('2025-02-12T10:00:00.000Z'), new Date('2025-02-12T12:00:00.000Z'));

    expect(addCalendarEvent).toHaveBeenCalledWith(
      'Meeting',
      new Date('2025-02-12T10:00:00.000Z'),
      new Date('2025-02-12T12:00:00.000Z')
    );
    expect(eventId).toBe('event-id');
  });
});
