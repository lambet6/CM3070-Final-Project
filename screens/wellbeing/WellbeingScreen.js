/**
 * WellbeingScreen
 *
 * Primary wellbeing tracking interface that allows users to record their daily mood
 * and view correlations between mood and task completion over time.
 *
 * Features:
 * - Daily mood tracking with emoji-based selection (Very sad to Very happy)
 * - 14-day visualization chart comparing mood and completed tasks
 * - Dark/light theme toggle for user preference
 * - Single mood entry per day with ability to update until midnight
 * - Optimistic UI updates for immediate feedback
 *
 * UX enhancements:
 * - Visual indicators for current mood selection
 * - Haptic feedback for mood selection
 * - Clear loading and error states
 * - Accessibility support with proper labels
 * - Responsive layout with theme-aware styling
 */

import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useWellbeingStore } from '../../store/wellbeingStore';
import { useWellbeingManager } from '../../hooks/useWellbeingManager';
import { useTaskStore } from '../../store/taskStore';
import { moodValues } from './constants';
import {
  Surface,
  Text,
  ActivityIndicator,
  useTheme,
  IconButton,
  Card,
  Divider,
  Switch,
} from 'react-native-paper';
import MoodTasksChart from './components/MoodTaskChart';
import * as Haptics from 'expo-haptics';
import { PreferencesContext } from '../../Preferences';

export default function WellbeingScreen() {
  // State and store hooks
  const { moodData, error, isLoading } = useWellbeingStore();
  const wellbeingManager = useWellbeingManager();
  const taskStore = useTaskStore();
  const [todayMood, setTodayMood] = useState(null);
  const { toggleTheme, isThemeDark } = useContext(PreferencesContext);

  // Chart data state
  const [chartData, setChartData] = useState({
    mood: { labels: [], data: [] },
    tasks: { data: [] },
  });

  const theme = useTheme();
  const styles = createStyles(theme);

  // Initial data loading
  useEffect(() => {
    loadMoodData();
  }, []);

  // Update UI when mood data changes
  useEffect(() => {
    const todayEntry = moodData.find((entry) => entry.isToday());
    setTodayMood(todayEntry ? todayEntry.mood : null);
    updateChartData();
  }, [moodData]);

  /**
   * Loads mood data from storage via the wellbeing manager
   */
  const loadMoodData = () => {
    try {
      wellbeingManager.getMoodData();
    } catch (error) {
      // Error handling is managed in the store
    }
  };

  /**
   * Updates the 14-day chart data with mood and task completion information
   */
  const updateChartData = useCallback(() => {
    // Get mood data for the last 14 days
    const moodChartData = wellbeingManager.getLast14DaysMoodData();

    // Get task completion data for the same dates
    const taskCounts = taskStore.getCompletedTasksCountByDates(
      moodChartData.labels.map((label) => new Date(label)),
    );

    setChartData({
      mood: moodChartData,
      tasks: { data: taskCounts },
    });
  }, [wellbeingManager, taskStore]);

  /**
   * Handles mood selection and performs haptic feedback
   */
  const handleMoodSelection = (moodValue) => {
    // Optimistic UI update
    setTodayMood(moodValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      wellbeingManager.saveMood(moodValue);
    } catch (error) {
      // Revert UI if save fails
      const todayEntry = moodData.find((entry) => entry.isToday());
      setTodayMood(todayEntry ? todayEntry.mood : null);
    }
  };

  /**
   * Renders the mood selection buttons based on available mood values
   */
  const renderMoodButtons = () => {
    return Object.entries(moodValues).map(([key, [label, icon]]) => (
      <IconButton
        key={key}
        icon={icon}
        mode={todayMood === label ? 'contained' : 'outlined'}
        size={30}
        onPress={() => handleMoodSelection(label)}
        style={styles.moodButton}
        iconColor={todayMood === label ? theme.colors.background : theme.colors.primary}
        containerColor={todayMood === label ? theme.colors.primary : 'transparent'}
        disabled={isLoading}
        accessibilityLabel={`Select mood: ${label}`}
      />
    ));
  };

  return (
    <View testID="wellbeing-screen" style={styles.container}>
      <View style={styles.intro}>
        <View style={styles.header}>
          <View style={styles.themeToggleContainer}>
            <IconButton icon="white-balance-sunny" size={20} iconColor={theme.colors.onSurface} />
            <Switch
              testID="theme-toggle"
              value={isThemeDark}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
            <IconButton icon="weather-night" size={20} iconColor={theme.colors.onSurface} />
          </View>
        </View>

        {/* Error and Loading States */}
        {error && (
          <View testID="error-container" style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator testID="loading-indicator" style={styles.indicator} />
            <Text style={styles.loadingText}>Loading wellbeing data...</Text>
          </View>
        )}
      </View>

      {/* Daily Mood Entry Section */}
      <Card style={styles.moodCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.moodTitle}>
            How are you feeling today?
          </Text>

          {todayMood ? (
            <Text variant="labelLarge" style={styles.todayMoodText}>
              {todayMood}
            </Text>
          ) : (
            <Text style={styles.todayMoodText}>You haven't recorded your mood today</Text>
          )}

          <Divider style={styles.divider} />

          <Text variant="bodyMedium" style={styles.moodInstructions}>
            Select an emoji that best represents your mood:
          </Text>

          <View style={styles.moodButtonContainer}>{renderMoodButtons()}</View>
        </Card.Content>
      </Card>

      {/* Mood & Tasks Chart */}
      <MoodTasksChart
        testID="mood-tasks-chart"
        moodData={chartData.mood}
        taskData={chartData.tasks}
      />
    </View>
  );
}

/**
 * Creates styles for the component based on the current theme
 */
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    intro: {
      paddingTop: 10,
      marginBottom: 16,
    },
    header: {
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    headerText: {
      textAlign: 'center',
    },
    themeToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    errorContainer: {
      padding: 16,
    },
    errorText: {
      color: theme.colors.error,
    },
    loading: {
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    indicator: {
      marginRight: 8,
    },
    loadingText: {
      color: theme.colors.secondary,
    },
    moodCard: {
      marginBottom: 16,
    },
    moodTitle: {
      marginBottom: 8,
    },
    todayMoodText: {
      marginBottom: 16,
    },
    divider: {
      marginBottom: 16,
    },
    moodInstructions: {
      marginBottom: 16,
    },
    moodButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    moodButton: {
      margin: 8,
    },
  });
