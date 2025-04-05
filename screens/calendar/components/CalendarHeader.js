import React from 'react';
import { View } from 'react-native';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { styles } from '../CalendarStyles';
import { IconButton, Button, Text } from 'react-native-paper';

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
      // mode="contained-tonal"
      onPress={onReset}
      disabled={isToday}
      accessibilityLabel="Today"
      accessibilityHint="Resets the calendar to today">
      Today
    </Button>

    <IconButton
      selected={true}
      // mode="contained"
      icon="chevron-right-circle"
      size={25}
      onPress={onNext}
      accessibilityLabel="Next week/month"
    />
  </Calendar.HStack>
);
