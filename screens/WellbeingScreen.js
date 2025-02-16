import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWellbeingStore } from '../store/wellbeingStore';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const moods = ['Very low', 'Low', 'Neutral', 'Happy', 'Very happy'];

export default function WellbeingScreen() {
  const { moodData, addMood, loadMoodData } = useWellbeingStore();

  useEffect(() => {
    loadMoodData();
  }, []);

  useEffect(() => {
    console.log('Mood Data:', moodData);
    if (moodData.length > 0) {
      console.log('LineChart Data:', {
        labels: moodData.map((_, index) => index.toString()),
        datasets: [
          {
            data: moodData.map((entry) => entry.moodValue),
          },
        ],
      });
    }
  }, [moodData]);

  const handleMoodPress = (mood) => {
    addMood(mood);
  };

  return (
    <View testID="wellbeing-screen" style={styles.container}>
      <Text style={styles.title}>Track your mood and tasks completed over time</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>
      <View style={styles.moodContainer}>
        {moods.map((mood, index) => (
          <TouchableOpacity key={index} onPress={() => handleMoodPress(mood)}>
            <Text style={styles.moodText}>{mood}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {moodData.length > 0 && (
        <LineChart
          data={{
            labels: moodData.map((_, index) => index.toString()),
            datasets: [
              {
                data: moodData.map((entry) => entry.moodValue),
              },
            ],
          }}
          width={Dimensions.get('window').width - 16}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
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
    marginVertical: 16,
  },
  moodText: {
    fontSize: 14,
  },
});