import { endOfWeek, startOfWeek } from 'date-fns';
import { getStoredCalendarEvents, addCalendarEvent } from '../repositories/calendar-repository';

export async function getWeeklyCalendarEvents() {
    try {
        const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        const endDate = endOfWeek(new Date(), { weekStartsOn: 1 }); // Sunday
        const calendarEvents = await getStoredCalendarEvents(startDate, endDate);
        return calendarEvents;
    } catch (err) {
        console.warn('Error getting weekly calendar data:', err);
        return [];
    }
}

export async function createNewCalendarEvent(title, startDate, endDate) {
    return await addCalendarEvent(title, startDate, endDate);
}
