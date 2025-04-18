/*global jest*/
import { describe, expect, beforeAll, afterAll, it } from '@jest/globals';
import * as React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { RootNavigator } from '../../navigation/RootNavigator';

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// // ✅ Mock Zustand Store
jest.mock('../../store/calendarStore', () => ({
  useCalendarStore: jest.fn(() => ({
    events: [],
    loadCalendarEvents: jest.fn(), // Ensure this function exists in tests
  })),
}));

jest.mock('../../store/taskStore', () => ({
  useTaskStore: jest.fn(() => ({
    tasks: { high: [], medium: [], low: [] },
    loadTasks: jest.fn(() => []),
    addTask: jest.fn(() => []),
    editTask: jest.fn(() => []),
    getTodayTasks: jest.fn(() => []),
    getWeekTasks: jest.fn(() => []),
  })),
}));

jest.mock('../../store/goalsStore', () => ({
  useGoalsStore: jest.fn(() => ({
    goals: [],
    loadGoals: jest.fn(),
    addNewGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
  })),
}));

// Add wellbeingStore mock
jest.mock('../../store/wellbeingStore', () => ({
  useWellbeingStore: jest.fn(() => ({
    moodData: [],
    loadMoodData: jest.fn(),
    addMood: jest.fn(),
    getLast14DaysMoodData: jest.fn(() => ({ labels: [], data: [] })),
  })),
}));

describe('Navigation tests', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('shows calendar screen when Calendar tab is pressed', async () => {
    render(<RootNavigator />);

    fireEvent.press(screen.getByTestId('calendar-tab'));

    const calendarScreen = await screen.findByTestId('calendar-screen');
    expect(calendarScreen).toBeOnTheScreen();
  });

  it('shows goals screen when Goals tab is pressed', async () => {
    render(<RootNavigator />);

    fireEvent.press(screen.getByTestId('goals-tab'));

    const goalsScreen = await screen.findByTestId('goals-screen');
    expect(goalsScreen).toBeOnTheScreen();
  });

  it('shows wellbeing screen when Wellbeing tab is pressed', async () => {
    render(<RootNavigator />);

    fireEvent.press(screen.getByTestId('wellbeing-tab'));

    const wellbeingScreen = await screen.findByTestId('wellbeing-screen');
    expect(wellbeingScreen).toBeOnTheScreen();
  });

  it('navigates through all screens correctly', async () => {
    render(<RootNavigator />);

    // The initial screen is tasks
    expect(screen.getByTestId('tasks-screen')).toBeOnTheScreen();

    // Calendar
    fireEvent.press(screen.getByTestId('calendar-tab'));
    expect(await screen.findByTestId('calendar-screen')).toBeOnTheScreen();

    // Goals
    fireEvent.press(screen.getByTestId('goals-tab'));
    expect(await screen.findByTestId('goals-screen')).toBeOnTheScreen();

    // Wellbeing
    fireEvent.press(screen.getByTestId('wellbeing-tab'));
    expect(await screen.findByTestId('wellbeing-screen')).toBeOnTheScreen();

    // Back to Tasks
    fireEvent.press(screen.getByTestId('tasks-tab'));
    expect(await screen.findByTestId('tasks-screen')).toBeOnTheScreen();
  });
});
