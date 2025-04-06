import React from 'react';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { styles } from '../CalendarStyles';

/**
 * WeekdaysHeader - Renders the header row with weekday names
 *
 * Features:
 * - Displays abbreviated weekday names
 * - Uses theme-based styling for text color
 * - Renders in a consistent calendar row format
 */
export const WeekdaysHeader = ({ weekDaysList, theme }) => (
  <Calendar.Row.Week style={styles.weekDaysRow}>
    {weekDaysList.map((day, index) => (
      <Calendar.Item.WeekName
        textProps={{
          style: {
            fontWeight: 'bold',
            color: theme.colors.onSurface,
          },
        }}
        key={`${day}-${index}`}>
        {day}
      </Calendar.Item.WeekName>
    ))}
  </Calendar.Row.Week>
);
