import { getWeeklyCalendarEvents, createNewCalendarEvent } from '../../../managers/calendar-manager';
import { getStoredCalendarEvents, addCalendarEvent } from '../../../repositories/calendar-repository';
import { CalendarEvent } from '../../../domain/CalendarEvent';
import { startOfWeek, endOfWeek } from 'date-fns';

jest.mock('../../../repositories/calendar-repository', () => ({
  getStoredCalendarEvents: jest.fn(),
  addCalendarEvent: jest.fn(),
}));

describe('Calendar Manager', () => {
  const MOCK_DATE = new Date('2025-02-12T00:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the current date
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_DATE);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Calendar Event Creation', () => {
    it('should create and save a new calendar event', async () => {
      const title = 'Team Meeting';
      const startDate = new Date('2025-02-12T10:00:00.000Z');
      const endDate = new Date('2025-02-12T11:00:00.000Z');

      const mockSavedEvent = new CalendarEvent({
        id: 'event-1',
        title,
        startDate,
        endDate
      });

      addCalendarEvent.mockResolvedValue(mockSavedEvent);

      const result = await createNewCalendarEvent(title, startDate, endDate);

      expect(result).toEqual(mockSavedEvent);
      expect(addCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          startDate,
          endDate
        })
      );
    });
  });

  describe('Calendar Event Retrieval', () => {
    it('should fetch weekly calendar events from repository', async () => {
      const mockEvents = [
        new CalendarEvent({ 
          id: '1', 
          title: 'Meeting', 
          startDate: new Date('2025-02-12T10:00:00.000Z'),
          endDate: new Date('2025-02-12T11:00:00.000Z')
        })
      ];

      getStoredCalendarEvents.mockResolvedValue(mockEvents);

      const events = await getWeeklyCalendarEvents();

      const expectedStartDate = startOfWeek(MOCK_DATE, { weekStartsOn: 1 });
      const expectedEndDate = endOfWeek(MOCK_DATE, { weekStartsOn: 1 });

      expect(getStoredCalendarEvents).toHaveBeenCalledWith(
        expectedStartDate,
        expectedEndDate
      );
      expect(events).toEqual(mockEvents);
    });

    it('should return empty array when repository throws an error', async () => {
      getStoredCalendarEvents.mockRejectedValue(new Error('Network error'));

      const events = await getWeeklyCalendarEvents();

      expect(events).toEqual([]);
    });
  });
});
