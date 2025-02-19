import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WellbeingScreen from '../../../screens/WellbeingScreen';

// Mock the chart component
jest.mock('react-native-chart-kit', () => ({
    LineChart: () => 'LineChart'
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
        getLast14DaysMoodData: () => ({ labels: [], data: [] })
    })
}));

describe('WellbeingScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders basic UI elements', () => {
        const { getByTestId, getByText } = render(<WellbeingScreen />);
        
        expect(getByTestId('wellbeing-screen')).toBeTruthy();
        expect(getByText('Track your mood and tasks completed over time')).toBeTruthy();
        expect(getByText('How are you feeling today?')).toBeTruthy();
    });

    it('renders all mood buttons', () => {
        const { getByTestId } = render(<WellbeingScreen />);
        
        ['Very low', 'Low', 'Neutral', 'Happy', 'Very happy'].forEach(mood => {
            expect(getByTestId(`mood-button-${mood.toLowerCase()}`)).toBeTruthy();
            expect(getByTestId(`mood-text-${mood.toLowerCase()}`)).toBeTruthy();
        });
    });

    it('updates UI when a mood button is pressed', () => {
        // Define mutable store state to simulate re-render with updated moodData
        let storeState = {
            moodData: [],
            addMood: () => { 
                // Updated mood value to 'Happy' to match the pressed button
                storeState.moodData = [{ date: new Date().toISOString(), mood: 'Happy' }];
            },
            loadMoodData: jest.fn(),
            getLast14DaysMoodData: () => ({ labels: [], data: [] })
        };
        jest.spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore')
            .mockImplementation(() => storeState);

        const { getByTestId, rerender } = render(<WellbeingScreen />);
        const happyButton = getByTestId('mood-button-happy');
        // Check initial unselected style
        expect(happyButton).toHaveStyle({ backgroundColor: '#ddd' });

        // Simulate user pressing the happy button; triggers addMood and updates storeState.moodData
        fireEvent.press(happyButton);
        // Re-render with updated store state
        rerender(<WellbeingScreen />);
        expect(getByTestId('mood-button-happy')).toHaveStyle({ backgroundColor: '#ffa726' });
    });

    it('displays mood chart when mood data exists', () => {
        // Override the default mock to include data
        jest.spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore')
            .mockReturnValue({
                moodData: [{ mood: 'Happy', moodValue: 4, date: new Date().toISOString() }],
                addMood: jest.fn(),
                loadMoodData: jest.fn(),
                getLast14DaysMoodData: () => ({ labels: ['2024-01-01'], data: [4] })
            });

        const { getByTestId } = render(<WellbeingScreen />);
        expect(getByTestId('mood-chart')).toBeTruthy();
    });

    it('highlights selected mood for today', () => {
        const today = new Date().toISOString().split('T')[0];
        
        jest.spyOn(require('../../../store/wellbeingStore'), 'useWellbeingStore')
            .mockReturnValue({
                moodData: [{ date: today, mood: 'Happy' }],
                addMood: jest.fn(),
                loadMoodData: jest.fn(),
                getLast14DaysMoodData: () => ({ labels: [], data: [] })
            });

        const { getByTestId } = render(<WellbeingScreen />);
        const happyButton = getByTestId('mood-button-happy');
        
        // Check that the happy button has the selected style
        expect(happyButton).toHaveStyle({
            backgroundColor: '#ffa726'
        });
    });
});