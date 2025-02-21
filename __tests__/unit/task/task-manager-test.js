import { createTask, editTask, groupAndSortTasks, getTasks, createNewTask, editExistingTask, toggleTaskCompletion } from '../../../managers/task-manager';
import { getTasksFromRepo, saveTasksToRepo } from '../../../repositories/task-repository';
import { Task } from '../../../domain/Task';

jest.mock('../../../repositories/task-repository', () => ({
  getTasksFromRepo: jest.fn(),
  saveTasksToRepo: jest.fn(),
}));

describe('Task Manager', () => {
  const MOCK_TIMESTAMP = 1234567890; // Make the magic number explicit
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() to always return the same timestamp for consistent task IDs
    jest.spyOn(global.Date, 'now').mockImplementation(() => MOCK_TIMESTAMP);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a new task with correct properties', () => {
    const title = 'Test Task';
    const priority = 'High';
    const dueDate = new Date('2025-02-15');

    const task = createTask(title, priority, dueDate);

    expect(task).toBeInstanceOf(Task);
    expect(task.title).toBe(title);
    expect(task.priority).toBe(priority);
    expect(task.dueDate).toEqual(dueDate);  // Changed from toBe to toEqual
    expect(task.completed).toBe(false);
    expect(task.id).toBe('1234567890');
  });

  it('should edit an existing task', () => {
    const task = new Task({
      id: '1',
      title: 'Old Title',
      priority: 'Low',
      dueDate: new Date('2025-01-01'),
      completed: false
    });

    const newTitle = 'New Title';
    const newPriority = 'High';
    const newDueDate = new Date('2025-02-15');

    const editedTask = editTask(task, newTitle, newPriority, newDueDate);

    expect(editedTask.title).toBe(newTitle);
    expect(editedTask.priority).toBe(newPriority);
    expect(editedTask.dueDate).toEqual(newDueDate);
  });

  it('should create and save a new task', async () => {
    const mockTasks = [new Task({
      id: '1',
      title: 'Existing Task',
      priority: 'Low',
      dueDate: new Date('2025-01-01'),
      completed: false
    })];

    getTasksFromRepo.mockResolvedValue(mockTasks);

    const newTitle = 'New Task';
    const newPriority = 'High';
    const newDueDate = new Date('2025-02-15');

    await createNewTask(newTitle, newPriority, newDueDate);

    expect(saveTasksToRepo).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        title: newTitle,
        priority: newPriority,
        dueDate: newDueDate,
        completed: false
      })
    ]));
  });

  it('should edit an existing task and save changes', async () => {
    const mockTasks = [
      new Task({
        id: '1',
        title: 'Task to Edit',
        priority: 'Low',
        dueDate: new Date('2025-01-01'),
        completed: false
      })
    ];

    getTasksFromRepo.mockResolvedValue(mockTasks);

    const updatedTitle = 'Updated Task';
    const updatedPriority = 'High';
    const updatedDueDate = new Date('2025-02-20');

    await editExistingTask('1', updatedTitle, updatedPriority, updatedDueDate);

    expect(saveTasksToRepo).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: '1',
        title: updatedTitle,
        priority: updatedPriority,
        dueDate: updatedDueDate
      })
    ]));
  });

  it('should toggle task completion status', async () => {
    const mockTasks = [
      new Task({
        id: '1',
        title: 'Task',
        priority: 'High',
        dueDate: new Date('2025-01-01'),
        completed: false
      })
    ];

    getTasksFromRepo.mockResolvedValue(mockTasks);

    await toggleTaskCompletion('1');

    expect(saveTasksToRepo).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: '1',
        completed: true
      })
    ]));
  });

  it('should group and sort tasks correctly', () => {
    const tasks = [
      new Task({ id: '1', title: 'Task 1', priority: 'High', dueDate: new Date('2025-02-10') }),
      new Task({ id: '2', title: 'Task 2', priority: 'Medium', dueDate: new Date('2025-02-12') }),
      new Task({ id: '3', title: 'Task 3', priority: 'Low', dueDate: new Date('2025-02-15') }),
      new Task({ id: '4', title: 'Task 4', priority: 'High', dueDate: new Date('2025-02-09') })
    ];

    const groupedTasks = groupAndSortTasks(tasks);

    expect(groupedTasks.high[0].id).toBe('4'); // Earlier date should come first
    expect(groupedTasks.high[1].id).toBe('1');
    expect(groupedTasks.medium[0].id).toBe('2');
    expect(groupedTasks.low[0].id).toBe('3');
  });

  it('should return empty task groups when no tasks are found', async () => {
    getTasksFromRepo.mockResolvedValue([]); // Mock empty repository response
  
    const groupedTasks = await getTasks();
  
    expect(getTasksFromRepo).toHaveBeenCalledTimes(1);
    expect(groupedTasks).toEqual({ high: [], medium: [], low: [] }); // ✅ Should return an empty object, not undefined
  });
  
});
