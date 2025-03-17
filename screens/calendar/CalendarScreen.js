/*global setTimeout*/
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, useCalendar, toDateId, fromDateId } from '@marceloterreiro/flash-calendar';
import {
  startOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  addWeeks,
  subWeeks,
  subMonths,
  addMonths,
} from 'date-fns';
import Animated, { withTiming } from 'react-native-reanimated';

// Import components, styles, and hooks
import { useCalendarStore } from '../../store/calendarStore';
import { useCalendarManager } from '../../hooks/useCalendarManager';
import { useTaskStore } from '../../store/taskStore';
import { CalendarHeader } from './components/CalendarHeader';
import { WeekdaysHeader } from './components/WeekdaysHeader';
import { CalendarWeek } from './components/CalendarWeek';
import { CONSTANTS } from './CalendarConstants';
import { styles } from './CalendarStyles';
import { createCalendarTheme } from './CalendarTheme';
import { useCalendarAnimations } from './hooks/useCalendarAnimations';
import TaskReorderableList from './components/TaskReorderableList';

const today = new Date();

export default function CalenarScreen() {
  // Get state from store using selector pattern
  const events = useCalendarStore((state) => state.events);
  const error = useCalendarStore((state) => state.error);
  const isLoading = useCalendarStore((state) => state.isLoading);

  // Get manager functions
  const calendarManager = useCalendarManager();

  // Get tasks from task store
  const tasks = useTaskStore((state) => state.tasks);
  const taskError = useTaskStore((state) => state.error);

  const isProcessingDateSelection = useRef(false);

  // Load calendar events on component mount
  useEffect(() => {
    calendarManager.loadYearlyCalendarEvents();
    console.log('loadYearlyCalendarEvents');
  }, [calendarManager]);

  // Log events when they change
  useEffect(() => {
    console.log('events changed');
  }, [events]);

  // State management
  const todayId = toDateId(today);
  const [selectedDate, setSelectedDate] = useState(todayId);
  const [isWeekView, setIsWeekView] = useState(true);
  const [currentDate, setCurrentDate] = useState(today);

  // Get animations
  const { animatedStyle, weekRowAnimatedStyle, animateHorizontalSlide, horizontalSlide } =
    useCalendarAnimations(isWeekView);

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
      // Prevent multiple rapid selections
      if (isProcessingDateSelection.current) return;
      isProcessingDateSelection.current = true;

      // Update the selection immediately for UI feedback
      setSelectedDate(dateId);

      if (isWeekView) {
        const selectedDateObj = fromDateId(dateId);
        const weekStart = startOfWeek(selectedDateObj);
        setCurrentDate(weekStart);
      }

      // Reset the processing flag after a short delay
      setTimeout(() => {
        isProcessingDateSelection.current = false;
      }, 100);
    },
    [isWeekView],
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
  }, [selectedDate, todayId, isWeekView, horizontalSlide]);

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

  // // New function to create an event using the manager
  // const handleCreateEvent = useCallback(
  //   async (title, startDate, endDate) => {
  //     try {
  //       const newEvent = await calendarManager.createCalendarEvent(title, startDate, endDate);
  //       console.log('New event created:', newEvent);
  //       return newEvent;
  //     } catch (error) {
  //       console.error('Failed to create event:', error);
  //       // Error handling UI logic could go here
  //       return null;
  //     }
  //   },
  //   [calendarManager],
  // );

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Text>Loading calendar events...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.calendar}>
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
                  {visibleWeeks.map((week) => {
                    const weekKey = week.map((day) => day.id).join('-');
                    return (
                      <CalendarWeek
                        key={weekKey}
                        week={week}
                        isWeekView={isWeekView}
                        calendarTheme={calendarTheme}
                        onDatePress={handleDatePress}
                        events={events}
                        tasks={tasks}
                        selectedDate={selectedDate}
                      />
                    );
                  })}
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
      <View style={styles.dragList}>
        <TaskReorderableList selectedDate={selectedDate} />
      </View>
    </View>
  );
}
