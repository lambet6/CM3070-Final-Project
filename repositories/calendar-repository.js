import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function getStoredCalendarEvents(startDate, endDate) {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') throw new Error('Calendar permission not granted');
  
      const defaultCalendarId = await getDefaultCalendarId();
      if (!defaultCalendarId) {
        console.warn('No default calendar found, returning empty events');
        return [];
      }
      
      return await Calendar.getEventsAsync([defaultCalendarId], startDate, endDate);
    } catch (error) {
      console.error('Error retrieving calendar events:', error);
      return [];
    }
  }
  

export async function addCalendarEvent(title, startDate, endDate) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') throw new Error('Calendar permission not granted');

    const defaultCalendarId = await getDefaultCalendarId();
    if (!defaultCalendarId) throw new Error('No default calendar found');

    return await Calendar.createEventAsync(defaultCalendarId, {
      title,
      startDate,
      endDate,
      timeZone: 'UTC',
    });
  } catch (error) {
    console.error('Error adding calendar event:', error);
  }
}

async function getDefaultCalendarId() {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar?.id || null;
  } else {
    const calendars = await Calendar.getCalendarsAsync();
    const primaryCalendar = calendars.find(cal => cal.accessLevel === 'owner' && cal.isPrimary);
    return primaryCalendar ? primaryCalendar.id : calendars[0]?.id || null;
  }
}
