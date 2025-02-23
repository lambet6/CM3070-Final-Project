import { getTasks, createNewTask, editExistingTask, toggleTaskCompletion } from '../../../managers/task-manager';
import { getTasksFromRepo, saveTasksToRepo } from '../../../repositories/task-repository';
import { Task } from '../../../domain/Task';

jest.mock('../../../repositories/task-repository', () => ({
  getTasksFromRepo: jest.fn(),
  saveTasksToRepo: jest.fn(),
}));

describe('Task Manager', () => {
  const MOCK_TIMESTAMP = 1234567890;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.Date, 'now').mockImplementation(() => MOCK_TIMESTAMP);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Task Creation', () => {
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
  });

  describe('Task Editing', () => {
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
  });

  describe('Task Operations', () => {
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

    it('should return empty task groups when no tasks are found', async () => {
      getTasksFromRepo.mockResolvedValue([]);
    
      const groupedTasks = await getTasks();
    
      expect(getTasksFromRepo).toHaveBeenCalledTimes(1);
      expect(groupedTasks).toEqual({ high: [], medium: [], low: [] });
    });
  });
});
