/*global jest*/
import React from 'react';
import { describe, it, beforeEach, expect } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { isSameDay, addDays } from 'date-fns';
import WellbeingScreen from '../../../screens/WellbeingScreen';
import { createSampleMoods } from '../../fixtures/wellbeing-fixtures';
import { Mood } from '../../../domain/Mood';

describe('WellbeingScreen', () => {
  let moods;
  let mockStore;

  beforeEach(() => {
    moods = createSampleMoods();

    // Setup mock store state
    mockStore = {
      moodData: [],
      addMood: jest.fn(),
      loadMoodData: jest.fn(),
      getLast14DaysMoodData: jest.fn().mockReturnValue({ labels: [], data: [] }),
    };

    // Mock the store hook
    jest
      .spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore')
      .mockImplementation((selector) => {
        return selector ? selector(mockStore) : mockStore;
      });
  });

  describe('Mood Operations', () => {
    it('renders all mood buttons', () => {
      const { getByTestId } = render(<WellbeingScreen />);

      const moodButtons = [
        'mood-button-very low',
        'mood-button-low',
        'mood-button-neutral',
        'mood-button-happy',
        'mood-button-very happy',
      ];

      // Check all mood buttons are rendered
      moodButtons.forEach((buttonId) => {
        expect(getByTestId(buttonId)).toBeTruthy();
      });
    });

    it('updates UI when a mood button is pressed', () => {
      // Setup store to handle mood updates
      mockStore.addMood = jest.fn().mockImplementation((mood) => {
        mockStore.moodData = [new Mood({ mood, date: new Date() })];
      });

      const { getByTestId, rerender } = render(<WellbeingScreen />);
      const happyButton = getByTestId('mood-button-happy');

      // Initially button should have default style
      expect(happyButton).toHaveStyle({ backgroundColor: '#ddd' });

      // Press the button to select mood
      fireEvent.press(happyButton);
      rerender(<WellbeingScreen />);

      // Button should now be highlighted
      expect(getByTestId('mood-button-happy')).toHaveStyle({ backgroundColor: '#ffa726' });
      expect(mockStore.addMood).toHaveBeenCalledWith('Happy');
    });

    it('highlights selected mood for today', () => {
      mockStore.moodData = [new Mood({ mood: 'Happy', date: new Date() })];

      const { getByTestId } = render(<WellbeingScreen />);
      expect(getByTestId('mood-button-happy')).toHaveStyle({
        backgroundColor: '#ffa726',
      });
    });
  });

  describe('Chart Display', () => {
    it('displays mood chart when mood data exists', () => {
      mockStore.moodData = moods.singleMood;
      mockStore.getLast14DaysMoodData = jest.fn().mockReturnValue({
        labels: ['2024-01-01'],
        data: [4],
      });

      const { getByTestId } = render(<WellbeingScreen />);
      expect(getByTestId('mood-chart')).toBeTruthy();
    });

    it('correctly displays mood data across multiple days', async () => {
      const startDate = new Date('2024-01-01');
      const mockDates = Array.from({ length: 4 }, (_, i) => addDays(startDate, i));

      // Setup store for multi-day testing
      let moodDataStore = [];
      let currentMockDate;

      mockStore.moodData = moodDataStore;
      mockStore.addMood = jest.fn().mockImplementation((mood) => {
        // Remove existing mood for the same day if any
        moodDataStore = [
          ...moodDataStore.filter((m) => !isSameDay(m.date, currentMockDate)),
          new Mood({ mood, date: currentMockDate }),
        ];
        mockStore.moodData = moodDataStore;
      });

      mockStore.getLast14DaysMoodData = jest.fn().mockImplementation(() => {
        // Map mood values to numeric values for the chart
        const moodToValue = {
          'Very low': 1,
          Low: 2,
          Neutral: 3,
          Happy: 4,
          'Very happy': 5,
        };

        return {
          labels: mockDates.map((d) => d.toISOString().slice(0, 10)),
          data: mockDates.map((date) => {
            const entry = moodDataStore.find((m) => isSameDay(m.date, date));
            return entry ? moodToValue[entry.mood] : 0;
          }),
        };
      });

      const { getByTestId, rerender } = render(<WellbeingScreen />);

      // Simulate mood selections on different days
      currentMockDate = mockDates[0];
      fireEvent.press(getByTestId('mood-button-low'));
      rerender(<WellbeingScreen />);

      currentMockDate = mockDates[1];
      fireEvent.press(getByTestId('mood-button-very happy'));
      rerender(<WellbeingScreen />);

      currentMockDate = mockDates[3];
      fireEvent.press(getByTestId('mood-button-neutral'));
      rerender(<WellbeingScreen />);

      // Verify chart data reflects selected moods
      const chartData = mockStore.getLast14DaysMoodData();
      expect(chartData.data).toContain(2); // Low
      expect(chartData.data).toContain(5); // Very happy
      expect(chartData.data).toContain(3); // Neutral

      // Chart should be visible
      expect(getByTestId('mood-chart')).toBeTruthy();
    });

    it('loads mood data on component mount', () => {
      render(<WellbeingScreen />);
      expect(mockStore.loadMoodData).toHaveBeenCalled();
    });
  });
});
