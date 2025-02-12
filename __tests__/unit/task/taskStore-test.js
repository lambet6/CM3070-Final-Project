import { act, renderHook } from '@testing-library/react-native';
import { useTaskStore } from '../../../store/taskStore';
import { getTasks, createNewTask, editExistingTask } from '../../../managers/task-manager';
import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';

jest.mock('../../../managers/task-manager', () => ({
  getTasks: jest.fn(),
  createNewTask: jest.fn(),
  editExistingTask: jest.fn()
}));

describe('Task Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Loading Tasks from Task Manager
  it('should load tasks from task manager', async () => {
    const mockTasks = { high: [], medium: [], low: [] };
    getTasks.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(getTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks).toEqual(mockTasks);
  });

  // Adding a Task
  it('should add a new task and update state', async () => {
    const mockUpdatedTasks = {
      high: [{ id: '1', title: 'New Task', priority: 'High', dueDate: '2025-02-15' }],
      medium: [],
      low: []
    };
    createNewTask.mockResolvedValue(mockUpdatedTasks);

    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.addTask('New Task', 'High', new Date('2025-02-15'));
    });

    expect(createNewTask).toHaveBeenCalledWith('New Task', 'High', new Date('2025-02-15'));
    expect(result.current.tasks).toEqual(mockUpdatedTasks);
  });

  // Editing a Task
  it('should edit an existing task and update state', async () => {
    const mockUpdatedTasks = {
      high: [{ id: '1', title: 'Updated Task', priority: 'High', dueDate: '2025-02-18' }],
      medium: [],
      low: []
    };
    editExistingTask.mockResolvedValue(mockUpdatedTasks);

    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.editTask('1', 'Updated Task', 'High', new Date('2025-02-18'));
    });

    expect(editExistingTask).toHaveBeenCalledWith('1', 'Updated Task', 'High', new Date('2025-02-18'));
    expect(result.current.tasks).toEqual(mockUpdatedTasks);
  });

  // Getting Today’s Tasks
  it('should return tasks due today', () => {
    const today = new Date();
    const mockTasks = {
      high: [{ id: '1', title: 'Today Task', priority: 'High', dueDate: today.toISOString() }],
      medium: [],
      low: []
    };

    const { result } = renderHook(() => useTaskStore());
    act(() => {
      result.current.tasks = mockTasks;
    });

    const todayTasks = result.current.getTodayTasks();
    expect(todayTasks).toHaveLength(1);
    expect(todayTasks[0].title).toBe('Today Task');
  });

  // Getting This Week’s Tasks
  it('should return tasks due this week', () => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());

    const mockTasks = {
      high: [{ id: '2', title: 'Week Task', priority: 'High', dueDate: start.toISOString() }],
      medium: [],
      low: []
    };

    const { result } = renderHook(() => useTaskStore());
    act(() => {
      result.current.tasks = mockTasks;
    });

    const weekTasks = result.current.getWeekTasks();
    expect(weekTasks).toHaveLength(1);
    expect(weekTasks[0].title).toBe('Week Task');
  });
});
