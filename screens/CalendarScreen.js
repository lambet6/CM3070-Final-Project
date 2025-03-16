/*global setTimeout*/
import { Calendar, useCalendar, toDateId, fromDateId } from '@marceloterreiro/flash-calendar';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  addMonths,
  subMonths,
  startOfMonth,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Extract constants to a separate section
const CONSTANTS = {
  ANIMATION: {
    DURATION: 250,
    EASING: Easing.bezier(0.25, 0.1, 0.25, 1),
    SLIDE_DISTANCE: 100,
  },
  CALENDAR: {
    BORDER_RADIUS: 10,
    TODAY_BORDER_RADIUS: 15,
    SELECTED_BORDER_RADIUS: 8,
    DAY_HEIGHT: 48,
    ROW_SPACING: 0,
  },
  COLORS: {
    primary: '#585ABF',
    primaryLight: 'rgba(88, 90, 191, 0.1)',
    textFaded: 'rgba(180, 180, 180, 0.5)',
    white: '#FFFFFF',
    background: '#F8F9FC',
    buttonBackground: '#F0F1FA',
  },
};

// Extract calendar header component
const CalendarHeader = ({ calendarRowMonth, onPrev, onNext, onReset, isToday }) => (
  <Calendar.HStack style={styles.headerContainer}>
    <TouchableOpacity onPress={onPrev} style={styles.navButton} activeOpacity={0.7}>
      <Text style={styles.navButtonText}>❮</Text>
    </TouchableOpacity>

    <View style={styles.titleContainer}>
      <Text style={styles.monthTitle}>{calendarRowMonth}</Text>
      <TouchableOpacity
        onPress={onReset}
        disabled={isToday}
        style={styles.todayButton}
        activeOpacity={0.7}>
        <Text style={styles.todayButtonText}>Today</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity onPress={onNext} style={styles.navButton} activeOpacity={0.7}>
      <Text style={styles.navButtonText}>❯</Text>
    </TouchableOpacity>
  </Calendar.HStack>
);

// Extract weekdays header component
const WeekdaysHeader = ({ weekDaysList }) => (
  <Calendar.Row.Week style={styles.weekDaysRow}>
    {weekDaysList.map((day, index) => (
      <Calendar.Item.WeekName textProps={{ style: { fontWeight: 'bold' } }} key={`${day}-${index}`}>
        {day}
      </Calendar.Item.WeekName>
    ))}
  </Calendar.Row.Week>
);

