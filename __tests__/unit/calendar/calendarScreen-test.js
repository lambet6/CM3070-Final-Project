/*global jest*/
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useCalendarStore } from '../../../store/calendarStore';
import { useTaskStore } from '../../../store/taskStore';
import CalendarScreen from '../../../screens/CalendarScreen';
import { createSampleCalendarEvents } from '../../fixtures/calendar-fixtures';

// Mock the store hooks
jest.mock('../../../store/calendarStore', () => ({
  useCalendarStore: jest.fn(),
}));

jest.mock('../../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));

describe('CalendarScreen', () => {
  let sampleEvents;
  const MOCK_DATE = new Date('2025-02-12T00:00:00.000Z');
  const MOCK_TIMESTAMP = MOCK_DATE.getTime();

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh test data
    sampleEvents = createSampleCalendarEvents();

    // Mock date for consistent testing
    const MockDate = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(MOCK_TIMESTAMP);
        } else {
          super(...args);
        }
      }
      static now() {
        return MOCK_TIMESTAMP;
      }
    };
    global.Date = MockDate;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Screen Rendering', () => {
    it('renders the CalendarScreen without crashing', () => {
      // Arrange
      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([]),
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
        toggleCompleteTask: jest.fn(),
      });

      // Act
      const { getByTestId } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Assert
      expect(getByTestId('calendar-screen')).toBeTruthy();
    });

    it('renders tasks and events correctly in the weekly view', () => {
      // Arrange
      const eventDate = new Date('2025-02-12T10:00:00.000Z');
      const event = sampleEvents.meeting;
      event.startDate = eventDate;
      event.endDate = new Date('2025-02-12T11:00:00.000Z');

      useCalendarStore.mockReturnValue({
        events: [event],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([]),
        getWeekTasks: jest.fn().mockReturnValue([
          {
            id: '2',
            title: 'Project Task',
            dueDate: eventDate,
          },
        ]),
        addTask: jest.fn(),
        toggleCompleteTask: jest.fn(),
      });

      // Act
      const { getByText } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Assert
      expect(getByText('Team Meeting')).toBeTruthy();
      expect(getByText('Project Task')).toBeTruthy();
    });

    it('renders tasks for today in the Today section', () => {
      // Arrange
      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([
          {
            id: '3',
            title: 'Daily Standup',
            completed: false,
          },
        ]),
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
        toggleCompleteTask: jest.fn(),
      });

      // Act
      const { getByText } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Assert
      expect(getByText('Daily Standup')).toBeTruthy();
    });
  });

  describe('Task Operations', () => {
    it('marks a task as complete when tapped', async () => {
      // Arrange
      const mockToggleCompleteTask = jest.fn();

      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      const mockGetTodayTasks = jest
        .fn()
        .mockReturnValue([
          { id: '4', title: 'Unfinished Task', dueDate: new Date(), completed: false },
        ]);

      useTaskStore.mockReturnValue({
        getTodayTasks: mockGetTodayTasks,
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
        toggleCompleteTask: mockToggleCompleteTask,
      });

      // Act
      const { getByText, rerender } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Ensure task exists before completion
      expect(getByText('Unfinished Task')).toBeTruthy();

      // Tap the task to complete it
      fireEvent.press(getByText('Unfinished Task'));

      // Update the mock to return the task as completed
      mockGetTodayTasks.mockReturnValue([
        { id: '4', title: 'Unfinished Task', dueDate: new Date(), completed: true },
      ]);

      // Simulate UI update with completed task
      rerender(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Assert
      await waitFor(() => {
        const taskElement = getByText('Unfinished Task');
        expect(taskElement).toHaveStyle({ textDecorationLine: 'line-through' });
        expect(mockToggleCompleteTask).toHaveBeenCalledWith('4');
      });
    });
  });

  describe('Modal Interactions', () => {
    it('opens and closes the task modal', () => {
      // Arrange
      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([]),
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
      });

      // Act
      const { getByTestId, queryByTestId } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Click on the FAB button
      fireEvent.press(getByTestId('fab-add-task'));

      // Assert - Modal should be open
      expect(getByTestId('task-modal')).toBeTruthy();

      // Click cancel button in modal
      fireEvent.press(getByTestId('modal-cancel-button'));

      // Assert - Modal should be closed
      expect(queryByTestId('task-modal')).toBeNull();
    });

    it('adds a new task and updates the screen', async () => {
      // Arrange
      const mockGetTodayTasks = jest.fn().mockReturnValue([]);
      const mockAddTask = jest.fn();

      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: mockGetTodayTasks,
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: mockAddTask,
      });

      // Act
      const { getByTestId, getByText, rerender } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Open modal
      fireEvent.press(getByTestId('fab-add-task'));

      // Enter task details
      fireEvent.changeText(getByTestId('input-title'), 'New Task');
      fireEvent.press(getByTestId('modal-save-button'));

      // Assert - Add task should be called
      expect(mockAddTask).toHaveBeenCalled();

      // Update mock return value with proper date object
      mockGetTodayTasks.mockReturnValue([
        {
          id: '100',
          title: 'New Task',
          dueDate: new Date('2025-02-12T10:00:00.000Z'),
        },
      ]);

      // Rerender to reflect store update
      rerender(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>,
      );

      // Assert that the new task appears in the UI
      await waitFor(() => {
        expect(getByText('New Task')).toBeTruthy();
      });
    });
  });
});
