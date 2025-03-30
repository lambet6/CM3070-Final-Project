import React from 'react';
import { View } from 'react-native';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { styles } from '../CalendarStyles';
import { IconButton, Button, Text } from 'react-native-paper';

export const CalendarHeader = ({ calendarRowMonth, onPrev, onNext, onReset, isToday }) => (
  <Calendar.HStack style={styles.headerContainer}>
    <IconButton
      selected={true}
      // mode="contained"
      icon="chevron-left-circle"
      size={30}
      onPress={onPrev}
      accessibilityLabel="Previous week/month"
    />

    <View style={styles.titleContainer}>
      <Text variant="titleMedium">{calendarRowMonth}</Text>
      <Button
        // compact={true}
        icon="calendar-today"
        mode="contained-tonal"
        onPress={onReset}
        disabled={isToday}
        accessibilityLabel="Today"
        accessibilityHint="Resets the calendar to today">
        Today
      </Button>
    </View>

    <IconButton
      selected={true}
      // mode="contained"
      icon="chevron-right-circle"
      size={30}
      onPress={onNext}
      accessibilityLabel="Next week/month"
    />
  </Calendar.HStack>
);
