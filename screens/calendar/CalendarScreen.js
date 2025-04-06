/**
 * CalendarScreen
 *
 * A calendar view that integrates device calendar events with app tasks,
 * providing both weekly and monthly views with an interactive daily timeline.
 *
 * Features:
 * - Toggleable weekly/monthly calendar views
 * - Two-way sync with device calendar
 * - Interactive timeline for daily task scheduling and viewing
 * - Task drag-and-drop reordering within the daily timeline
 * - Visual distinction between fixed calendar events and movable tasks
 * - Auto-scheduling capability
 *
 * UX enhancements:
 * - Visual indicators for today and selected dates
 * - Animated navigation between weeks/months
 * - Responsive FAB for triggering auto-scheduling
 * - Accessibility features for screen readers
 */

/*global setTimeout*/
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
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
import {
  Surface,
  ActivityIndicator,
  Text,
  useTheme,
  IconButton,
  AnimatedFAB,
  Snackbar,
} from 'react-native-paper';

// Components
import { CalendarHeader } from './components/CalendarHeader';
import { WeekdaysHeader } from './components/WeekdaysHeader';
import { CalendarWeek } from './components/CalendarWeek';
import TimelineComponent from './components/Timeline/Timeline';

// Hooks and stores
import { useCalendarStore } from '../../store/calendarStore';
import { useCalendarManager } from '../../hooks/useCalendarManager';
import { useTaskStore } from '../../store/taskStore';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useAutoSchedulingManager } from '../../hooks/useAutoSchedulingManager';
import { useCalendarAnimations } from './hooks/useCalendarAnimations';

// Constants and styles
import { CONSTANTS } from './CalendarConstants';
import { styles } from './CalendarStyles';
import { createCalendarTheme } from './CalendarTheme';

const today = new Date();

export default function CalenarScreen() {
  // Store state
  const events = useCalendarStore((state) => state.events);
  const error = useCalendarStore((state) => state.error);
  const isLoading = useCalendarStore((state) => state.isLoading);
  const tasks = useTaskStore((state) => state.tasks);
  const taskError = useTaskStore((state) => state.error);

  // Managers
  const calendarManager = useCalendarManager();
  const taskManager = useTaskManager();
  const autoSchedulingManager = useAutoSchedulingManager();

  // Local state
  const todayId = toDateId(today);
  const [selectedDate, setSelectedDate] = useState(todayId);
  const [isWeekView, setIsWeekView] = useState(true);
  const [currentDate, setCurrentDate] = useState(today);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Refs
  const isProcessingDateSelection = useRef(false);

  // Theme
  const theme = useTheme();

  // Animations
  const { animatedStyle, weekRowAnimatedStyle, animateHorizontalSlide, horizontalSlide } =
    useCalendarAnimations(isWeekView);

  // Derived state
  const memoizedSelectedDateObj = useMemo(() => fromDateId(selectedDate), [selectedDate]);

  // Calculate active date ranges for calendar
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

  // Initialize calendar
  const { calendarRowMonth, weekDaysList, weeksList } = useCalendar({
    calendarMonthId: toDateId(currentDate),
    calendarActiveDateRanges: activeDateRanges,
  });

  // Define calendar theme based on current state
  const calendarTheme = useMemo(
    () => createCalendarTheme(selectedDate, todayId, theme),
    [selectedDate, todayId, theme],
  );

  // Filter weeks based on view mode (week or month)
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

  // Load calendar events on component mount
  useEffect(() => {
    calendarManager.loadYearlyCalendarEvents();
  }, [calendarManager]);

  // Handle date selection
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

  // Reset to today's date
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

  // Navigate to previous week/month
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

  // Navigate to next week/month
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

  // Toggle between week and month view
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

  // Clear all scheduled tasks for the selected date
  const clearSchedule = useCallback(() => {
    taskManager.clearSchedulesForDate(memoizedSelectedDateObj);
  }, [taskManager, memoizedSelectedDateObj]);

  // Auto-schedule tasks for the selected date
  const autoSchedule = useCallback(async () => {
    try {
      await autoSchedulingManager.generateScheduleForDate(memoizedSelectedDateObj);
      setSnackbarMessage('Schedule successfully generated');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage(`Auto scheduling failed: ${error.message || 'Unknown error'}`);
      setSnackbarVisible(true);
    }
  }, [autoSchedulingManager, memoizedSelectedDateObj]);

  // Dismiss snackbar
  const onDismissSnackbar = () => setSnackbarVisible(false);

  return (
    <View style={styles.container}>
      <Surface style={styles.calendarContainer}>
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator animating={true} />
            <Text style={styles.loadingIndicatorText}>Loading calendar events...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Surface mode="flat" style={styles.calendar}>
          <Calendar.VStack>
            {/* Calendar header with navigation controls */}
            <CalendarHeader
              calendarRowMonth={calendarRowMonth}
              onPrev={handlePrev}
              onNext={handleNext}
              onReset={handleReset}
              isToday={selectedDate === todayId}
            />

            {/* Weekday labels */}
            <WeekdaysHeader weekDaysList={weekDaysList} theme={theme} />

            {/* Calendar grid */}
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

              {/* View toggle button (week/month) */}
              <IconButton
                selected={true}
                style={styles.toggleButton}
                icon={isWeekView ? 'chevron-down' : 'chevron-up'}
                size={20}
                onPress={toggleViewMode}
                accessibilityLabel="Toggle calendar view"
                accessibilityHint={`Switch to ${isWeekView ? 'monthly' : 'weekly'} calendar`}
              />
            </Animated.View>
          </Calendar.VStack>
        </Surface>
      </Surface>

      {/* Daily timeline view */}
      <View style={styles.dragList}>
        <TimelineComponent selectedDate={memoizedSelectedDateObj} setIsScrolled={setIsScrolled} />
      </View>

      {/* Floating action button for auto-scheduling */}
      <AnimatedFAB
        variant={'primary'}
        icon={'creation'}
        label={'Auto schedule'}
        extended={isScrolled}
        onPress={autoSchedule}
        style={styles.fab}
      />

      {/* Notification snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={onDismissSnackbar}
        action={{
          label: 'Dismiss',
          onPress: onDismissSnackbar,
        }}
        duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}