// Extract calendar week component
const CalendarWeek = ({ week, isWeekView, calendarTheme, onDatePress }) => (
  <Calendar.Row.Week key={week[0]?.id || Math.random()} style={styles.weekRow}>
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

// Main component
export default function CustomCalendar() {
  // State management
  const today = new Date();
  const todayId = toDateId(today);
  const [selectedDate, setSelectedDate] = useState(todayId);
  const [isWeekView, setIsWeekView] = useState(true);
  const [currentDate, setCurrentDate] = useState(today);

  // Animation values
  const slideAnimation = useSharedValue(0);
  const horizontalSlide = useSharedValue(0);

  // Create animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
  }));

  const weekRowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: horizontalSlide.value }],
  }));

  // Handle view mode changes
  useEffect(() => {
    slideAnimation.value = isWeekView ? 20 : -20;
    slideAnimation.value = withTiming(0, {
      duration: CONSTANTS.ANIMATION.DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [isWeekView, slideAnimation]);

  // Calculate active date ranges
  const activeDateRanges = useMemo(() => {
    const selectedDateObj = fromDateId(selectedDate);
    const selectedWeekStart = startOfWeek(selectedDateObj);
    const selectedWeekEnd = endOfWeek(selectedDateObj);

    return [
      {
        startId: toDateId(selectedWeekStart),
        endId: toDateId(selectedWeekEnd),
      },
    ];
  }, [selectedDate]);

  // Use the calendar hook
  const { calendarRowMonth, weekDaysList, weeksList } = useCalendar({
    calendarMonthId: toDateId(currentDate),
    calendarActiveDateRanges: activeDateRanges,
  });

  // Define calendar theme
  const calendarTheme = useMemo(
    () => createCalendarTheme(selectedDate, todayId),
    [selectedDate, todayId],
  );

  // Filter weeks based on view mode
  const visibleWeeks = useMemo(() => {
    const currentDateId = toDateId(currentDate);

    if (!isWeekView) return weeksList;

    const weekIndex = weeksList.findIndex((week) =>
      week.some((day) => {
        if (day.id === currentDateId) return true;
        if (day.isStartOfWeek) {
          const parsedDay = fromDateId(day.id);
          return format(currentDate, 'yyyy-MM-dd') === format(parsedDay, 'yyyy-MM-dd');
        }
        return false;
      }),
    );

    return weekIndex !== -1 ? [weeksList[weekIndex]] : [weeksList[0]];
  }, [weeksList, isWeekView, currentDate]);

  // Handler functions
  const handleDatePress = useCallback(
    (dateId) => {
      setSelectedDate(dateId);

      if (isWeekView) {
        const selectedDateObj = fromDateId(dateId);
        const weekStart = startOfWeek(selectedDateObj);
        setCurrentDate(weekStart);
      }
    },
    [isWeekView],
  );

  const animateHorizontalSlide = useCallback(
    (initialValue, finalValue, updateFn) => {
      horizontalSlide.value = initialValue;
      horizontalSlide.value = withTiming(finalValue, {
        duration: CONSTANTS.ANIMATION.DURATION,
        easing: CONSTANTS.ANIMATION.EASING,
      });

      setTimeout(() => {
        updateFn();

        horizontalSlide.value = -finalValue;
        horizontalSlide.value = withTiming(0, {
          duration: CONSTANTS.ANIMATION.DURATION,
          easing: CONSTANTS.ANIMATION.EASING,
        });
      }, 50);
    },
    [horizontalSlide],
  );

  const handleReset = useCallback(() => {
    if (selectedDate === todayId) return;

    const currentSelectedDate = fromDateId(selectedDate);
    let shouldAnimate = false;

    if (isWeekView) {
      const selectedWeekStart = startOfWeek(currentSelectedDate);
      const todayWeekStart = startOfWeek(today);
      shouldAnimate =
        format(selectedWeekStart, 'yyyy-MM-dd') !== format(todayWeekStart, 'yyyy-MM-dd');
    } else {
      const selectedMonth = format(currentSelectedDate, 'yyyy-MM');
      const todayMonth = format(today, 'yyyy-MM');
      shouldAnimate = selectedMonth !== todayMonth;
    }

    if (shouldAnimate) {
      const direction = today > currentSelectedDate ? -1 : 1;
      horizontalSlide.value = withTiming(direction * CONSTANTS.ANIMATION.SLIDE_DISTANCE, {
        duration: CONSTANTS.ANIMATION.DURATION,
        easing: CONSTANTS.ANIMATION.EASING,
      });

      setTimeout(() => {
        setSelectedDate(todayId);
        setCurrentDate(today);
        horizontalSlide.value = -direction * CONSTANTS.ANIMATION.SLIDE_DISTANCE;
        horizontalSlide.value = withTiming(0, {
          duration: CONSTANTS.ANIMATION.DURATION,
          easing: CONSTANTS.ANIMATION.EASING,
        });
      }, CONSTANTS.ANIMATION.DURATION);
    } else {
      setSelectedDate(todayId);
      setCurrentDate(today);
    }
  }, [selectedDate, todayId, isWeekView, horizontalSlide, today]);

  const handlePrev = useCallback(() => {
    animateHorizontalSlide(0, CONSTANTS.ANIMATION.SLIDE_DISTANCE, () => {
      if (isWeekView) {
        const prevWeek = subWeeks(currentDate, 1);
        setCurrentDate(prevWeek);
        const prevWeekStart = startOfWeek(prevWeek);
        setSelectedDate(toDateId(prevWeekStart));
      } else {
        const prevMonth = subMonths(currentDate, 1);
        setCurrentDate(prevMonth);
        const firstDayOfMonth = startOfMonth(prevMonth);
        setSelectedDate(toDateId(firstDayOfMonth));
      }
    });
  }, [animateHorizontalSlide, isWeekView, currentDate]);

  const handleNext = useCallback(() => {
    animateHorizontalSlide(0, -CONSTANTS.ANIMATION.SLIDE_DISTANCE, () => {
      if (isWeekView) {
        const nextWeek = addWeeks(currentDate, 1);
        setCurrentDate(nextWeek);
        const nextWeekStart = startOfWeek(nextWeek);
        setSelectedDate(toDateId(nextWeekStart));
      } else {
        const nextMonth = addMonths(currentDate, 1);
        setCurrentDate(nextMonth);
        const firstDayOfMonth = startOfMonth(nextMonth);
        setSelectedDate(toDateId(firstDayOfMonth));
      }
    });
  }, [animateHorizontalSlide, isWeekView, currentDate]);

  const toggleViewMode = useCallback(() => {
    if (isWeekView) {
      const selectedDateObj = fromDateId(selectedDate);
      setCurrentDate(startOfMonth(selectedDateObj));
    } else {
      const selectedDateObj = fromDateId(selectedDate);
      const selectedWeekStart = startOfWeek(selectedDateObj);
      setCurrentDate(selectedWeekStart);
    }
    setIsWeekView(!isWeekView);
  }, [isWeekView, selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar.VStack>
          {/* Calendar header */}
          <CalendarHeader
            calendarRowMonth={calendarRowMonth}
            onPrev={handlePrev}
            onNext={handleNext}
            onReset={handleReset}
            isToday={selectedDate === todayId}
          />

          {/* Week days header */}
          <WeekdaysHeader weekDaysList={weekDaysList} />

          {/* Calendar days */}
          <Animated.View style={[styles.animatedContainer, animatedStyle]}>
            <View style={styles.daysContainer}>
              <Animated.View style={[styles.animatedContainer, weekRowAnimatedStyle]}>
                {visibleWeeks.map((week) => (
                  <CalendarWeek
                    key={week[0]?.id || Math.random()}
                    week={week}
                    isWeekView={isWeekView}
                    calendarTheme={calendarTheme}
                    onDatePress={handleDatePress}
                  />
                ))}
              </Animated.View>
            </View>

            {/* View toggle button */}
            <TouchableOpacity
              onPress={toggleViewMode}
              style={styles.toggleButton}
              activeOpacity={0.7}>
              <Text style={styles.navButtonText}>{isWeekView ? '∨' : '∧'} </Text>
            </TouchableOpacity>
          </Animated.View>
        </Calendar.VStack>
      </View>
    </View>
  );
}

// Helper function to create calendar theme
function createCalendarTheme(selectedDate, todayId) {
  return {
    itemDay: {
      // Base style for all days
      base: () => ({
        container: {
          borderRadius: CONSTANTS.CALENDAR.BORDER_RADIUS,
        },
      }),

      // Style for the active days in the week range
      active: (params) => {
        const { isEndOfRange, isStartOfRange, id, isPressed } = params;
        const isSelected = id === selectedDate;
        const isToday = id === todayId;

        if (isSelected) {
          return {
            container: {
              borderRadius: CONSTANTS.CALENDAR.SELECTED_BORDER_RADIUS,
              backgroundColor: CONSTANTS.COLORS.primary,
            },
            content: {
              color: CONSTANTS.COLORS.white,
              fontWeight: 'bold',
            },
          };
        }

        if (isToday) {
          return {
            container: {
              borderColor: CONSTANTS.COLORS.primary,
              borderWidth: 1,
              backgroundColor: CONSTANTS.COLORS.primaryLight,
              borderRadius: CONSTANTS.CALENDAR.TODAY_BORDER_RADIUS,
              borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
              borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
              borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
              borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            },
            content: {
              color: isPressed ? CONSTANTS.COLORS.white : CONSTANTS.COLORS.primary,
              fontWeight: 'bold',
            },
          };
        }

        return {
          container: {
            backgroundColor: CONSTANTS.COLORS.primaryLight,
            borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
          },
          content: {
            color: isPressed ? CONSTANTS.COLORS.white : CONSTANTS.COLORS.primary,
            fontWeight: 'bold',
          },
        };
      },

      // Style for today
      today: (params) => {
        const { isPressed } = params;
        return {
          container: {
            borderColor: CONSTANTS.COLORS.primary,
            borderWidth: 1,
            borderRadius: CONSTANTS.CALENDAR.TODAY_BORDER_RADIUS,
            backgroundColor: isPressed ? CONSTANTS.COLORS.primary : 'transparent',
          },
          content: {
            color: isPressed ? CONSTANTS.COLORS.white : CONSTANTS.COLORS.primary,
            fontWeight: 'bold',
          },
        };
      },

      idle: (params) => {
        const { isDifferentMonth, id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: {
              backgroundColor: CONSTANTS.COLORS.primary,
              borderRadius: CONSTANTS.CALENDAR.BORDER_RADIUS,
            },
            content: {
              color: CONSTANTS.COLORS.white,
              fontWeight: 'bold',
            },
          };
        }

        return {
          content: isDifferentMonth
            ? {
                color: CONSTANTS.COLORS.textFaded,
              }
            : undefined,
        };
      },
    },
  };
}

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: CONSTANTS.COLORS.background,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONSTANTS.COLORS.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONSTANTS.COLORS.primary,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: CONSTANTS.COLORS.buttonBackground,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: CONSTANTS.COLORS.primary,
  },
  weekDaysRow: {
    marginBottom: 8,
  },
  daysContainer: {
    overflow: 'hidden',
  },
  animatedContainer: {
    width: '100%',
  },
  weekRow: {
    marginBottom: 4,
  },
  toggleButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: CONSTANTS.COLORS.buttonBackground,
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: CONSTANTS.COLORS.white,
    fontSize: 50,
  },
});
