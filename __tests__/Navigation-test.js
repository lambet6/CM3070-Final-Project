import * as React from 'react';
import { screen, render, fireEvent } from '@testing-library/react-native';
import App from '../App';

test('shows calendar screen when Calendar tab is pressed', () => {
    render(
        <App />
    );

    fireEvent.press(screen.getByText('Calendar'));

    expect(screen.getByTestId('calendar-screen')).toBeOnTheScreen();
});

test('shows goals screen when Goals tab is pressed', () => {
    render(
      <App />
    );
  
    fireEvent.press(screen.getByText('Goals'));
  
    expect(screen.getByTestId('goals-screen')).toBeOnTheScreen();
});

test('shows wellbeing screen when Wellbeing tab is pressed', () => {
    render(
      <App />
    );
  
    fireEvent.press(screen.getByText('Wellbeing'));
  
    expect(screen.getByTestId('wellbeing-screen')).toBeOnTheScreen();
});
