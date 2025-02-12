import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { getTasks } from '../services/task-manager';

export async function getWeeklyCalendarData(startOfWeek, endOfWeek) {
  try {
    // 1. Request or verify permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Calendar permission not granted');
    }

    // 2. Get default calendar ID
    const defaultCalendarId = await getDefaultCalendarId();
    if (!defaultCalendarId) {
      throw new Error('No default calendar found');
    }

    // 3. Fetch events from the default calendar
    const calendarEvents = await Calendar.getEventsAsync(
      [defaultCalendarId],
      startOfWeek,
      endOfWeek
    );

    // 4. Fetch tasks from Task Manager
    const allTasks = await getTasks();
    const weeklyTasks = filterTasksForWeek(allTasks, startOfWeek, endOfWeek);

    // 5. Return merged data
    return { events: calendarEvents, tasks: weeklyTasks };

  } catch (err) {
    console.error('Error getting weekly calendar data:', err);
    return { events: [], tasks: [] };
  }
}

// Selects the best default calendar for iOS & Android
async function getDefaultCalendarId() {
  if (Platform.OS === 'ios') {
    // iOS: Use built-in method
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar?.id || null;
  } else {
    // Android: Manually select a default calendar
    const calendars = await Calendar.getCalendarsAsync();
    
    // Prefer "Primary" or "Local" calendars
    const primaryCalendar = calendars.find(cal => cal.accessLevel === 'owner' && cal.isPrimary);
    if (primaryCalendar) return primaryCalendar.id;

    // If no primary, just pick the first calendar the user owns
    const ownedCalendar = calendars.find(cal => cal.accessLevel === 'owner');
    return ownedCalendar?.id || null;
  }
}

// Helper to filter tasks within the weekly range
function filterTasksForWeek(allTasks, startDate, endDate) {
  let tasksArray = allTasks;
  if (allTasks.high || allTasks.medium || allTasks.low) {
    tasksArray = [...allTasks.high, ...allTasks.medium, ...allTasks.low];
  }

  return tasksArray.filter(task => {
    const due = new Date(task.dueDate);
    return due >= startDate && due <= endDate;
  });
}
