import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// mock tasks-server module:
jest.mock('../../Servers/tasks-server', () => ({
  loadTasksFromStorage: jest.fn(),
  saveTasksToStorage: jest.fn(),
}));

import { loadTasksFromStorage, saveTasksToStorage } from '../../Servers/tasks-server';
import TasksScreen from '../../TasksScreen';

describe('TasksScreen (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads tasks on mount', async () => {
    loadTasksFromStorage.mockResolvedValueOnce([
      { id: '1', title: 'Mock Task', dueDate: new Date().toISOString(), priority: 'High' }
    ]);

    const { getByText } = render(<TasksScreen />);

    // Wait for tasks to load
    await waitFor(() => {
      // The screen appends "— [Date]" to the title
      expect(getByText(/^Mock Task —/)).toBeTruthy();
    });

    // Also check that loadTasks was called
    expect(loadTasksFromStorage).toHaveBeenCalledTimes(1);
  });

  it('adds a new task', async () => {
    // No tasks initially
    loadTasksFromStorage.mockResolvedValueOnce([]);

    const { getByTestId, getByText, queryByText } = render(<TasksScreen />);
    // Wait for initial load
    await waitFor(() => {
      expect(loadTasksFromStorage).toHaveBeenCalled();
    });

    // Press the FAB to open modal
    fireEvent.press(getByTestId('fab-add-task'));

    // Provide some input
    // Suppose we have testID="input-title" for <TextInput />
    fireEvent.changeText(getByTestId('input-title'), 'New Task Title');

    // Press "Save"
    fireEvent.press(getByText('Save'));

    // Wait for the UI to show the new task
    await waitFor(() => {
      expect(queryByText(/^New Task Title —/)).toBeTruthy();
    });

    // Check that saveTasks was called with the new task
    expect(saveTasksToStorage).toHaveBeenCalled();
    // We can inspect the actual arguments if we want:
    const callArg = saveTasksToStorage.mock.calls[0][0];
    expect(callArg[0].title).toBe('New Task Title');
  });

  it('edits an existing task', async () => {
    const mockExisting = [
      { id: '100', title: 'Old Title', priority: 'Low', dueDate: new Date().toISOString() }
    ];
    loadTasksFromStorage.mockResolvedValueOnce(mockExisting);

    const { getByText, findByText, getByTestId } = render(<TasksScreen />);

    // Wait for the existing task
    await findByText(/^Old Title —/);

    // Simulate long press to edit
    fireEvent(getByText(/^Old Title —/), 'onLongPress');

    // Change the title
    const newTitle = 'Edited Title'
    const input = getByTestId('input-title');
    fireEvent.changeText(input, newTitle);

    // Press "Save"
    fireEvent.press(getByText('Save'));

    // Wait for UI update
    await waitFor(() => {
      expect(getByText(/^Edited Title —/)).toBeTruthy();
    });

    // Confirm the server got the updated tasks
    expect(saveTasksToStorage).toHaveBeenCalledTimes(1);
    const updatedArg = saveTasksToStorage.mock.calls[0][0];
    expect(updatedArg[0].title).toBe(newTitle);
  });
});

