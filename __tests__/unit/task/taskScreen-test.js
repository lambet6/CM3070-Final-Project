import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useTaskStore } from '../../../store/taskStore';
import TasksScreen from '../../../screens/TaskScreen';

jest.mock('../../../store/taskStore', () => ({
  useTaskStore: jest.fn(),
}));

describe('TaskScreen', () => {
  const mockTasks = {
    high: [{ id: '1', title: 'High Task', priority: 'High', dueDate: new Date('2025-02-10'), completed: false }],
    medium: [{ id: '2', title: 'Medium Task', priority: 'Medium', dueDate: new Date('2025-02-11'), completed: false }],
    low: [{ id: '3', title: 'Low Task', priority: 'Low', dueDate: new Date('2025-02-12'), completed: false }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useTaskStore.mockReturnValue({
      tasks: mockTasks,
      loadTasks: jest.fn(),
      addTask: jest.fn(),
      editTask: jest.fn(),
      toggleCompleteTask: jest.fn()
    });
  });

  describe('Task Display', () => {
    it('displays tasks organized in priority sections', async() => {
      const { getByText } = render(<TasksScreen />);
      
      await waitFor(() => {
        // Verify priority sections are visible
        expect(getByText('High Priority')).toBeTruthy();
        expect(getByText('Medium Priority')).toBeTruthy();
        expect(getByText('Low Priority')).toBeTruthy();
        
        // Verify tasks are displayed under correct sections
        expect(getByText(/High Task/)).toBeTruthy();
        expect(getByText(/Medium Task/)).toBeTruthy();
        expect(getByText(/Low Task/)).toBeTruthy();
      });

    });

    it('shows task due dates alongside task titles', async () => {
      const { getByText } = render(<TasksScreen />);
      await waitFor(() => {
        expect(getByText('High Task — Mon Feb 10 2025')).toBeTruthy();
        expect(getByText('Medium Task — Tue Feb 11 2025')).toBeTruthy();
        expect(getByText('Low Task — Wed Feb 12 2025')).toBeTruthy();
      });
    });
  });

  describe('Adding Tasks', () => {
    it('shows add task modal when FAB is pressed', async () => {
      const { getByTestId, getByText } = render(<TasksScreen />);
      
      fireEvent.press(getByTestId('fab-add-task'));
      
      await waitFor(() => {
        expect(getByText('Add Task')).toBeTruthy();
        expect(getByTestId('input-title')).toBeTruthy();
        expect(getByTestId('picker-priority')).toBeTruthy();
      });
    });

    it('displays the new task in UI after adding', async () => {
      const { getByTestId, getByText } = render(<TasksScreen />);
      
      fireEvent.press(getByTestId('fab-add-task'));
      fireEvent.changeText(getByTestId('input-title'), 'New Test Task');
      fireEvent.press(getByTestId('modal-save-button'));

      useTaskStore.mockReturnValue({
        tasks: {
          ...mockTasks,
          medium: [...mockTasks.medium, { id: '4', title: 'New Test Task', priority: 'Medium', dueDate: new Date(), completed: false }]
        },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: jest.fn(),
        toggleCompleteTask: jest.fn()
      });

      const { getByText: getByTextAfterUpdate } = render(<TasksScreen />);
      await waitFor(() => {
        expect(getByTextAfterUpdate(/New Test Task/)).toBeTruthy();
      });
    });
  });

  describe('Editing Tasks', () => {
    it('opens edit modal with current task data when task is long-pressed', async () => {
      const { getByText, getByTestId } = render(<TasksScreen />);
      
      fireEvent(getByText(/High Task/), 'onLongPress');
      
      await waitFor(() => {
        expect(getByTestId('input-title').props.value).toBe('High Task');
        expect(getByText('Edit Task')).toBeTruthy();
      });
    });

    it('updates task display after editing', async () => {
      const { getByText, getByTestId } = render(<TasksScreen />);
      
      fireEvent(getByText(/High Task/), 'onLongPress');
      fireEvent.changeText(getByTestId('input-title'), 'Updated Task Title');
      fireEvent.press(getByTestId('modal-save-button'));

      useTaskStore.mockReturnValue({
        tasks: {
          ...mockTasks,
          high: [{ ...mockTasks.high[0], title: 'Updated Task Title' }]
        },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: jest.fn(),
        toggleCompleteTask: jest.fn()
      });

      const { getByText: getByTextAfterUpdate } = render(<TasksScreen />);
      await waitFor(() => {
        expect(getByTextAfterUpdate('Updated Task Title — Mon Feb 10 2025')).toBeTruthy();
      });
    });
  });

  describe('Task Completion', () => {
    it('visually indicates when a task is completed', async () => {
      const { getByText } = render(<TasksScreen />);
      
      fireEvent.press(getByText(/High Task/));

      useTaskStore.mockReturnValue({
        tasks: {
          ...mockTasks,
          high: [{ ...mockTasks.high[0], completed: true }]
        },
        loadTasks: jest.fn(),
        addTask: jest.fn(),
        editTask: jest.fn(),
        toggleCompleteTask: jest.fn()
      });

      const { getByText: getByTextAfterUpdate } = render(<TasksScreen />);
      await waitFor(() => {
        const taskText = getByTextAfterUpdate(/High Task/);
        const taskItem = taskText.parent.parent;
        expect(taskItem.props.style).toMatchObject({
          backgroundColor: '#d3d3d3'
        });
      });
    });
  });

  describe('Modal Behavior', () => {
    it('clears form inputs when modal is closed', async () => {
      const { getByTestId } = render(<TasksScreen />);
      
      fireEvent.press(getByTestId('fab-add-task'));
      fireEvent.changeText(getByTestId('input-title'), 'Test Task');
      fireEvent.press(getByTestId('modal-cancel-button'));
      fireEvent.press(getByTestId('fab-add-task'));

      await waitFor(() => {
        expect(getByTestId('input-title').props.value).toBe('');
      });
    });

    it('removes modal from view when cancelled', async () => {
      const { getByTestId, queryByTestId } = render(<TasksScreen />);
      
      fireEvent.press(getByTestId('fab-add-task'));
      
      await waitFor(() => {
        expect(getByTestId('task-modal')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('modal-cancel-button'));
      
      await waitFor(() => {
        expect(queryByTestId('task-modal')).toBeNull();
      });
    });
  });
});
