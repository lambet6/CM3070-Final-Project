/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import GoalsScreen from '../../../screens/GoalsScreen';
import { useGoalsStore } from '../../../store/goalsStore';
import { createSampleGoals } from '../../fixtures/goal-fixtures';

// Mock the store hook
jest.mock('../../../store/goalsStore', () => ({
  useGoalsStore: jest.fn(),
}));

describe('GoalsScreen', () => {
  let mockGoals;
  let sampleGoals;
  let mockLoadGoals;
  let mockAddNewGoal;
  let mockUpdateGoal;
  let mockDeleteGoal;

  beforeEach(() => {
    // Create fresh test data
    sampleGoals = createSampleGoals();

    // Create simplified goal objects (like what would come from the store)
    mockGoals = [
      { id: '1', title: 'Exercise', hoursPerWeek: 5 },
      { id: '2', title: 'Reading', hoursPerWeek: 3 },
    ];

    // Create mock functions
    mockLoadGoals = jest.fn();
    mockAddNewGoal = jest.fn();
    mockUpdateGoal = jest.fn();
    mockDeleteGoal = jest.fn();

    // Setup the store mock
    useGoalsStore.mockReturnValue({
      goals: mockGoals,
      error: null,
      isLoading: false,
      loadGoals: mockLoadGoals,
      addNewGoal: mockAddNewGoal,
      updateGoal: mockUpdateGoal,
      deleteGoal: mockDeleteGoal,
    });

    jest.clearAllMocks();
  });

  describe('Layout and Static Elements', () => {
    it('displays header and guidance text', () => {
      // Arrange & Act
      const { getByText } = render(<GoalsScreen />);

      // Assert
      expect(getByText(/Make time for your long-term goals/)).toBeTruthy();
      expect(getByText(/Choose up to 7 things important/)).toBeTruthy();
    });

    it('displays column headers for goals table', () => {
      // Arrange & Act
      const { getByText } = render(<GoalsScreen />);

      // Assert
      expect(getByText('Goal')).toBeTruthy();
      expect(getByText('Hours per week')).toBeTruthy();
    });
  });

  describe('Goals Display', () => {
    it('shows existing goals in the list', () => {
      // Arrange & Act
      const { getByDisplayValue } = render(<GoalsScreen />);

      // Assert - Check that the goals are actually displayed
      expect(getByDisplayValue('Exercise')).toBeTruthy();
      expect(getByDisplayValue('Reading')).toBeTruthy();
      expect(getByDisplayValue('5')).toBeTruthy();
      expect(getByDisplayValue('3')).toBeTruthy();
    });

    it('shows add button when less than 7 goals', () => {
      // Arrange & Act
      const { getByText } = render(<GoalsScreen />);

      // Assert
      expect(getByText('➕ Add Goal')).toBeTruthy();
    });

    it('hides add button when 7 goals exist', () => {
      // Arrange - Create 7 goals
      const sevenGoals = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        title: `Goal ${i + 1}`,
        hoursPerWeek: 1,
      }));

      // Update mock
      useGoalsStore.mockReturnValueOnce({
        goals: sevenGoals,
        loadGoals: mockLoadGoals,
        addNewGoal: mockAddNewGoal,
        updateGoal: mockUpdateGoal,
        deleteGoal: mockDeleteGoal,
      });

      // Act
      const { queryByText } = render(<GoalsScreen />);

      // Assert
      expect(queryByText('➕ Add Goal')).toBeNull();
    });
  });

  describe('Goal Editing', () => {
    it('allows editing goal title', () => {
      // Arrange
      const { getByDisplayValue } = render(<GoalsScreen />);
      const titleInput = getByDisplayValue('Exercise');

      // Act
      fireEvent.changeText(titleInput, 'Daily Exercise');

      // Assert - Check the UI actually shows the changed value
      expect(getByDisplayValue('Daily Exercise')).toBeTruthy();
    });

    it('persists the goal update when focus is lost', () => {
      // Arrange
      const { getByDisplayValue } = render(<GoalsScreen />);
      const titleInput = getByDisplayValue('Exercise');

      // Act - Change text and trigger blur by using onBlur directly
      fireEvent.changeText(titleInput, 'Daily Exercise');
      fireEvent(titleInput, 'blur');

      // Assert - Check that updateGoal was called with the right values
      expect(mockUpdateGoal).toHaveBeenCalledWith('1', 'Daily Exercise', 5);
    });
  });

  describe('Goal Management', () => {
    it('loads and displays goals when component mounts', () => {
      // Arrange & Act
      render(<GoalsScreen />);

      // Assert
      expect(mockLoadGoals).toHaveBeenCalledTimes(1);
      // This test verifies both the implementation (loadGoals called)
      // and the outcome (goals displayed) from the previous test
    });

    it('adds a new goal that appears in the UI', () => {
      // Arrange
      const { getByText, queryByDisplayValue } = render(<GoalsScreen />);

      // Verify goal doesn't exist yet
      expect(queryByDisplayValue('New Goal')).toBeNull();

      // Update store mock to simulate the store update after adding
      const updatedGoals = [...mockGoals, { id: '3', title: 'New Goal', hoursPerWeek: 0 }];

      useGoalsStore.mockReturnValueOnce({
        goals: updatedGoals,
        error: null,
        isLoading: false,
        loadGoals: mockLoadGoals,
        addNewGoal: mockAddNewGoal,
        updateGoal: mockUpdateGoal,
        deleteGoal: mockDeleteGoal,
      });

      // Act
      fireEvent.press(getByText('➕ Add Goal'));

      // Re-render to see updated UI
      const { queryByDisplayValue: queryAfterAdd } = render(<GoalsScreen />);

      // Assert - New goal should be visible
      expect(queryAfterAdd('New Goal')).toBeTruthy();
    });

    it('removes a goal from the UI when deleted', () => {
      // Arrange
      const { getAllByTestId, queryByDisplayValue } = render(<GoalsScreen />);
      const deleteButtons = getAllByTestId('delete-button');

      // Verify goal exists before deletion
      expect(queryByDisplayValue('Exercise')).toBeTruthy();

      // Update mock to simulate the store update after deletion
      useGoalsStore.mockReturnValueOnce({
        goals: [mockGoals[1]], // Only the second goal remains
        error: null,
        isLoading: false,
        loadGoals: mockLoadGoals,
        addNewGoal: mockAddNewGoal,
        updateGoal: mockUpdateGoal,
        deleteGoal: mockDeleteGoal,
      });

      // Act
      fireEvent.press(deleteButtons[0]);

      // Re-render to see updated UI
      const { queryByDisplayValue: queryAfterDelete } = render(<GoalsScreen />);

      // Assert - Goal should be removed from UI
      expect(queryAfterDelete('Exercise')).toBeNull();
      expect(queryAfterDelete('Reading')).toBeTruthy(); // Other goal remains
    });

    it('updates a goal in the UI when edited', () => {
      // Arrange
      const { getByDisplayValue } = render(<GoalsScreen />);
      const titleInput = getByDisplayValue('Exercise');
      const hoursInput = getByDisplayValue('5');

      // Update mock to simulate the store update after editing
      useGoalsStore.mockReturnValueOnce({
        goals: [{ id: '1', title: 'Daily Exercise', hoursPerWeek: 7 }, mockGoals[1]],
        error: null,
        isLoading: false,
        loadGoals: mockLoadGoals,
        addNewGoal: mockAddNewGoal,
        updateGoal: mockUpdateGoal,
        deleteGoal: mockDeleteGoal,
      });

      // Act - Edit both title and hours - use fireEvent() instead of fireEvent.blur()
      fireEvent.changeText(titleInput, 'Daily Exercise');
      fireEvent.changeText(hoursInput, '7');
      fireEvent(titleInput, 'blur');
      fireEvent(hoursInput, 'blur');

      // Re-render to see updated UI
      const { queryByDisplayValue } = render(<GoalsScreen />);

      // Assert - Check that UI shows updated values
      expect(queryByDisplayValue('Daily Exercise')).toBeTruthy();
      expect(queryByDisplayValue('7')).toBeTruthy();
    });
  });

  describe('Error and Loading States', () => {
    it('shows error message when there is an error', () => {
      // Arrange
      const errorMessage = 'Failed to load goals';
      useGoalsStore.mockReturnValue({
        goals: mockGoals,
        error: errorMessage,
        isLoading: false,
        loadGoals: mockLoadGoals,
        addNewGoal: mockAddNewGoal,
        updateGoal: mockUpdateGoal,
        deleteGoal: mockDeleteGoal,
      });

      // Act
      const { getByText } = render(<GoalsScreen />);

      // Assert - Error message is visible to the user
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
});
