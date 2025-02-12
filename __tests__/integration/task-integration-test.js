// import React from 'react';
// import { render, fireEvent, waitFor } from '@testing-library/react-native';
// import TasksScreen from '../../screens/TaskScreen';
// import { useTaskStore } from '../../store/taskStore';
// import * as taskRepository from '../../repositories/task-repository';

// jest.mock('../../repositories/task-repository', () => ({
//   getTasksFromRepo: jest.fn(),
//   saveTasksToRepo: jest.fn(),
// }));

// describe('TaskScreen Full Integration', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('loads tasks from the repository on mount', async () => {
//     const mockTasks = [{id: '100', title: 'Existing Task', priority: 'Medium', dueDate: '2025-01-01T10:00:00.000Z' }];

//     taskRepository.getTasksFromRepo.mockResolvedValue(mockTasks);

//     // ✅ Instead of recreating the store, update it directly
//     useTaskStore.setState({ tasks: mockTasks });

//     const { getByText } = render(<TasksScreen />);

//     await waitFor(() => {
//       expect(taskRepository.getTasksFromRepo).toHaveBeenCalledTimes(1);
//       expect(getByText('Existing Task — Wed Jan 01 2025')).toBeTruthy();
//     });
//   });

//   it('adds a new task and ensures it flows through all layers', async () => {
//     const mockNewTask = { id: '100', title: 'New Task', priority: 'Medium', dueDate: new Date() };
    
//     taskRepository.saveTasksToRepo.mockResolvedValue(mockNewTask);

//     // // ✅ Update Zustand store directly instead of recreating it
//     // useTaskStore.setState({ tasks: { high: [], medium: [], low: [] } });

//     const { getByTestId, getByText } = render(<TasksScreen />);

//     fireEvent.press(getByTestId('fab-add-task'));
//     fireEvent.changeText(getByTestId('input-title'), 'New Task');
//     fireEvent.press(getByTestId('modal-save-button'));

//     await waitFor(() => {
//       expect(taskRepository.saveTasksToRepo).toHaveBeenCalledWith([mockNewTask]);
//     });

//     // // ✅ Instead of mocking, update the Zustand state
//     // useTaskStore.setState({ tasks: { high: [{ id: '100', title: 'New Task' }], medium: [], low: [] } });

//     expect(getByText('New Task')).toBeTruthy();
//   });
// });
