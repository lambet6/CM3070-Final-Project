import { createTask, editTask, groupAndSortTasks, getTasks, createNewTask, editExistingTask } from '../../../managers/task-manager';
import { getTasksFromRepo, saveTasksToRepo } from '../../../repositories/task-repository';

jest.mock('../../../repositories/task-repository', () => ({
  getTasksFromRepo: jest.fn(),
  saveTasksToRepo: jest.fn(),
}));

describe('Task Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Creating & Saving a New Task
  it('should create a new task and save it to the repository', async () => {
    const mockExistingTasks = [
      { id: '1', title: 'Task 1', priority: 'Low', dueDate: '2025-02-12' }
    ];
    
    getTasksFromRepo.mockResolvedValue(mockExistingTasks);
    
    const newTaskTitle = 'New Task';
    const newPriority = 'High';
    const newDueDate = new Date('2025-02-15');

    await createNewTask(newTaskTitle, newPriority, newDueDate);

    expect(saveTasksToRepo).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: newTaskTitle,
          priority: newPriority,
          dueDate: newDueDate.toISOString(),
        }),
      ])
    );
  });

  // Test Fetching Tasks
  it('should fetch and return grouped tasks from the repository', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', priority: 'Medium', dueDate: '2025-02-12' },
      { id: '2', title: 'Task 2', priority: 'High', dueDate: '2025-02-10' },
    ];
    
    getTasksFromRepo.mockResolvedValue(mockTasks);

    const groupedTasks = await getTasks();

    expect(getTasksFromRepo).toHaveBeenCalledTimes(1);
    expect(groupedTasks.high).toHaveLength(1);
    expect(groupedTasks.medium).toHaveLength(1);
    expect(groupedTasks.low).toHaveLength(0);
  });

  // Test Grouping & Sorting Tasks
  it('should group and sort tasks by priority and due date', () => {
    const tasks = [
      { id: '1', title: 'Task 1', priority: 'Medium', dueDate: '2025-02-12' },
      { id: '2', title: 'Task 2', priority: 'High', dueDate: '2025-02-10' },
      { id: '3', title: 'Task 3', priority: 'Low', dueDate: '2025-02-15' },
      { id: '4', title: 'Task 4', priority: 'High', dueDate: '2025-02-09' },
    ];

    const groupedTasks = groupAndSortTasks(tasks);

    expect(groupedTasks.high).toEqual([
      { id: '4', title: 'Task 4', priority: 'High', dueDate: '2025-02-09' },
      { id: '2', title: 'Task 2', priority: 'High', dueDate: '2025-02-10' },
    ]);
    expect(groupedTasks.medium).toEqual([
      { id: '1', title: 'Task 1', priority: 'Medium', dueDate: '2025-02-12' },
    ]);
    expect(groupedTasks.low).toEqual([
      { id: '3', title: 'Task 3', priority: 'Low', dueDate: '2025-02-15' },
    ]);
  });

  // Test Editing an Existing Task & Saving It
  it('should update an existing task and save changes', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', priority: 'Low', dueDate: '2025-02-12' },
      { id: '2', title: 'Old Task', priority: 'Medium', dueDate: '2025-02-15' }
    ];

    getTasksFromRepo.mockResolvedValue(mockTasks);

    const taskIdToEdit = '2';
    const updatedTitle = 'Updated Task';
    const updatedPriority = 'High';
    const updatedDueDate = new Date('2025-02-20');

    const updatedTasks = await editExistingTask(taskIdToEdit, updatedTitle, updatedPriority, updatedDueDate);

    expect(getTasksFromRepo).toHaveBeenCalledTimes(1);
    expect(saveTasksToRepo).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '2',
          title: updatedTitle,
          priority: updatedPriority,
          dueDate: updatedDueDate.toISOString(),
        }),
      ])
    );
    expect(updatedTasks.high).toHaveLength(1); // Task should now be in "High" category
  });

  it('should return empty task groups when no tasks are found', async () => {
    getTasksFromRepo.mockResolvedValue([]); // Mock empty repository response
  
    const groupedTasks = await getTasks();
  
    expect(getTasksFromRepo).toHaveBeenCalledTimes(1);
    expect(groupedTasks).toEqual({ high: [], medium: [], low: [] }); // ✅ Should return an empty object, not undefined
  });
  
});
