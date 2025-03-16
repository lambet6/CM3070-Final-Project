import React from 'react';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { CONSTANTS } from '../CalendarConstants';
import { styles } from '../CalendarStyles';

export const CalendarWeek = ({ week, isWeekView, calendarTheme, onDatePress }) => (
  <Calendar.Row.Week style={styles.weekRow}>
    {week.map((day) => {
      // In month view, hide dates from other months
      if (!isWeekView && day.isDifferentMonth) {
        return <Calendar.Item.Empty key={day.id} />;
      }

      // Otherwise show day as normal
      return (
        <Calendar.Item.Day.Container
          dayHeight={CONSTANTS.CALENDAR.DAY_HEIGHT}
          daySpacing={CONSTANTS.CALENDAR.ROW_SPACING}
          key={day.id}
          theme={calendarTheme.itemDayContainer}>
          <Calendar.Item.Day
            height={CONSTANTS.CALENDAR.DAY_HEIGHT}
            metadata={day}
            onPress={onDatePress}
            theme={calendarTheme.itemDay}>
            {day.displayLabel}
          </Calendar.Item.Day>
        </Calendar.Item.Day.Container>
      );
    })}
  </Calendar.Row.Week>
);
