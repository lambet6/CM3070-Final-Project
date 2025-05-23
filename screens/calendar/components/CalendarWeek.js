import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { format } from 'date-fns';
import { CONSTANTS } from '../CalendarConstants';
import { styles } from '../CalendarStyles';
import { useTheme } from 'react-native-paper';

/**
 * CalendarWeek - Renders a single week in the calendar view
 *
 * Handles rendering of days, including:
 * - Filtering days based on week/month view
 * - Displaying events and tasks as indicators
 * - Highlighting selected and current dates
 */
export const CalendarWeek = React.memo(
  ({ week, isWeekView, calendarTheme, onDatePress, events, tasks, selectedDate }) => {
    const theme = useTheme();

    // Memoized map of events for efficient lookup
    const eventMap = useMemo(() => {
      if (!events || events.length === 0) return new Map();

      const map = new Map();
      events.forEach((event) => {
        const dateStr = format(event.startDate, 'yyyy-MM-dd');
        map.set(dateStr, true);
      });
      return map;
    }, [events]);

    // Memoized map of tasks by priority for efficient lookup
    const taskMap = useMemo(() => {
      if (!tasks) return { low: new Map(), medium: new Map(), high: new Map() };

      const map = { low: new Map(), medium: new Map(), high: new Map() };

      // Categorize tasks by priority and date
      tasks.low.forEach((task) => {
        const dateStr = format(task.dueDate, 'yyyy-MM-dd');
        map.low.set(dateStr, true);
      });

      tasks.medium.forEach((task) => {
        const dateStr = format(task.dueDate, 'yyyy-MM-dd');
        map.medium.set(dateStr, true);
      });

      tasks.high.forEach((task) => {
        const dateStr = format(task.dueDate, 'yyyy-MM-dd');
        map.high.set(dateStr, true);
      });

      return map;
    }, [tasks]);

    return (
      <Calendar.Row.Week style={styles.weekRow}>
        {week.map((day) => {
          // Skip rendering days from different months in week view
          if (!isWeekView && day.isDifferentMonth) {
            return <Calendar.Item.Empty key={day.id} />;
          }

          const dayDate = format(day.date, 'yyyy-MM-dd');
          const hasEvents = eventMap.has(dayDate);
          const hasLowTasks = taskMap.low.has(dayDate);
          const hasMediumTasks = taskMap.medium.has(dayDate);
          const hasHighTasks = taskMap.high.has(dayDate);

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
                <View style={styles.dayContent}>
                  {/* Indicator for events on this day */}
                  <View
                    style={[
                      styles.eventLine,
                      { backgroundColor: hasEvents ? '#ff00ff' : 'transparent' },
                    ]}
                  />

                  {/* Date text with dynamic coloring for selected date */}
                  <Text
                    style={{
                      flex: 1,
                      color:
                        day.id === selectedDate ? theme.colors.onPrimary : theme.colors.onSurface,
                    }}>
                    {day.displayLabel}
                  </Text>

                  {/* Task priority indicators */}
                  <View style={styles.dotContainer}>
                    {hasLowTasks && (
                      <View
                        style={[
                          styles.TaskDot,
                          {
                            backgroundColor: theme.colors.green,
                            borderColor: theme.colors.onGreen,
                          },
                        ]}
                      />
                    )}
                    {hasMediumTasks && (
                      <View
                        style={[
                          styles.TaskDot,
                          {
                            backgroundColor: theme.colors.yellow,
                            borderColor: theme.colors.onYellow,
                          },
                        ]}
                      />
                    )}
                    {hasHighTasks && (
                      <View
                        style={[
                          styles.TaskDot,
                          { backgroundColor: theme.colors.red, borderColor: theme.colors.onRed },
                        ]}
                      />
                    )}
                  </View>
                </View>
              </Calendar.Item.Day>
            </Calendar.Item.Day.Container>
          );
        })}
      </Calendar.Row.Week>
    );
  },
);

CalendarWeek.displayName = 'CalendarWeek';
