/* global jest */
import React from 'react';
import { describe, beforeEach, expect, test } from '@jest/globals';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import WellbeingScreen from '../../../screens/wellbeing/WellbeingScreen';
import { useWellbeingStore } from '../../../store/wellbeingStore';
import { useWellbeingManager } from '../../../hooks/useWellbeingManager';
import { useTaskStore } from '../../../store/taskStore';
import { PreferencesContext } from '../../../Preferences';
import * as Haptics from 'expo-haptics';
import { createSampleMoods } from '../../fixtures/wellbeing-fixtures';

// Mock all required dependencies
jest.mock('../../../hooks/useWellbeingManager');
jest.mock('../../../store/wellbeingStore', () => ({
  useWellbeingStore: jest.fn(),
}));

jest.mock('../../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));
jest.mock('expo-haptics');
jest.mock('react-native-paper', () => {
  const originalModule = jest.requireActual('react-native-paper');
  return {
    ...originalModule,
    useTheme: jest.fn().mockReturnValue({
      colors: {
        background: '#121212',
        surface: '#292929',
        primary: '#BB86FC',
        onSurface: '#FFFFFF',
        onSurfaceVariant: '#DDDDDD',
        secondary: '#03DAC6',
        error: '#CF6679',
      },
    }),
  };
});

// Mock the chart component
jest.mock('../../../screens/wellbeing/components/MoodTaskChart', () => {
  return jest.fn().mockImplementation(({ testID, moodData, taskData }) => {
    return (
      <mock-mood-tasks-chart
        testID={testID}
        data-mood-labels={JSON.stringify(moodData.labels)}
        data-mood-data={JSON.stringify(moodData.data)}
        data-task-data={JSON.stringify(taskData.data)}
      />
    );
  });
});

describe('WellbeingScreen', () => {
  // Default mocked values
  const mockedMoodData = createSampleMoods().multipleDay;
  const todayMood = mockedMoodData.find((mood) => mood.isToday());

  // Setup default mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock store
    useWellbeingStore.mockReturnValue({
      moodData: mockedMoodData,
      error: null,
      isLoading: false,
    });

    // Mock wellbeing manager
    useWellbeingManager.mockReturnValue({
      getMoodData: jest.fn().mockResolvedValue(mockedMoodData),
      saveMood: jest.fn().mockImplementation((moodValue) => {
        return Promise.resolve({ mood: moodValue, date: new Date(), isToday: () => true });
      }),
      getLast14DaysMoodData: jest.fn().mockReturnValue({
        labels: ['2025-04-01', '2025-04-02'],
        data: [4, 5],
      }),
    });

    // Mock task store
    useTaskStore.mockReturnValue({
      getCompletedTasksCountByDates: jest.fn().mockReturnValue([3, 2]),
    });

    // Mock haptics
    Haptics.impactAsync.mockResolvedValue();
  });

  // Render with theme context
  const renderWithThemeContext = (ui, { isThemeDark = true, toggleTheme = jest.fn() } = {}) => {
    return render(
      <PreferencesContext.Provider value={{ isThemeDark, toggleTheme }}>
        {ui}
      </PreferencesContext.Provider>,
    );
  };

  test('renders correctly with mood data', async () => {
    const { getByTestId, getByText } = renderWithThemeContext(<WellbeingScreen />);

    // Check main container rendered
    expect(getByTestId('wellbeing-screen')).toBeTruthy();

    // Check mood prompt is displayed
    expect(getByText('How are you feeling today?')).toBeTruthy();

    // Check today's mood text
    if (todayMood) {
      expect(getByTestId('today-mood-text')).toHaveTextContent(todayMood.mood);
    } else {
      expect(getByTestId('today-mood-text')).toHaveTextContent(
        "You haven't recorded your mood today",
      );
    }

    // Check chart is rendered
    expect(getByTestId('mood-tasks-chart')).toBeTruthy();
  });

  test('displays loading indicator when loading', () => {
    // Override the default mock to show loading state
    useWellbeingStore.mockReturnValue({
      moodData: [],
      error: null,
      isLoading: true,
    });

    const { getByTestId } = renderWithThemeContext(<WellbeingScreen />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('displays error message when there is an error', () => {
    // Override the default mock to show error state
    const errorMessage = 'Failed to load wellbeing data';
    useWellbeingStore.mockReturnValue({
      moodData: [],
      error: errorMessage,
      isLoading: false,
    });

    const { getByTestId, getByText } = renderWithThemeContext(<WellbeingScreen />);

    expect(getByTestId('error-container')).toBeTruthy();
    expect(getByText(errorMessage)).toBeTruthy();
  });

  test('user can select a mood and it is visually indicated', async () => {
    const wellbeingManager = {
      getMoodData: jest.fn().mockResolvedValue(mockedMoodData),
      saveMood: jest
        .fn()
        .mockResolvedValue({ mood: 'Very happy', date: new Date(), isToday: () => true }),
      getLast14DaysMoodData: jest.fn().mockReturnValue({
        labels: ['2025-04-01', '2025-04-02'],
        data: [4, 5],
      }),
    };

    useWellbeingManager.mockReturnValue(wellbeingManager);

    const { getByTestId } = renderWithThemeContext(<WellbeingScreen />);

    // Press the Very happy mood button
    await act(async () => {
      fireEvent.press(getByTestId('mood-button-Very happy'));
    });

    // Check that haptic feedback was triggered
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);

    // Check that the wellbeing manager was called to save the mood
    expect(wellbeingManager.saveMood).toHaveBeenCalledWith('Very happy');

    // Check that today's mood text was updated
    expect(getByTestId('today-mood-text')).toHaveTextContent('Very happy');
  });

  test('theme toggle changes the theme', () => {
    const toggleTheme = jest.fn();
    const { getByTestId } = renderWithThemeContext(<WellbeingScreen />, {
      isThemeDark: false,
      toggleTheme,
    });

    // Toggle the theme
    fireEvent(getByTestId('theme-toggle'), 'onValueChange', true);

    // Check that the theme toggle function was called
    expect(toggleTheme).toHaveBeenCalled();
  });

  test('chart displays no data message when there is no valid mood data', () => {
    // Mock wellbeing manager to return empty chart data
    useWellbeingManager.mockReturnValue({
      getMoodData: jest.fn().mockResolvedValue([]),
      saveMood: jest.fn(),
      getLast14DaysMoodData: jest.fn().mockReturnValue({
        labels: [],
        data: [],
      }),
    });

    // Mock wellbeing store to return empty mood data
    useWellbeingStore.mockReturnValue({
      moodData: [],
      error: null,
      isLoading: false,
    });

    const { getByTestId } = renderWithThemeContext(<WellbeingScreen />);

    // Check that chart is rendered with empty data
    const chartComponent = getByTestId('mood-tasks-chart');
    expect(chartComponent).toBeTruthy();
    expect(JSON.parse(chartComponent.props['data-mood-data'])).toEqual([]);
  });
});
