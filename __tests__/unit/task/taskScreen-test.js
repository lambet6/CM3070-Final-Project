/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useTaskStore } from '../../../store/taskStore';
import TasksScreen from '../../../screens/TaskScreen';
import { createGroupedTaskSets } from '../../fixtures/task-fixtures';

jest.mock('../../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));

describe('TaskScreen', () => {
  const groupedTaskSets = createGroupedTaskSets();

  // Setup mock functions for the store
  const mockLoadTasks = jest.fn().mockResolvedValue();
  const mockAddTask = jest.fn().mockResolvedValue();
  const mockEditTask = jest.fn().mockResolvedValue();
  const mockToggleCompleteTask = jest.fn().mockResolvedValue();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default implementation of the store
    useTaskStore.mockReturnValue({
      tasks: groupedTaskSets.allPriorities,
      loadTasks: mockLoadTasks,
      addTask: mockAddTask,
      editTask: mockEditTask,
      toggleCompleteTask: mockToggleCompleteTask,
      error: null,
    });

    // Spy on console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Task Display', () => {
    it('displays tasks organized in priority sections', async () => {
      // Arrange & Act
      const { getByText } = render(<TasksScreen />);

      // Assert - Check that priority headers are visible
      expect(getByText('High Priority')).toBeTruthy();
      expect(getByText('Medium Priority')).toBeTruthy();
      expect(getByText('Low Priority')).toBeTruthy();

      // Check that tasks are displayed under correct sections
      expect(getByText(/High Priority Task/)).toBeTruthy();
      expect(getByText(/Medium Priority Task/)).toBeTruthy();
      expect(getByText(/Low Priority Task/)).toBeTruthy();

      // Verify tasks load on mount
      expect(mockLoadTasks).toHaveBeenCalledTimes(1);
    });

    it('shows task due dates alongside task titles', () => {
      // Arrange & Act
      const { getByText } = render(<TasksScreen />);

      // Assert - Check that tasks show due dates
      expect(getByText(/High Priority Task.*Feb 10/)).toBeTruthy();
      expect(getByText(/Medium Priority Task.*Feb 11/)).toBeTruthy();
      expect(getByText(/Low Priority Task.*Feb 12/)).toBeTruthy();
    });
  });

  describe('Adding Tasks', () => {
    it('shows add task modal when FAB is pressed', async () => {
      // Arrange
      const { getByTestId, getByText } = render(<TasksScreen />);

      // Act - Press the floating action button
      fireEvent.press(getByTestId('fab-add-task'));

      // Assert - Check that modal appears with correct elements
      await waitFor(() => {
        expect(getByText('Add Task')).toBeTruthy();
        expect(getByTestId('input-title')).toBeTruthy();
        expect(getByTestId('picker-priority')).toBeTruthy();
      });
    });

    it('adds a new task when form is filled and saved', async () => {
      // Arrange
      const { getByTestId } = render(<TasksScreen />);

      // Act - Open the modal
      fireEvent.press(getByTestId('fab-add-task'));

      // Fill in the form
      fireEvent.changeText(getByTestId('input-title'), 'New Test Task');
      // Could also test priority selection and date picker here

      // Save the task
      fireEvent.press(getByTestId('modal-save-button'));

      // Assert
      await waitFor(() => {
        // Verify addTask was called with correct parameters
        expect(mockAddTask).toHaveBeenCalledWith(
          'New Test Task',
          'Medium', // Default priority
          expect.any(Date),
        );
      });
    });

    it('validates task input before submission', async () => {
      // Arrange
      const { getByTestId, getByText } = render(<TasksScreen />);

      // Act - Open the modal and try to save without a title
      fireEvent.press(getByTestId('fab-add-task'));
      fireEvent.press(getByTestId('modal-save-button'));

      // Assert - Error message should be displayed in the modal
      await waitFor(() => {
        expect(getByText('Title is required')).toBeTruthy();
      });
    });
  });

  describe('Editing Tasks', () => {
    it('opens edit modal with current task data when task is long-pressed', async () => {
      // Arrange
      const { getByText, getByTestId } = render(<TasksScreen />);

      // Act - Long press on a task
      fireEvent(getByText(/High Priority Task/), 'onLongPress');

      // Assert - Modal should open with pre-filled data
      await waitFor(() => {
        expect(getByTestId('input-title').props.value).toBe('High Priority Task');
        expect(getByText('Edit Task')).toBeTruthy();
      });
    });

    it('updates task when edit form is submitted', async () => {
      // Arrange
      const { getByText, getByTestId } = render(<TasksScreen />);

      // Act - Long press to open edit modal
      fireEvent(getByText(/High Priority Task/), 'onLongPress');

      // Change the task title
      fireEvent.changeText(getByTestId('input-title'), 'Updated Task Title');

      // Save changes
      fireEvent.press(getByTestId('modal-save-button'));

      // Assert - Check that editTask was called with correct parameters
      await waitFor(() => {
        expect(mockEditTask).toHaveBeenCalledWith(
          '1', // The ID of the high priority task
          'Updated Task Title',
          'High', // Original priority
          expect.any(Date),
        );
      });
    });
  });

  describe('Task Completion', () => {
    it('marks task as completed when pressed', async () => {
      // Arrange
      const { getByText } = render(<TasksScreen />);

      // Act - Press on a task to toggle completion
      fireEvent.press(getByText(/High Priority Task/));

      // Assert - Check that toggleCompleteTask was called
      expect(mockToggleCompleteTask).toHaveBeenCalledWith('1');
    });

    it('visually indicates when a task is completed', async () => {
      // Arrange - First render with normal tasks
      const { getByText, rerender } = render(<TasksScreen />);

      // Act - Update the store to have a completed task
      useTaskStore.mockReturnValue({
        tasks: {
          ...groupedTaskSets.allPriorities,
          high: [{ ...groupedTaskSets.allPriorities.high[0], completed: true }],
        },
        loadTasks: mockLoadTasks,
        addTask: mockAddTask,
        editTask: mockEditTask,
        toggleCompleteTask: mockToggleCompleteTask,
      });

      // Re-render with updated store value
      rerender(<TasksScreen />);

      // Assert - Check that task has strikethrough style
      const taskText = getByText(/High Priority Task/);
      expect(taskText.props.style).toContainEqual(
        expect.objectContaining({
          textDecorationLine: 'line-through',
        }),
      );
    });
  });

  describe('Modal Behavior', () => {
    it('clears form inputs when modal is closed', async () => {
      // Arrange
      const { getByTestId } = render(<TasksScreen />);

      // Act - Open modal, add text, then cancel
      fireEvent.press(getByTestId('fab-add-task'));
      fireEvent.changeText(getByTestId('input-title'), 'Test Task');
      fireEvent.press(getByTestId('modal-cancel-button'));

      // Open the modal again
      fireEvent.press(getByTestId('fab-add-task'));

      // Assert - Input should be cleared
      await waitFor(() => {
        expect(getByTestId('input-title').props.value).toBe('');
      });
    });

    it('closes modal and does not save when cancelled', async () => {
      // Arrange
      const { getByTestId, queryByText } = render(<TasksScreen />);

      // Act - Open modal, then cancel
      fireEvent.press(getByTestId('fab-add-task'));
      fireEvent.press(getByTestId('modal-cancel-button'));

      // Assert
      await waitFor(() => {
        expect(queryByText('Add Task')).toBeNull();
        expect(mockAddTask).not.toHaveBeenCalled();
      });
    });
  });
});
