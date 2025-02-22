import { endOfWeek, startOfWeek } from 'date-fns';
import { getStoredCalendarEvents, addCalendarEvent } from '../repositories/calendar-repository';
import { CalendarEvent } from '../domain/CalendarEvent';

export async function getWeeklyCalendarEvents() {
    try {
        const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        return await getStoredCalendarEvents(startDate, endDate);
    } catch (err) {
        console.warn('Error getting weekly calendar data:', err);
        return [];
    }
}

export function createCalendarEvent(title, startDate, endDate) {
    return new CalendarEvent({
        id: null, // ID will be assigned by the calendar provider
        title,
        startDate,
        endDate
    });
}

export async function createNewCalendarEvent(title, startDate, endDate) {
    const event = createCalendarEvent(title, startDate, endDate);
    return await addCalendarEvent(event);
}
