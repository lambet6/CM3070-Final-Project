import {
    loadTasksFromStorage,
    saveTasksToStorage
  } from '../../Servers/tasks-server';
  
  import {
    createTask,
    editTask,
    groupAndSortTasks,
    getTasks,
    createNewTask,
    editExistingTask
  } from '../../services/task-manager';
  
  // Mock the tasks-server module
  jest.mock('../../Servers/tasks-server', () => ({
    loadTasksFromStorage: jest.fn(),
    saveTasksToStorage: jest.fn()
  }));
  
  describe('taskManager (unit)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    // --- Test the lower-level pure functions (optional) ---
  
    it('createTask generates a task with an ID, title, priority, and ISO date', () => {
      const result = createTask('Test Title', 'High', new Date('2025-02-01'));
      expect(result.title).toBe('Test Title');
      expect(result.priority).toBe('High');
      expect(typeof result.id).toBe('string');
      expect(result.dueDate).toBe('2025-02-01T00:00:00.000Z'); // or local offset
    });
  
    it('editTask updates fields while preserving the original ID', () => {
      const original = {
        id: '123',
        title: 'Old Title',
        priority: 'Low',
        dueDate: '2025-01-01T00:00:00.000Z'
      };
      const result = editTask(original, 'New Title', 'High', new Date('2025-03-10'));
      expect(result.id).toBe('123');
      expect(result.title).toBe('New Title');
      expect(result.priority).toBe('High');
      expect(result.dueDate).toBe('2025-03-10T00:00:00.000Z');
    });
  
    it('groupAndSortTasks splits tasks by priority and sorts by date', () => {
      const tasks = [
        { id: '1', title: 'High 2', priority: 'High', dueDate: '2025-03-02T00:00:00Z' },
        { id: '2', title: 'Low 1', priority: 'Low', dueDate: '2025-03-01T00:00:00Z' },
        { id: '3', title: 'High 1', priority: 'High', dueDate: '2025-01-01T00:00:00Z' },
        { id: '4', title: 'Medium 1', priority: 'Medium', dueDate: '2025-02-01T00:00:00Z' },
      ];
      const { high, medium, low } = groupAndSortTasks(tasks);
  
      // Check grouping
      expect(high.length).toBe(2);
      expect(medium.length).toBe(1);
      expect(low.length).toBe(1);
  
      // Check sorting (by dueDate ascending)
      expect(high[0].title).toBe('High 1'); // earliest date
      expect(high[1].title).toBe('High 2');
    });
  
    // --- Test the higher-level async functions that use storage ---
  
    it('getTasks loads from storage and returns grouped/sorted tasks', async () => {
      loadTasksFromStorage.mockResolvedValueOnce([
        { id: '10', title: 'Task10', priority: 'Low', dueDate: '2025-03-01T00:00:00Z' },
        { id: '11', title: 'Task11', priority: 'High', dueDate: '2025-01-01T00:00:00Z' }
      ]);
  
      const grouped = await getTasks();
      expect(loadTasksFromStorage).toHaveBeenCalledTimes(1);
      // grouped is { high: [...], medium: [...], low: [...] }
      expect(grouped.high.length).toBe(1);
      expect(grouped.low.length).toBe(1);
      expect(grouped.medium.length).toBe(0);
    });
  
    it('createNewTask loads tasks, adds new one, saves, and returns grouped data', async () => {
      loadTasksFromStorage.mockResolvedValueOnce([
        { id: '1', title: 'Existing Task', priority: 'Medium', dueDate: '2025-04-01T00:00:00Z' }
      ]);
  
      const newTitle = 'New Task';
      const newPriority = 'High';
      const newDate = new Date('2025-05-01');
  
      const grouped = await createNewTask(newTitle, newPriority, newDate);
  
      // load, then save
      expect(loadTasksFromStorage).toHaveBeenCalledTimes(1);
      expect(saveTasksToStorage).toHaveBeenCalledTimes(1);
  
      // The returned grouped should contain the old + new task
      expect(grouped.high.length).toBe(1);
      expect(grouped.medium.length).toBe(1);
  
      // The new task should have the correct title & date
      const savedArg = saveTasksToStorage.mock.calls[0][0]; // the array we saved
      const createdTask = savedArg.find((t) => t.title === newTitle);
      expect(createdTask.priority).toBe('High');
      expect(createdTask.dueDate).toBe('2025-05-01T00:00:00.000Z');
    });
  
    it('editExistingTask loads tasks, edits one, saves, and returns grouped data', async () => {
      loadTasksFromStorage.mockResolvedValueOnce([
        { id: '999', title: 'Old Title', priority: 'Low', dueDate: '2025-06-01T00:00:00Z' }
      ]);
  
      const updated = await editExistingTask(
        '999',
        'Edited Title',
        'High',
        new Date('2025-07-01')
      );
  
      expect(loadTasksFromStorage).toHaveBeenCalled();
      expect(saveTasksToStorage).toHaveBeenCalled();
  
      // The result is grouped by new priority
      expect(updated.high.length).toBe(1);
      expect(updated.low.length).toBe(0);
  
      // The saved tasks array
      const saved = saveTasksToStorage.mock.calls[0][0];
      expect(saved[0].title).toBe('Edited Title');
      expect(saved[0].priority).toBe('High');
      expect(saved[0].dueDate).toBe('2025-07-01T00:00:00.000Z');
    });
  });
  