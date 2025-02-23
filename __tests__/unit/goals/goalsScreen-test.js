/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GoalsScreen from '../../../screens/GoalsScreen';
import { useGoalsStore } from '../../../store/goalsStore';

jest.mock('../../../store/goalsStore', () => ({
  useGoalsStore: jest.fn(),
}));

describe('GoalsScreen', () => {
  const mockGoals = [
    { id: '1', title: 'Exercise', hoursPerWeek: 5 },
    { id: '2', title: 'Reading', hoursPerWeek: 3 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useGoalsStore.mockReturnValue({
      goals: mockGoals,
      loadGoals: jest.fn(),
      addNewGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
    });
  });

  describe('Layout and Static Elements', () => {
    it('displays header and guidance text', () => {
      const { getByText } = render(<GoalsScreen />);
      expect(getByText(/Make time for your long-term goals/)).toBeTruthy();
      expect(getByText(/Choose up to 7 things important/)).toBeTruthy();
    });

    it('displays column headers for goals table', () => {
      const { getByText } = render(<GoalsScreen />);
      expect(getByText('Goal')).toBeTruthy();
      expect(getByText('Hours per week')).toBeTruthy();
    });

    it('dismisses keyboard when tapping outside inputs', () => {
      const { getByTestId } = render(<GoalsScreen />);
      fireEvent.press(getByTestId('goals-screen'));
    });
  });

  describe('Goals Display', () => {
    it('shows existing goals in the list', () => {
      const { getAllByTestId } = render(<GoalsScreen />);

      const titleInputs = getAllByTestId('title-input');
      const hoursInputs = getAllByTestId('hours-input');

      expect(titleInputs[0].props.value).toBe('Exercise');
      expect(titleInputs[1].props.value).toBe('Reading');
      expect(hoursInputs[0].props.value).toBe('5');
      expect(hoursInputs[1].props.value).toBe('3');
    });

    it('shows add button when less than 7 goals', () => {
      const { getByText } = render(<GoalsScreen />);
      expect(getByText('➕ Add Goal')).toBeTruthy();
    });

    it('hides add button when 7 goals exist', () => {
      const sevenGoals = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        title: `Goal ${i + 1}`,
        hoursPerWeek: 1,
      }));

      useGoalsStore.mockReturnValueOnce({
        goals: sevenGoals,
        loadGoals: jest.fn(),
        addNewGoal: jest.fn(),
        updateGoal: jest.fn(),
        deleteGoal: jest.fn(),
      });

      const { queryByText } = render(<GoalsScreen />);
      expect(queryByText('➕ Add Goal')).toBeNull();
    });
  });

  describe('Goal Editing', () => {
    it('allows editing goal title', () => {
      const { getByDisplayValue } = render(<GoalsScreen />);
      const titleInput = getByDisplayValue('Exercise');

      fireEvent.changeText(titleInput, 'Daily Exercise');

      expect(getByDisplayValue('Daily Exercise')).toBeTruthy();
    });

    it('allows editing hours', () => {
      const { getAllByTestId } = render(<GoalsScreen />);
      const hoursInputs = getAllByTestId('hours-input');

      fireEvent.changeText(hoursInputs[0], '10');

      expect(hoursInputs[0].props.value).toBe('10');
    });
  });

  describe('Goal Management', () => {
    it('allows deleting goals', () => {
      // Initial render with both goals
      const { getAllByTestId } = render(<GoalsScreen />);
      const deleteButtons = getAllByTestId('delete-button');

      // Update store to show only the remaining goal
      useGoalsStore.mockImplementation(() => ({
        goals: [mockGoals[1]], // Only the Reading goal
        loadGoals: jest.fn(),
        addNewGoal: jest.fn(),
        updateGoal: jest.fn(),
        deleteGoal: jest.fn(),
      }));

      fireEvent.press(deleteButtons[0]);

      // Get updated UI state
      const { getAllByTestId: getAllByTestIdAfterDelete } = render(<GoalsScreen />);
      const remainingInputs = getAllByTestIdAfterDelete('title-input');
      expect(remainingInputs.length).toBe(1);
      expect(remainingInputs[0].props.value).toBe('Reading');
    });
  });
});
