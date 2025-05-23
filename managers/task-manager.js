import { endOfDay, isAfter, isSameDay, startOfDay } from 'date-fns';
import { Task } from '../domain/Task';

/**
 * @typedef {Object} GroupedTasks
 * @property {Task[]} high
 * @property {Task[]} medium
 * @property {Task[]} low
 */

/**
 * Creates a task manager that uses the provided repository and store
 * @param {Object} repository - Repository with getTasks and saveTasks methods
 * @param {Function} getStore - Function to get the store state/actions
 * @returns {Object} Task manager functions
 */
export const createTaskManager = (repository, getStore) => {
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
   * @param {number} [duration=30]
   * @param {Date|null} [scheduledTime=null]
   * @returns {Task}
   */
  const createTask = (title, priority, dueDate, duration = 30, scheduledTime = null) => {
    return new Task({
      id: Date.now().toString(),
      title,
      priority,
      dueDate,
      completed: false,
      duration,
      scheduledTime,
    });
  };

  /**
   * Helper to update an existing Task instance
   * @param {Task} task
   * @param {string} newTitle
   * @param {string} newPriority
   * @param {Date} newDueDate
   * @param {number} [newDuration]
   * @param {Date|null} [newScheduledTime]
   * @returns {Task}
   */
  const editTask = (task, newTitle, newPriority, newDueDate, newDuration, newScheduledTime) => {
    task.setTitle(newTitle);
    task.setPriority(newPriority);
    task.setDueDate(newDueDate);
    if (newDuration) task.setDuration(newDuration);
    if (newScheduledTime !== undefined) task.setScheduledTime(newScheduledTime);
    return task;
  };

  /**
   * Loads tasks and updates the store
   * @returns {Promise<GroupedTasks>}
   */
  const loadTasks = async () => {
    const store = getStore();

    try {
      const tasks = await repository.getTasks();
      const groupedTasks = groupAndSortTasks(tasks);
      store.setTasks(groupedTasks);
      store.setError(null);
      return groupedTasks;
    } catch (error) {
      console.error('Failed to load tasks:', error);
      store.setError(error.message || 'Failed to load tasks');
      store.setTasks({ high: [], medium: [], low: [] });
      throw error;
    }
  };

  /**
   * Creates a new Task instance, persists it, and updates the store
   * @param {string} title
   * @param {string} priority
   * @param {Date} dueDate
   * @param {number} [duration=30]
   * @param {Date|null} [scheduledTime=null]
   * @returns {Promise<GroupedTasks>}
   */
  const createNewTask = async (title, priority, dueDate, duration = 30, scheduledTime = null) => {
    const store = getStore();

    // Pre-validation for clear error messages
    if (!title?.trim()) {
      store.setError('Task title is required');
      throw new Error('Task title is required');
    }
    if (!['Low', 'Medium', 'High'].includes(priority)) {
      store.setError('Invalid priority value');
      throw new Error('Invalid priority value');
    }
    if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
      store.setError('Valid due date is required');
      throw new Error('Valid due date is required');
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      store.setError('Duration must be a positive integer');
      throw new Error('Duration must be a positive integer');
    }
    if (scheduledTime && (!(scheduledTime instanceof Date) || isNaN(scheduledTime.getTime()))) {
      store.setError('Invalid scheduled time');
      throw new Error('Invalid scheduled time');
    }

    try {
      const tasks = await repository.getTasks();
      const newTask = createTask(title, priority, dueDate, duration, scheduledTime);
      tasks.push(newTask);
      await repository.saveTasks(tasks);

      const groupedTasks = groupAndSortTasks(tasks);
      store.setTasks(groupedTasks);
      store.setError(null);
      return groupedTasks;
    } catch (error) {
      const errorMessage = `Failed to create task: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Edits an existing task, persists the change, and updates the store
   * @param {string} taskId
   * @param {string} newTitle
   * @param {string} newPriority
   * @param {Date} newDueDate
   * @param {number} [newDuration]
   * @param {Date|null} [newScheduledTime]
   * @returns {Promise<GroupedTasks>}
   */
  const editExistingTask = async (
    taskId,
    newTitle,
    newPriority,
    newDueDate,
    newDuration,
    newScheduledTime,
  ) => {
    const store = getStore();

    if (!taskId) {
      store.setError('Task ID is required');
      throw new Error('Task ID is required');
    }
    if (!newTitle?.trim()) {
      store.setError('Task title is required');
      throw new Error('Task title is required');
    }
    if (!['Low', 'Medium', 'High'].includes(newPriority)) {
      store.setError('Invalid priority value');
      throw new Error('Invalid priority value');
    }
    if (!(newDueDate instanceof Date) || isNaN(newDueDate.getTime())) {
      store.setError('Valid due date is required');
      throw new Error('Valid due date is required');
    }
    if (newDuration && (!Number.isInteger(newDuration) || newDuration <= 0)) {
      store.setError('Duration must be a positive integer');
      throw new Error('Duration must be a positive integer');
    }
    if (
      newScheduledTime &&
      (!(newScheduledTime instanceof Date) || isNaN(newScheduledTime.getTime()))
    ) {
      store.setError('Invalid scheduled time');
      throw new Error('Invalid scheduled time');
    }

    try {
      const tasks = await repository.getTasks();
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate) {
        const errorMessage = 'Task not found';
        store.setError(errorMessage);
        throw new Error(errorMessage);
      }

      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? editTask(t, newTitle, newPriority, newDueDate, newDuration, newScheduledTime)
          : t,
      );

      await repository.saveTasks(updatedTasks);
      const groupedTasks = groupAndSortTasks(updatedTasks);
      store.setTasks(groupedTasks);
      store.setError(null);
      return groupedTasks;
    } catch (error) {
      const errorMessage = `Failed to edit task: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Toggles the completion status of a task, persists the change, and updates the store
   * @param {string} taskId
   * @returns {Promise<GroupedTasks>}
   */
  const toggleTaskCompletion = async (taskId) => {
    const store = getStore();

    try {
      const tasks = await repository.getTasks();
      const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
          t.toggleCompletion();
        }
        return t;
      });

      await repository.saveTasks(updatedTasks);
      const groupedTasks = groupAndSortTasks(updatedTasks);
      store.setTasks(groupedTasks);
      return groupedTasks;
    } catch (error) {
      const errorMessage = `Failed to toggle task completion: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Deletes tasks by ID, persists the change, and updates the store
   * @param {string[]} taskIds
   * @returns {Promise<GroupedTasks>}
   */
  const deleteTasks = async (taskIds) => {
    const store = getStore();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      const errorMessage = 'At least one task ID is required';
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const tasks = await repository.getTasks();
      const nonExistentTasks = taskIds.filter((id) => !tasks.some((t) => t.id === id));

      if (nonExistentTasks.length > 0) {
        const errorMessage = `Tasks not found: ${nonExistentTasks.join(', ')}`;
        store.setError(errorMessage);
        throw new Error(errorMessage);
      }

      const updatedTasks = tasks.filter((t) => !taskIds.includes(t.id));
      await repository.saveTasks(updatedTasks);

      const groupedTasks = groupAndSortTasks(updatedTasks);
      store.setTasks(groupedTasks);
      store.setError(null);
      return groupedTasks;
    } catch (error) {
      const errorMessage = `Failed to delete tasks: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Reschedules all overdue and incomplete tasks to a future date
   * @param {number} daysToAdd - Number of days to add to the current date
   * @returns {Promise<{tasks: GroupedTasks, count: number}>} - Updated tasks and count of rescheduled tasks
   */
  const rescheduleOverdueTasks = async (daysToAdd = 1) => {
    const store = getStore();

    // Skip if we've already rescheduled this session
    if (store.hasRescheduledThisSession) {
      return { tasks: store.tasks, count: 0 };
    }

    try {
      const tasks = await repository.getTasks();
      let rescheduledCount = 0;

      const updatedTasks = tasks.map((task) => {
        if (!task.completed && task.isOverdue()) {
          const newDueDate = new Date();
          newDueDate.setDate(newDueDate.getDate() + daysToAdd);
          task.setDueDate(newDueDate);
          task.setScheduledTime(null);
          rescheduledCount++;
        }
        return task;
      });

      if (rescheduledCount > 0) {
        await repository.saveTasks(updatedTasks);
        const groupedTasks = groupAndSortTasks(updatedTasks);
        store.setTasks(groupedTasks);
      }

      store.setHasRescheduledThisSession(true);
      store.setError(null);

      return {
        tasks: groupAndSortTasks(updatedTasks),
        count: rescheduledCount,
      };
    } catch (error) {
      const errorMessage = `Failed to reschedule overdue tasks: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Clears scheduling for all tasks scheduled on a specific date
   * @param {Date} date - The date to clear schedules for
   * @returns {Promise<{tasks: GroupedTasks, count: number}>} - Updated tasks and count of affected tasks
   */
  const clearSchedulesForDate = async (date) => {
    const store = getStore();

    // Validate the date parameter
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      const errorMessage = 'Valid date is required';
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }

    // Convert input date to start of day for comparison
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    try {
      const tasks = await repository.getTasks();
      let clearedCount = 0;

      const updatedTasks = tasks.map((task) => {
        // Check if task has a scheduledTime and it falls on the target date
        if (task.scheduledTime) {
          const scheduledDate = new Date(task.scheduledTime);
          scheduledDate.setHours(0, 0, 0, 0);

          // If scheduled time is on the target date, clear it
          if (scheduledDate.getTime() === targetDate.getTime()) {
            task.setScheduledTime(null);
            clearedCount++;
          }
        }
        return task;
      });

      if (clearedCount > 0) {
        await repository.saveTasks(updatedTasks);
        const groupedTasks = groupAndSortTasks(updatedTasks);
        store.setTasks(groupedTasks);
      }

      store.setError(null);

      return {
        tasks: groupAndSortTasks(updatedTasks),
        count: clearedCount,
      };
    } catch (error) {
      const errorMessage = `Failed to clear schedules: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Removes completed tasks and archives them to history
   * @returns {Promise<GroupedTasks>} Updated tasks after removal
   */
  const cleanupCompletedTasks = async () => {
    const store = getStore();

    try {
      const tasks = await repository.getTasks();
      const completedTasks = tasks.filter((task) => task.completed);
      const remainingTasks = tasks.filter((task) => !task.completed);

      // If there are completed tasks, save them to history
      if (completedTasks.length > 0) {
        // Save each completed task to history
        for (const task of completedTasks) {
          await repository.saveCompletedTask(task);
        }

        // Update active tasks list without completed ones
        await repository.saveTasks(remainingTasks);
        const groupedTasks = groupAndSortTasks(remainingTasks);
        store.setTasks(groupedTasks);
        store.setError(null);
        return groupedTasks;
      }

      // If no completed tasks, just return the current state
      return groupAndSortTasks(tasks);
    } catch (error) {
      const errorMessage = `Failed to cleanup completed tasks: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Checks if the day has changed since last check and performs cleanup if needed
   * @returns {Promise<boolean>} Whether cleanup was performed
   */
  const checkDayChangeAndCleanup = async () => {
    const store = getStore();
    try {
      const lastCleanup = await repository.getLastCleanupDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      let shouldCleanup = false;

      if (lastCleanup) {
        const lastCleanupDay = new Date(lastCleanup);
        lastCleanupDay.setHours(0, 0, 0, 0); // Start of last cleanup day
        shouldCleanup = today > lastCleanupDay;
      } else {
        shouldCleanup = true;
      }

      if (shouldCleanup) {
        // Update the last cleanup date
        await repository.updateLastCleanupDate();
        await cleanupCompletedTasks();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed day change check:', error);
      store.setError(`Day change check failed: ${error.message}`);
      return false;
    }
  };

  /**
   * Retrieves tasks filtered by their relationship to the specified date
   * @param {Date} date - The date to filter tasks by
   * @param {boolean} [excludeCompleted=true] - Whether to exclude completed tasks
   * @returns {Promise<DateFilteredTasks>} Tasks categorized by their relationship to the specified date
   */
  const getTasksForDate = async (date, excludeCompleted = true) => {
    const targetDate = startOfDay(new Date(date));
    const endDate = endOfDay(new Date(date));

    try {
      // Get all tasks
      const tasks = await repository.getTasks();

      // Filter tasks based on date criteria
      const filteredTasks = tasks.filter((task) => !excludeCompleted || !task.completed);

      // Categorize tasks based on due date and scheduled time
      const dueToday = filteredTasks.filter((task) => isSameDay(task.dueDate, targetDate));

      const dueAfter = filteredTasks.filter((task) => isAfter(task.dueDate, endDate));

      const scheduledToday = filteredTasks.filter((task) => {
        if (!task.scheduledTime) return false;
        return isSameDay(task.scheduledTime, targetDate);
      });

      return {
        dueToday,
        dueAfter,
        scheduledToday,
      };
    } catch (error) {
      console.error('Failed to get tasks for date:', error);
      throw error;
    }
  };

  /**
   * Updates scheduled times for multiple tasks in a single operation
   * @param {Array<{id: string, scheduledTime: Date}>} tasksWithScheduledTimes - Array of task IDs and their scheduled times
   * @returns {Promise<GroupedTasks>} Updated tasks
   */
  const updateTaskScheduledTimes = async (tasksWithScheduledTimes) => {
    const store = getStore();

    try {
      const tasks = await repository.getTasks();
      let updatedCount = 0;

      const updatedTasks = tasks.map((task) => {
        const scheduledTimeUpdate = tasksWithScheduledTimes.find((t) => t.id === task.id);
        if (scheduledTimeUpdate) {
          updatedCount++;
          // Create a completely new Task object
          return new Task({
            id: task.id,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate,
            completed: task.completed,
            duration: task.duration,
            scheduledTime: scheduledTimeUpdate.scheduledTime,
          });
        }
        return task;
      });

      if (updatedCount > 0) {
        await repository.saveTasks(updatedTasks);

        const groupedTasks = groupAndSortTasks(updatedTasks);
        store.setTasks(groupedTasks); // This needs to create NEW references
      }

      store.setError(null);
      return groupAndSortTasks(updatedTasks);
    } catch (error) {
      const errorMessage = `Failed to update scheduled times: ${error.message}`;
      store.setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Loads completed tasks from repository and updates the store
   * @returns {Promise<Array>} Completed tasks
   */
  const loadCompletedTasks = async () => {
    const store = getStore();

    try {
      const completedTasks = await repository.getCompletedTasks();
      store.setCompletedTasks(completedTasks);
      store.setError(null);
      return completedTasks;
    } catch (error) {
      console.error('Failed to load completed tasks:', error);
      store.setError(error.message || 'Failed to load completed tasks');
      store.setCompletedTasks([]);
      throw error;
    }
  };

  return {
    loadTasks,
    createNewTask,
    editExistingTask,
    toggleTaskCompletion,
    deleteTasks,
    rescheduleOverdueTasks,
    clearSchedulesForDate,
    cleanupCompletedTasks,
    checkDayChangeAndCleanup,
    getTasksForDate,
    updateTaskScheduledTimes,
    loadCompletedTasks,
  };
};
