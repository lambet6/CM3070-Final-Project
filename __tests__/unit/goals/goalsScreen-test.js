import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GoalsScreen from '../../../screens/GoalsScreen';

// Mock the store
const mockLoadGoals = jest.fn();
const mockAddNewGoal = jest.fn();
const mockUpdateGoal = jest.fn();
const mockDeleteGoal = jest.fn();

jest.mock('../../../store/goalsStore', () => ({
    useGoalsStore: () => ({
        goals: [],
        loadGoals: mockLoadGoals,
        addNewGoal: mockAddNewGoal,
        updateGoal: mockUpdateGoal,
        deleteGoal: mockDeleteGoal,
    })
}));

describe('GoalsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders header, subheader and goals container', () => {
        const { getByTestId, getByText } = render(<GoalsScreen />);
        expect(getByTestId('goals-screen')).toBeTruthy();
        expect(getByText(/Make time for your long-term goals/)).toBeTruthy();
        expect(getByText(/Choose up to 7 things important/)).toBeTruthy();
    });

    it('shows the add goal button and responds to press', () => {
        // Render with empty goals so that the add button appears
        const { getByText } = render(<GoalsScreen />);
        const addButton = getByText('➕ Add Goal');
        expect(addButton).toBeTruthy();
        fireEvent.press(addButton);
        expect(mockAddNewGoal).toHaveBeenCalledWith('New Goal', 0);
    });
});
