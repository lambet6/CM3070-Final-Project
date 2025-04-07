import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Circle, Rect } from 'react-native-svg';

/**
 * MoodTasksChart - Displays a correlation chart between user mood and completed tasks
 *
 * @param {Object} moodData - Object containing mood data with labels and data arrays
 * @param {Object} taskData - Object containing task completion data with data array
 * @returns {JSX.Element} A chart comparing mood ratings and task completion over time
 */
const MoodTasksChart = ({ moodData, taskData }) => {
  const theme = useTheme();
  // Calculate available width accounting for container padding
  const screenWidth = Dimensions.get('window').width - 32;

  // Get indices of days that have valid mood entries (value > 0)
  const validIndices = moodData.data
    .map((value, index) => (value > 0 ? index : -1))
    .filter((index) => index !== -1);

  // Filter data to only include days with valid mood entries
  const filteredLabels = validIndices.map((index) => moodData.labels[index]);
  const filteredMoodData = validIndices.map((index) => moodData.data[index]);
  const filteredTaskData = validIndices.map((index) => taskData.data[index]);

  // Convert date strings to DD/MM format for better readability
  const formattedLabels = filteredLabels.map((label) => {
    const date = new Date(label);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  // Prepare datasets for the chart visualization
  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        data: filteredMoodData,
        color: (opacity = 1) => theme.colors.primary + opacity,
        strokeWidth: 2,
      },
      {
        data: filteredTaskData,
        color: (opacity = 1) => theme.colors.tertiary + opacity,
        strokeWidth: 2,
      },
    ],
    legend: ['Mood', 'Tasks'],
  };

  // Chart styling and configuration
  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.onSurface + opacity,
    labelColor: (opacity = 1) => theme.colors.onSurface + opacity,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.surface,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  // Determine if we have data to display
  const hasValidData = formattedLabels.length > 0;

  return (
    <Card mode="contained" style={styles.chartCard}>
      <Card.Content>
        <Text variant="headlineSmall" style={styles.chartTitle}>
          Mood & Tasks Completed
        </Text>
        <Text variant="bodyMedium" style={styles.chartDescription}>
          Compare your mood against the number of tasks you complete each day
        </Text>

        {!hasValidData ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No mood data recorded yet. Try recording your mood for a few days.
            </Text>
          </View>
        ) : (
          <View
            style={styles.chartContainer}
            accessible={true}
            accessibilityLabel="Chart showing mood ratings and tasks completed over the last 14 days"
            accessibilityHint="Displays correlation between your mood and productivity">
            <LineChart
              testID="line-chart"
              data={chartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              fromZero
              yAxisSuffix=""
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

/**
 * Component styles
 */
const styles = StyleSheet.create({
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 8,
  },
  chartDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default MoodTasksChart;
