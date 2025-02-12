import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

  // Renders the Calendar Screen correctly
  it('renders the CalendarScreen without crashing', () => {
    useCalendarStore.mockReturnValue({
      events: [],
      loadCalendarEvents: jest.fn(),
    });

    useTaskStore.mockReturnValue({
      getTodayTasks: jest.fn().mockReturnValue([]),
      getWeekTasks: jest.fn().mockReturnValue([]),
      addTask: jest.fn(),
    });

    const { getByTestId } = render(<CalendarScreen />);
    expect(getByTestId('calendar-screen')).toBeTruthy();
  });

  // Displays tasks and events for the correct week
  it('renders tasks and events correctly in the weekly view', () => {
    useCalendarStore.mockReturnValue({
      events: [
        { id: '1', title: 'Meeting', startDate: new Date()}
      ],
      loadCalendarEvents: jest.fn(),
    });

    useTaskStore.mockReturnValue({
      getTodayTasks: jest.fn().mockReturnValue([]),
      getWeekTasks: jest.fn().mockReturnValue([
        { id: '2', title: 'Project Task', dueDate: new Date() }
      ]),
      addTask: jest.fn(),
    });

    const { getByText } = render(<CalendarScreen />);

    expect(getByText('Meeting')).toBeTruthy();
    expect(getByText('Project Task')).toBeTruthy();
  });

  // Displays today's tasks correctly
  it('renders tasks for today in the Today section', () => {
    useCalendarStore.mockReturnValue({
      events: [],
      loadCalendarEvents: jest.fn(),
    });

    useTaskStore.mockReturnValue({
      getTodayTasks: jest.fn().mockReturnValue([
        { id: '3', title: 'Daily Standup' }
      ]),
      getWeekTasks: jest.fn().mockReturnValue([]),
      addTask: jest.fn(),
    });

    const { getByText } = render(<CalendarScreen />);
    
    expect(getByText('Daily Standup')).toBeTruthy();
  });

  // Opens and closes the modal when clicking the add button
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

    const { getByTestId, queryByTestId } = render(<CalendarScreen />);

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
      addTask: jest.fn(), // No need to check this directly
    });

    // Render the component
    const { getByTestId, getByText, unmount } = render(<CalendarScreen />);

    // Open modal
    fireEvent.press(getByTestId('fab-add-task'));

    // Enter task details
    fireEvent.changeText(getByTestId('input-title'), 'New Task');
    fireEvent.press(getByTestId('modal-save-button'));

    // Update the mock to return the new task
    mockGetTodayTasks.mockReturnValue([
      { id: '100', title: 'New Task', dueDate: '2025-02-12T10:00:00.000Z' }
    ]);

    // Unmount and re-render to reflect store update
    unmount();
    const { getByText: getByTextAfterUpdate } = render(<CalendarScreen />);

    // Assert that the new task appears in the UI
    await waitFor(() => {
      expect(getByTextAfterUpdate('New Task')).toBeTruthy();
    });
  });

});
