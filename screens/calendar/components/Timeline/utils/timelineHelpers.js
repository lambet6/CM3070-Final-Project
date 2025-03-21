import { Dimensions } from 'react-native';

// Constants
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const HOUR_HEIGHT = 80;
export const QUARTER_HEIGHT = HOUR_HEIGHT / 4; // 15-minute increments
export const TASK_ITEM_HEIGHT = 50;
export const TASK_ITEM_WIDTH = 120;
export const TIMELINE_OFFSET = SCREEN_WIDTH * 0.25;
export const MIN_HOUR = 8; // 8 AM
export const MAX_HOUR = 21; // 9 PM
// Auto-scroll constants
export const EDGE_THRESHOLD = 100; // Distance from edge to trigger auto-scroll
export const MAX_SCROLL_SPEED = 8; // Maximum scroll speed

// Sample data with duration only (no position)
export const INITIAL_TASKS = [
  { id: '1', title: 'Meeting', duration: 1, scheduled: false, startTime: null },
  { id: '2', title: 'Lunch', duration: 1.5, scheduled: false, startTime: null },
  { id: '3', title: 'Workout', duration: 2, scheduled: false, startTime: null },
  { id: '4', title: 'Call Mom', duration: 0.5, scheduled: false, startTime: null },
  { id: '5', title: 'Project Work', duration: 0.75, scheduled: false, startTime: null },
];

export const HOURS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  // 12 PM is noon, hours after noon are PM
  return hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
});

export const QUARTERS = ['00', '15', '30', '45'];

// Helper function to format time from decimal hour
export const formatTimeFromDecimal = (decimalHour) => {
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Conversion functions between time and position
export const timeToPosition = (time) => {
  'worklet';
  return (time - MIN_HOUR) * HOUR_HEIGHT;
};

export const positionToTime = (position) => {
  'worklet';
  const totalQuarters = Math.round(position / QUARTER_HEIGHT);
  return MIN_HOUR + totalQuarters / 4;
};

// Helper function to check if a point is inside a rectangle
export const isPointInRect = (pointX, pointY, rect) => {
  'worklet';
  return (
    rect &&
    pointX >= rect.x &&
    pointX <= rect.x + rect.width &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.height
  );
};
