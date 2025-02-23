/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { addDays } from 'date-fns';
import WellbeingScreen from '../../../screens/WellbeingScreen';
import { Mood } from '../../../domain/Mood';
import { isSameDay } from 'date-fns';

// Mock the chart component
let lastChartProps = null;
jest.mock('react-native-chart-kit', () => ({
  LineChart: (props) => {
    lastChartProps = props;
    return 'LineChart';
  },
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// Mock the store
const mockAddMood = jest.fn();
const mockLoadMoodData = jest.fn();

jest.mock('../../../store/wellbeingStore', () => ({
  useWellbeingStore: () => ({
    moodData: [],
    addMood: mockAddMood,
    loadMoodData: mockLoadMoodData,
    getLast14DaysMoodData: () => ({ labels: [], data: [] }),
  }),
}));

describe('WellbeingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Screen Rendering', () => {
    it('renders basic UI elements', () => {
      const { getByTestId, getByText } = render(<WellbeingScreen />);

      expect(getByTestId('wellbeing-screen')).toBeTruthy();
      expect(getByText('Track your mood and tasks completed over time')).toBeTruthy();
      expect(getByText('How are you feeling today?')).toBeTruthy();
    });

    it('renders all mood buttons', () => {
      const { getByTestId } = render(<WellbeingScreen />);

      ['Very low', 'Low', 'Neutral', 'Happy', 'Very happy'].forEach((mood) => {
        expect(getByTestId(`mood-button-${mood.toLowerCase()}`)).toBeTruthy();
        expect(getByTestId(`mood-text-${mood.toLowerCase()}`)).toBeTruthy();
      });
    });
  });

  describe('Mood Operations', () => {
    it('updates UI when a mood button is pressed', () => {
      let storeState = {
        moodData: [],
        addMood: () => {
          storeState.moodData = [new Mood({ mood: 'Happy', date: new Date() })];
        },
        loadMoodData: jest.fn(),
        getLast14DaysMoodData: () => ({ labels: [], data: [] }),
      };
      jest
        .spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore')
        .mockImplementation(() => storeState);

      const { getByTestId, rerender } = render(<WellbeingScreen />);
      const happyButton = getByTestId('mood-button-happy');
      expect(happyButton).toHaveStyle({ backgroundColor: '#ddd' });

      fireEvent.press(happyButton);
      rerender(<WellbeingScreen />);
      expect(getByTestId('mood-button-happy')).toHaveStyle({ backgroundColor: '#ffa726' });
    });

    it('highlights selected mood for today', () => {
      jest.spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore').mockReturnValue({
        moodData: [new Mood({ mood: 'Happy', date: new Date() })],
        addMood: jest.fn(),
        loadMoodData: jest.fn(),
        getLast14DaysMoodData: () => ({ labels: [], data: [] }),
      });

      const { getByTestId } = render(<WellbeingScreen />);
      expect(getByTestId('mood-button-happy')).toHaveStyle({
        backgroundColor: '#ffa726',
      });
    });
  });

  describe('Chart Display', () => {
    it('displays mood chart when mood data exists', () => {
      jest.spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore').mockReturnValue({
        moodData: [new Mood({ mood: 'Happy', date: new Date() })],
        addMood: jest.fn(),
        loadMoodData: jest.fn(),
        getLast14DaysMoodData: () => ({ labels: ['2024-01-01'], data: [4] }),
      });

      const { getByTestId } = render(<WellbeingScreen />);
      expect(getByTestId('mood-chart')).toBeTruthy();
    });

    it('correctly displays mood data across multiple days', () => {
      const startDate = new Date('2024-01-01');
      const mockDates = Array.from({ length: 4 }, (_, i) => addDays(startDate, i));

      let moodDataStore = [];
      const mockStore = {
        get moodData() {
          return moodDataStore;
        },
        addMood: (mood) => {
          moodDataStore = [
            ...moodDataStore.filter((m) => !isSameDay(m.date, new Date(currentMockDate))),
            new Mood({ mood, date: currentMockDate }),
          ];
        },
        loadMoodData: jest.fn(),
        getLast14DaysMoodData: () => {
          const moodToValue = {
            'Very low': 1,
            Low: 2,
            Neutral: 3,
            Happy: 4,
            'Very happy': 5,
          };

          return {
            labels: mockDates,
            data: mockDates.map((date) => {
              const entry = moodDataStore.find((m) => isSameDay(m.date, date));
              return entry ? moodToValue[entry.mood] : 0;
            }),
          };
        },
      };

      let currentMockDate = mockDates[0].toISOString();
      jest
        .spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore')
        .mockImplementation(() => mockStore);

      const { getByTestId, rerender } = render(<WellbeingScreen />);

      // Simulate mood selections across different days
      currentMockDate = mockDates[0];
      fireEvent.press(getByTestId('mood-button-low'));
      rerender(<WellbeingScreen />);

      currentMockDate = mockDates[1];
      fireEvent.press(getByTestId('mood-button-very happy'));
      rerender(<WellbeingScreen />);

      currentMockDate = mockDates[2];
      rerender(<WellbeingScreen />);

      currentMockDate = mockDates[3];
      fireEvent.press(getByTestId('mood-button-neutral'));
      rerender(<WellbeingScreen />);

      expect(lastChartProps).toBeTruthy();
      expect(lastChartProps.data).toEqual({
        labels: ['1 Jan', '2', '4'],
        datasets: [
          {
            data: [2, 5, 3],
          },
        ],
      });

      expect(lastChartProps.width).toBeTruthy();
      expect(lastChartProps.height).toBe(220);
      expect(lastChartProps.chartConfig).toBeTruthy();
    });
  });
});
