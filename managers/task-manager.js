import { Task } from '../domain/Task';

/**
 * @typedef {Object} GroupedTasks
 * @property {Task[]} high
 * @property {Task[]} medium
 * @property {Task[]} low
 */

/**
 * Creates a task manager that uses the provided repository
 * @param {Object} repository - Repository with getTasks and saveTasks methods
 * @returns {Object} Task manager functions
 */
export const createTaskManager = (repository) => {
  /**
   * Groups and sorts tasks by priority
   * @param {Task[]} tasks
   * @returns {GroupedTasks}
   */
  const groupAndSortTasks = (tasks) => {
    const high = tasks.filter((t) => t.priority === 'High');
    const medium = tasks.filter((t) => t.priority === 'Medium');
    const low = tasks.filter((t) => t.priority === 'Low');

    const sortTasks = (tasks) =>
      tasks.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return a.dueDate - b.dueDate;
      });

    return {
      high: sortTasks(high),
      medium: sortTasks(medium),
      low: sortTasks(low),
    };
  };

  /**
   * Helper to create a new Task instance
   * @param {string} title
   * @param {string} priority
   * @param {Date} dueDate
   * @returns {Task}
   */
  const createTask = (title, priority, dueDate) => {
    return new Task({
      id: Date.now().toString(),
      title,
      priority,
      dueDate,
      completed: false,
    });
  };

  /**
   * Helper to update an existing Task instance
   * @param {Task} task
   * @param {string} newTitle
   * @param {string} newPriority
   * @param {Date} newDueDate
   * @returns {Task}
   */
  const editTask = (task, newTitle, newPriority, newDueDate) => {
    task.setTitle(newTitle);
    task.setPriority(newPriority);
    task.setDueDate(newDueDate);
    return task;
  };

  /**
   * Creates a new Task instance and persists it
   * @param {string} title
   * @param {string} priority
   * @param {Date} dueDate
   * @returns {Promise<GroupedTasks>}
   */
  const createNewTask = async (title, priority, dueDate) => {
    // Pre-validation for clear error messages
    if (!title?.trim()) {
      throw new Error('Task title is required');
    }
    if (!['Low', 'Medium', 'High'].includes(priority)) {
      throw new Error('Invalid priority value');
    }
    if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
      throw new Error('Valid due date is required');
    }

    try {
      const tasks = await repository.getTasks();
      const newTask = createTask(title, priority, dueDate);
      tasks.push(newTask);
      await repository.saveTasks(tasks);
      return groupAndSortTasks(tasks);
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  };

  /**
   * Edits an existing task and persists the change
   * @param {string} taskId
   * @param {string} newTitle
   * @param {string} newPriority
   * @param {Date} newDueDate
   * @returns {Promise<GroupedTasks>}
   */
  const editExistingTask = async (taskId, newTitle, newPriority, newDueDate) => {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    if (!newTitle?.trim()) {
      throw new Error('Task title is required');
    }
    if (!['Low', 'Medium', 'High'].includes(newPriority)) {
      throw new Error('Invalid priority value');
    }
    if (!(newDueDate instanceof Date) || isNaN(newDueDate.getTime())) {
      throw new Error('Valid due date is required');
    }

    try {
      const tasks = await repository.getTasks();
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate) {
        throw new Error('Task not found');
      }
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? editTask(t, newTitle, newPriority, newDueDate) : t,
      );
      await repository.saveTasks(updatedTasks);
      return groupAndSortTasks(updatedTasks);
    } catch (error) {
      throw new Error(`Failed to edit task: ${error.message}`);
    }
  };

  /**
   * Toggles the completion status of a task and persists the change
   * @param {string} taskId
   * @returns {Promise<GroupedTasks>}
   */
  const toggleTaskCompletion = async (taskId) => {
    try {
      const tasks = await repository.getTasks();
      const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
          t.toggleCompletion();
        }
        return t;
      });
      await repository.saveTasks(updatedTasks);
      return groupAndSortTasks(updatedTasks);
    } catch (error) {
      throw new Error(`Failed to toggle task completion: ${error.message}`);
    }
  };

  /**
   * Deletes tasks by ID and persists the change
   * @param {string[]} taskIds
   * @returns {Promise<GroupedTasks>}
   */
  const deleteTasks = async (taskIds) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new Error('At least one task ID is required');
    }

    try {
      const tasks = await repository.getTasks();
      const nonExistentTasks = taskIds.filter((id) => !tasks.some((t) => t.id === id));

      if (nonExistentTasks.length > 0) {
        throw new Error(`Tasks not found: ${nonExistentTasks.join(', ')}`);
      }

      const updatedTasks = tasks.filter((t) => !taskIds.includes(t.id));
      await repository.saveTasks(updatedTasks);
      return groupAndSortTasks(updatedTasks);
    } catch (error) {
      throw new Error(`Failed to delete tasks: ${error.message}`);
    }
  };

  /**
   * Fetches all tasks, groups, and sorts them
   * @returns {Promise<GroupedTasks>}
   */
  const getTasks = async () => {
    try {
      const tasks = await repository.getTasks();
      return groupAndSortTasks(tasks);
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  };

  const consolidateTasks = (tasks) => {
    return [
      ...tasks.high.map((task) => ({ ...task, priority: 'High' })),
      ...tasks.medium.map((task) => ({ ...task, priority: 'Medium' })),
      ...tasks.low.map((task) => ({ ...task, priority: 'Low' })),
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  /**
   * Reschedules all overdue and incomplete tasks to a future date
   * @param {number} daysToAdd - Number of days to add to the current date
   * @returns {Promise<{tasks: GroupedTasks, count: number}>} - Updated tasks and count of rescheduled tasks
   */
  const rescheduleOverdueTasks = async (daysToAdd = 1) => {
    try {
      const tasks = await repository.getTasks();
      let rescheduledCount = 0;

      const updatedTasks = tasks.map((task) => {
        if (!task.completed && task.isOverdue()) {
          const newDueDate = new Date();
          newDueDate.setDate(newDueDate.getDate() + daysToAdd);
          task.setDueDate(newDueDate);
          rescheduledCount++;
        }
        return task;
      });

      if (rescheduledCount > 0) {
        await repository.saveTasks(updatedTasks);
      }

      return {
        tasks: groupAndSortTasks(updatedTasks),
        count: rescheduledCount,
      };
    } catch (error) {
      throw new Error(`Failed to reschedule overdue tasks: ${error.message}`);
    }
  };

  return {
    createNewTask,
    editExistingTask,
    toggleTaskCompletion,
    deleteTasks,
    getTasks,
    consolidateTasks,
    rescheduleOverdueTasks, // Add this to the returned object
  };
};
