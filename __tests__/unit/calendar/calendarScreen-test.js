import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useCalendarStore } from '../../../store/calendarStore';
import { useTaskStore } from '../../../store/taskStore';
import CalendarScreen from '../../../screens/CalendarScreen';

jest.mock('../../../store/calendarStore', () => ({
  useCalendarStore: jest.fn(),
}));

jest.mock('../../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));

describe('CalendarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Screen Rendering', () => {
    it('renders the CalendarScreen without crashing', () => {
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

      const { getByTestId } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>
      );
      expect(getByTestId('calendar-screen')).toBeTruthy();
    });

    it('renders tasks and events correctly in the weekly view', () => {
      useCalendarStore.mockReturnValue({
        events: [{ id: '1', title: 'Meeting', startDate: new Date() }],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([]),
        getWeekTasks: jest.fn().mockReturnValue([
          { id: '2', title: 'Project Task', dueDate: new Date() },
        ]),
        addTask: jest.fn(),
        toggleCompleteTask: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
        <CalendarScreen />
        </NavigationContainer>
      );

      expect(getByText('Meeting')).toBeTruthy();
      expect(getByText('Project Task')).toBeTruthy();
    });

    it('renders tasks for today in the Today section', () => {
      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([
          { id: '3', title: 'Daily Standup', completed: false },
        ]),
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
        toggleCompleteTask: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
        <CalendarScreen />
        </NavigationContainer>
      );
      
      expect(getByText('Daily Standup')).toBeTruthy();
    });
  });

  describe('Task Operations', () => {
    it('marks a task as complete when tapped', async () => {
      const mockToggleCompleteTask = jest.fn();
      
      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      const mockGetTodayTasks = jest.fn()
        .mockReturnValue([{ id: '4', title: 'Unfinished Task', dueDate: new Date(), completed: false }])

      useTaskStore.mockReturnValue({
        getTodayTasks: mockGetTodayTasks,
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
        toggleCompleteTask: mockToggleCompleteTask,
      });

      const { getByText, rerender } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>
      );

      // Ensure task exists before completion
      expect(getByText('Unfinished Task')).toBeTruthy();

      // Tap the task to complete it
      fireEvent.press(getByText('Unfinished Task'));

      // Update the mock to return the task as completed
      mockGetTodayTasks.mockReturnValue([
        { id: '4', title: 'Unfinished Task', dueDate: new Date(), completed: true }
      ]);

      // Simulate UI update with completed task
      rerender(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>
      );

      await waitFor(() => {
        const taskElement = getByText('Unfinished Task');
        expect(taskElement).toHaveStyle({ textDecorationLine: 'line-through' });
        expect(mockToggleCompleteTask).toHaveBeenCalledWith('4');
      });
    });
  });

  describe('Modal Interactions', () => {
    it('opens and closes the task modal', () => {
      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: jest.fn().mockReturnValue([]),
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
      });

      const { getByTestId, queryByTestId } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>
      );

      // Click on the FAB button
      fireEvent.press(getByTestId('fab-add-task'));

      // Modal should be open
      expect(getByTestId('task-modal')).toBeTruthy();

      // Click cancel button in modal
      fireEvent.press(getByTestId('modal-cancel-button'));

      // Modal should be closed
      expect(queryByTestId('task-modal')).toBeNull();
    });

    it('adds a new task and updates the screen', async () => {
      const mockGetTodayTasks = jest.fn().mockReturnValue([]);

      useCalendarStore.mockReturnValue({
        events: [],
        loadCalendarEvents: jest.fn(),
      });

      useTaskStore.mockReturnValue({
        getTodayTasks: mockGetTodayTasks,
        getWeekTasks: jest.fn().mockReturnValue([]),
        addTask: jest.fn(),
      });

      // Render the component
      const { getByTestId, getByText, rerender } = render(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>
      );

      // Open modal
      fireEvent.press(getByTestId('fab-add-task'));

      // Enter task details
      fireEvent.changeText(getByTestId('input-title'), 'New Task');
      fireEvent.press(getByTestId('modal-save-button'));

      // Update mock return value for new state
      mockGetTodayTasks.mockReturnValue([
        { id: '100', title: 'New Task', dueDate: '2025-02-12T10:00:00.000Z' }
      ]);

      // Rerender to reflect store update
      rerender(
        <NavigationContainer>
          <CalendarScreen />
        </NavigationContainer>
      );

      // Assert that the new task appears in the UI
      await waitFor(() => {
        expect(getByText('New Task')).toBeTruthy();
      });
    });
  });
});
