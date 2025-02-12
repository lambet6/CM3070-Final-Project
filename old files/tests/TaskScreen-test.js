import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the manager methods
jest.mock('../../services/task-manager', () => ({
  getTasks: jest.fn(),
  createNewTask: jest.fn(),
  editExistingTask: jest.fn()
}));

import { getTasks, createNewTask, editExistingTask } from '../../services/task-manager';
import TasksScreen from '../../TasksScreen';

describe('TasksScreen (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads tasks on mount and displays them in correct sections', async () => {
    // Suppose getTasks returns grouped data
    getTasks.mockResolvedValueOnce({
      high: [
        { id: '1', title: 'High Task', dueDate: '2025-01-01T00:00:00.000Z', priority: 'High' }
      ],
      medium: [],
      low: [
        { id: '2', title: 'Low Task', dueDate: '2025-02-01T00:00:00.000Z', priority: 'Low' }
      ]
    });

    const { getByText } = render(<TasksScreen />);

    // Wait for tasks to load
    await waitFor(() => {
      // Ensure manager was called
      expect(getTasks).toHaveBeenCalled();
      // Check if tasks appear
      expect(getByText(/^High Task —/)).toBeTruthy();
      expect(getByText(/^Low Task —/)).toBeTruthy();
    });
  });

  it('creates a new task', async () => {
    // Initially no tasks
    getTasks.mockResolvedValueOnce({ high: [], medium: [], low: [] });

    // When createNewTask is called, it returns updated grouped data
    createNewTask.mockResolvedValueOnce({
      high: [
        { id: '101', title: 'New Task', dueDate: '2025-05-01T00:00:00.000Z', priority: 'High' }
      ],
      medium: [],
      low: []
    });

    const { getByTestId, getByText, queryByText } = render(<TasksScreen />);

    // Wait for initial getTasks to complete
    await waitFor(() => expect(getTasks).toHaveBeenCalled());

    // Press the FAB to open the "Add" modal
    fireEvent.press(getByTestId('fab-add-task'));

    // Fill in the title
    // Suppose the TextInput has testID="input-title"
    fireEvent.changeText(getByTestId('input-title'), 'My New Task');
    
    // Choose Priority "High" - if you handle that via a Picker, you might do
    // fireEvent(getByTestId('picker-priority'), 'onValueChange', 'High');

    // Press Save
    fireEvent.press(getByText('Save'));

    // Wait for createNewTask to resolve and updated tasks to appear
    await waitFor(() => {
      expect(createNewTask).toHaveBeenCalledWith('My New Task', 'Medium', expect.any(Date));
      // or if you changed the priority to 'High', you check that argument
      expect(getByText(/^New Task —/)).toBeTruthy();
    });
  });

  it('edits an existing task', async () => {
    // The screen first loads tasks
    getTasks.mockResolvedValueOnce({
      high: [],
      medium: [
        { id: '200', title: 'Old Title', priority: 'Medium', dueDate: '2025-05-01T00:00:00.000Z' }
      ],
      low: []
    });

    // When we edit the task, the manager returns new grouped data
    editExistingTask.mockResolvedValueOnce({
      high: [
        { id: '200', title: 'Edited Title', priority: 'High', dueDate: '2025-07-01T00:00:00.000Z' }
      ],
      medium: [],
      low: []
    });

    const { getByText, getByTestId, findByText } = render(<TasksScreen />);

    // Wait for the old task to appear
    await findByText(/^Old Title —/);

    // Long-press to edit
    fireEvent(getByText(/^Old Title —/), 'onLongPress');

    // Change the title
    fireEvent.changeText(getByTestId('input-title'), 'Edited Title');

    // Pick a new priority "High" 
    fireEvent(getByTestId('picker-priority'), 'onValueChange', 'High');

    // Press Save
    fireEvent.press(getByText('Save'));

    // Wait for editExistingTask to be called and UI to refresh
    await waitFor(() => {
      expect(editExistingTask).toHaveBeenCalledWith(
        '200',
        'Edited Title',
        'High',   
        expect.any(Date)
      );
      expect(getByText(/^Edited Title —/)).toBeTruthy();
    });
  });
});
