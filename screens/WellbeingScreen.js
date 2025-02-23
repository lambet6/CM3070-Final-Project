import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWellbeingStore } from '../store/wellbeingStore';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { moodValues } from '../utilities/constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

export default function WellbeingScreen() {
  const { moodData, addMood, loadMoodData, getLast14DaysMoodData } = useWellbeingStore();

  useEffect(() => {
    loadMoodData();
  }, [loadMoodData]);

  const handleMoodPress = (mood) => {
    addMood(mood);
  };

  const todayMood = moodData.find((entry) => entry.isToday())?.mood;

  const formatDate = (date, index, labels) => {
    const isFirstEntryOfMonth = index === 0 || format(labels[index - 1], 'M') !== format(date, 'M');

    return isFirstEntryOfMonth ? format(date, 'd MMM') : format(date, 'd');
  };

  const { labels, data } = getLast14DaysMoodData();

  // Filter out days with zero moodValue
  const filtered = labels
    .map((label, index) => ({ label, value: data[index] }))
    .filter((item) => item.value > 0);
  const finalLabels = filtered.map((item) => item.label);
  const finalData = filtered.map((item) => item.value);

  const shouldShowChart = finalData.length > 0;

  return (
    <View testID="wellbeing-screen" style={styles.container}>
      <Text testID="wellbeing-title" style={styles.title}>
        Track your mood and tasks completed over time
      </Text>
      <Text testID="mood-prompt" style={styles.subtitle}>
        How are you feeling today?
      </Text>
      <View testID="mood-buttons-container" style={styles.moodContainer}>
        {Object.values(moodValues).map((mood, index) => (
          <TouchableOpacity
            key={index}
            testID={`mood-button-${mood[0].toLowerCase()}`}
            onPress={() => handleMoodPress(mood[0])}
            style={todayMood === mood[0] ? styles.selectedMoodButton : styles.moodButton}>
            <MaterialCommunityIcons name={mood[1]} size={44} color="black" />
            <Text testID={`mood-text-${mood[0].toLowerCase()}`} style={styles.moodText}>
              {mood[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {shouldShowChart ? (
        <View testID="mood-chart">
          <LineChart
            testID="mood-line-chart"
            data={{
              labels: finalLabels.map((label, index) => formatDate(label, index, finalLabels)),
              datasets: [
                {
                  data: finalData,
                },
              ],
            }}
            width={Dimensions.get('window').width - 16}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            yLabelsOffset={5}
            yAxisInterval={1}
            xLabelsOffset={5}
            verticalLabelRotation={-45}
            formatYLabel={(value) => moodValues[value][0]}
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 0,
              propsForVerticalLabels: {
                margin: 20,
              },
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            style={{
              borderRadius: 16,
              paddingRight: 75,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    verticalAlign: 'center',
    marginVertical: 16,
  },
  moodButton: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    margin: 3,
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  selectedMoodButton: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    margin: 3,
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#ffa726',
  },
  moodText: {
    fontSize: 12,
  },
});
