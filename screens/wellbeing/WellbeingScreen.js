import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
} from 'react-native-paper';
import MoodTasksChart from './components/MoodTaskChart';
import * as Haptics from 'expo-haptics';

export default function WellbeingScreen() {
  const { moodData, error, isLoading } = useWellbeingStore();
  const wellbeingManager = useWellbeingManager();
  const taskStore = useTaskStore();
  const [todayMood, setTodayMood] = useState(null);

  const [chartData, setChartData] = useState({
    mood: { labels: [], data: [] },
    tasks: { data: [] },
  });

  const theme = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    loadMoodData();
  }, []);

  useEffect(() => {
    // Find today's mood entry if it exists
    const todayEntry = moodData.find((entry) => entry.isToday());
    setTodayMood(todayEntry ? todayEntry.mood : null);

    // Update chart data whenever mood data changes
    updateChartData();
  }, [moodData]);

  const loadMoodData = () => {
    try {
      wellbeingManager.getMoodData();
    } catch (error) {
      // Error is already handled in the manager and store
    }
  };

  const handleMoodSelection = (moodValue) => {
    // Optimistic update - update UI immediately
    setTodayMood(moodValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Then perform the actual save operation
      wellbeingManager.saveMood(moodValue);
    } catch (error) {
      // Revert to previous state if save fails
      const todayEntry = moodData.find((entry) => entry.isToday());
      setTodayMood(todayEntry ? todayEntry.mood : null);
    }
  };

  const updateChartData = useCallback(() => {
    // Get mood data for the last 14 days
    const moodChartData = wellbeingManager.getLast14DaysMoodData();

    // Get actual task completion data for the corresponding dates
    const taskCounts = taskStore.getCompletedTasksCountByDates(
      moodChartData.labels.map((label) => new Date(label)),
    );

    const taskData = {
      data: taskCounts,
    };

    setChartData({
      mood: moodChartData,
      tasks: taskData,
    });
  }, [wellbeingManager, taskStore]);

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
          <Text style={styles.headerText} variant="titleMedium">
            Track your mood over time
          </Text>
        </View>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator style={styles.indicator} />
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
      <MoodTasksChart moodData={chartData.mood} taskData={chartData.tasks} />
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    intro: {
      paddingTop: 20,
      marginBottom: 16,
    },
    header: {
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    headerText: {
      textAlign: 'center',
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
