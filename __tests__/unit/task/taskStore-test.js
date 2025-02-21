import { act, renderHook } from '@testing-library/react-native';
import { useTaskStore } from '../../../store/taskStore';
import { getTasks, createNewTask, editExistingTask, toggleTaskCompletion } from '../../../managers/task-manager';
import { Task } from '../../../domain/Task';
import { startOfWeek, endOfWeek } from 'date-fns';

jest.mock('../../../managers/task-manager');

describe('TaskStore', () => {
  const mockDate = new Date('2024-02-15T12:00:00.000Z');
  const mockTomorrow = new Date('2024-02-16T12:00:00.000Z');
  const mockNextWeek = new Date('2024-02-22T12:00:00.000Z');

  const mockTask1 = new Task({ 
    id: '1', 
    title: 'Test Task 1', 
    priority: 'High', 
    dueDate: mockDate 
  });
  
  const mockTask2 = new Task({ 
    id: '2', 
    title: 'Test Task 2', 
    priority: 'Medium', 
    dueDate: mockTomorrow 
  });

  const mockTask3 = new Task({ 
    id: '3', 
    title: 'Test Task 3', 
    priority: 'Low', 
    dueDate: mockNextWeek 
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty task groups', () => {
      const { result } = renderHook(() => useTaskStore());
      expect(result.current.tasks).toEqual({ high: [], medium: [], low: [] });
    });
  });

  describe('Task Loading', () => {
    it('should load tasks successfully', async () => {
      const mockTasks = {
        high: [mockTask1],
        medium: [mockTask2],
        low: [mockTask3]
      };
      getTasks.mockResolvedValueOnce(mockTasks);

      const { result } = renderHook(() => useTaskStore());
      await act(async () => {
        await result.current.loadTasks();
      });

      expect(getTasks).toHaveBeenCalledTimes(1);
      expect(result.current.tasks).toEqual(mockTasks);
    });

    it('should handle loading errors gracefully', async () => {
      const error = new Error('Failed to load tasks');
      getTasks.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useTaskStore());
      await act(async () => {
        await result.current.loadTasks();
      });

      expect(result.current.tasks).toEqual({ high: [], medium: [], low: [] });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load tasks:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Task Operations', () => {
    it('should add a new task', async () => {
      const mockUpdatedTasks = {
        high: [mockTask1],
        medium: [],
        low: []
      };
      createNewTask.mockResolvedValueOnce(mockUpdatedTasks);

      const { result } = renderHook(() => useTaskStore());
      await act(async () => {
        await result.current.addTask('Test Task 1', 'High', mockDate);
      });

      expect(createNewTask).toHaveBeenCalledWith('Test Task 1', 'High', mockDate);
      expect(result.current.tasks).toEqual(mockUpdatedTasks);
    });

    it('should edit an existing task', async () => {
      const mockUpdatedTasks = {
        high: [{ ...mockTask1, title: 'Updated Task' }],
        medium: [],
        low: []
      };
      editExistingTask.mockResolvedValueOnce(mockUpdatedTasks);

      const { result } = renderHook(() => useTaskStore());
      await act(async () => {
        await result.current.editTask('1', 'Updated Task', 'High', mockDate);
      });

      expect(editExistingTask).toHaveBeenCalledWith('1', 'Updated Task', 'High', mockDate);
      expect(result.current.tasks).toEqual(mockUpdatedTasks);
    });

    it('should toggle task completion', async () => {
      const mockUpdatedTasks = {
        high: [{ ...mockTask1, completed: true }],
        medium: [],
        low: []
      };
      toggleTaskCompletion.mockResolvedValueOnce(mockUpdatedTasks);

      const { result } = renderHook(() => useTaskStore());
      await act(async () => {
        await result.current.toggleCompleteTask('1');
      });

      expect(toggleTaskCompletion).toHaveBeenCalledWith('1');
      expect(result.current.tasks).toEqual(mockUpdatedTasks);
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      const MockDate = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super(mockDate);
          } else {
            super(...args);
          }
        }
      };
      global.Date = MockDate;
      jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return tasks due today', () => {
      const { result } = renderHook(() => useTaskStore());
      
      act(() => {
        result.current.tasks = {
          high: [mockTask1],
          medium: [mockTask2],
          low: [mockTask3]
        };
      });

      const todayTasks = result.current.getTodayTasks();
      expect(todayTasks).toHaveLength(1);
      expect(todayTasks[0].id).toBe(mockTask1.id);
    });

    it('should return tasks due this week', () => {
      const { result } = renderHook(() => useTaskStore());
      const weekStart = startOfWeek(mockDate);
      const weekEnd = endOfWeek(mockDate);
      
      act(() => {
        result.current.tasks = {
          high: [mockTask1],
          medium: [mockTask2],
          low: [mockTask3]
        };
      });

      const weekTasks = result.current.getWeekTasks();
      expect(weekTasks).toHaveLength(2);
      expect(weekTasks.map(t => t.id)).toEqual(expect.arrayContaining([mockTask1.id, mockTask2.id]));
    });
  });
});
