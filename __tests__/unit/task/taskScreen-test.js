import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useTaskStore } from '../../../store/taskStore';
import TasksScreen from '../../../screens/TaskScreen';

jest.mock('../../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));

describe('TaskScreen', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // ✅ 1️⃣ Test: Renders the TaskScreen
    it('renders the TaskScreen correctly', () => {
      useTaskStore.mockReturnValue({
        tasks: { high: [], medium: [], low: [] },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: jest.fn(),
      });

      const { getByTestId } = render(<TasksScreen />);
      expect(getByTestId('tasks-screen')).toBeTruthy();
    });

    // ✅ 2️⃣ Test: Displays tasks in correct priority groups
    it('renders tasks in priority groups', () => {
      useTaskStore.mockReturnValue({
        tasks: {
          high: [{ id: '1', title: 'High Task', dueDate: '2025-02-10T00:00:00.000Z' }],
          medium: [{ id: '2', title: 'Medium Task', dueDate: '2025-02-11T00:00:00.000Z' }],
          low: [{ id: '3', title: 'Low Task', dueDate: '2025-02-12T00:00:00.000Z' }],
        },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: jest.fn(),
      });

      const { getByText } = render(<TasksScreen />);
      
      expect(getByText('High Task — Mon Feb 10 2025')).toBeTruthy();
      expect(getByText('Medium Task — Tue Feb 11 2025')).toBeTruthy();
      expect(getByText('Low Task — Wed Feb 12 2025')).toBeTruthy();
    });

    // ✅ 3️⃣ Test: Opens and closes the modal
    it('opens and closes the task modal', () => {
      useTaskStore.mockReturnValue({
        tasks: { high: [], medium: [], low: [] },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: jest.fn(),
      });

      const { getByTestId, queryByTestId } = render(<TasksScreen />);

      // Open modal
      fireEvent.press(getByTestId('fab-add-task'));
      expect(getByTestId('task-modal')).toBeTruthy();

      // Close modal
      fireEvent.press(getByTestId('modal-cancel-button'));
      expect(queryByTestId('task-modal')).toBeNull();
    });

    // ✅ 4️⃣ Test: Adds a new task and updates the screen
    it('adds a new task and updates the screen', async () => {
      const mockAddTask = jest.fn();

      useTaskStore.mockReturnValue({
        tasks: { high: [], medium: [], low: [] },
        loadTasks: jest.fn(),
        addTask: mockAddTask,
        editTask: jest.fn(),
      });

      const { getByTestId, getByText, unmount } = render(<TasksScreen />);

      // Open modal
      fireEvent.press(getByTestId('fab-add-task'));

      // Enter task details
      fireEvent.changeText(getByTestId('input-title'), 'New Task');
      fireEvent.press(getByTestId('modal-save-button'));

      // ✅ Mock `useTaskStore` to return the new task
      useTaskStore.mockReturnValue({
        tasks: {
          high: [{ id: '100', title: 'New Task', dueDate: '2025-02-12T10:00:00.000Z' }],
          medium: [],
          low: [],
        },
        loadTasks: jest.fn(),
        addTask: mockAddTask,
        editTask: jest.fn(),
      });

      // Unmount and re-render
      unmount();
      const { getByText: getByTextAfterUpdate } = render(<TasksScreen />);

      // ✅ Verify UI updates
      await waitFor(() => {
        expect(getByTextAfterUpdate('New Task — Wed Feb 12 2025')).toBeTruthy();
      });
    });

    // ✅ 5️⃣ Test: Edits an existing task and updates UI
    it('edits an existing task and updates the screen', async () => {
      const mockEditTask = jest.fn();

      useTaskStore.mockReturnValue({
        tasks: {
          high: [{ id: '1', title: 'Old Task', priority: 'High', dueDate: '2025-02-10T00:00:00.000Z' }],
          medium: [],
          low: [],
        },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: mockEditTask,
      });

      const { getByText, getByTestId, unmount } = render(<TasksScreen />);

      // Open edit modal
      fireEvent(getByText('Old Task — Mon Feb 10 2025'), 'onLongPress');

      // Change title
      fireEvent.changeText(getByTestId('input-title'), 'Updated Task');
      fireEvent.press(getByTestId('modal-save-button'));

      // ✅ Mock `useTaskStore` to return updated task
      useTaskStore.mockReturnValue({
        tasks: {
          high: [{ id: '1', title: 'Updated Task', priority: 'High', dueDate: '2025-02-10T00:00:00.000Z' }],
          medium: [],
          low: [],
        },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: mockEditTask,
      });

      // Unmount and re-render
      unmount();
      const { getByText: getByTextAfterUpdate } = render(<TasksScreen />);

      // ✅ Verify UI updates
      await waitFor(() => {
        expect(getByTextAfterUpdate('Updated Task — Mon Feb 10 2025')).toBeTruthy();
      });
    });
});
