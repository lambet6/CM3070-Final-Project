import React from 'react';
import { View } from 'react-native';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { styles } from '../CalendarStyles';
import { IconButton, Button, Text } from 'react-native-paper';

/**
 * CalendarHeader - Renders the navigation and title section of the calendar
 *
 * Features:
 * - Previous and next navigation buttons
 * - Display of current month/week
 * - Today button to reset to current date
 *
 * Accessibility:
 * - Provides clear labels for navigation actions
 * - Disables 'Today' button when already on current date
 */
export const CalendarHeader = ({ calendarRowMonth, onPrev, onNext, onReset, isToday }) => (
  <Calendar.HStack style={styles.headerContainer}>
    <IconButton
      selected={true}
      icon="chevron-left-circle"
      size={25}
      onPress={onPrev}
      accessibilityLabel="Previous week/month"
    />
    <Text variant="titleMedium">{calendarRowMonth}</Text>
    <Button
      compact={true}
      icon="calendar-today"
      onPress={onReset}
      disabled={isToday}
      accessibilityLabel="Today"
      accessibilityHint="Resets the calendar to today">
      Today
    </Button>

    <IconButton
      selected={true}
      icon="chevron-right-circle"
      size={25}
      onPress={onNext}
      accessibilityLabel="Next week/month"
    />
  </Calendar.HStack>
);
