import * as React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { RootNavigator } from '../../RootNavigator';

test('shows calendar screen when Calendar tab is pressed', async () => {
  render(<RootNavigator />);

  fireEvent.press(screen.getByTestId('calendar-tab'));

  const calendarScreen = await screen.findByTestId('calendar-screen');
  expect(calendarScreen).toBeOnTheScreen();
});

test('shows goals screen when Goals tab is pressed', async () => {
  render(<RootNavigator />);

  fireEvent.press(screen.getByTestId('goals-tab'));

  const goalsScreen = await screen.findByTestId('goals-screen');
  expect(goalsScreen).toBeOnTheScreen();
});

test('shows wellbeing screen when Wellbeing tab is pressed', async () => {
  render(<RootNavigator />);

  fireEvent.press(screen.getByTestId('wellbeing-tab'));

  const wellbeingScreen = await screen.findByTestId('wellbeing-screen');
  expect(wellbeingScreen).toBeOnTheScreen();
});

test('navigates through all screens correctly', async () => {
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
