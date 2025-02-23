import { getTasksFromRepo, saveTasksToRepo } from '../repositories/task-repository';
import { Task } from '../domain/Task';

/**
 * @typedef {Object} GroupedTasks
 * @property {Task[]} high - Array of high priority tasks
 * @property {Task[]} medium - Array of medium priority tasks
 * @property {Task[]} low - Array of low priority tasks
 */

/**
 * Fetches all tasks and groups them by priority.
 * @returns {Promise<GroupedTasks>} A promise that resolves to tasks grouped by priority.
 */
export async function getTasks() {
  const tasks = await getTasksFromRepo();
  return groupAndSortTasks(tasks);
}

/**
 * Creates a new task.
 * @param {string} title - The title of the task.
 * @param {string} priority - The priority of the task (High, Medium, Low).
 * @param {Date} dueDate - The due date of the task.
 * @returns {Promise<GroupedTasks>} A promise that resolves to tasks grouped by priority
 */
export async function createNewTask(title, priority, dueDate) {
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
    const tasks = await getTasksFromRepo();
    const newTask = createTask(title, priority, dueDate);
    tasks.push(newTask);

    await saveTasksToRepo(tasks);
    return groupAndSortTasks(tasks);
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
}

/**
 * Edits an existing task.
 * @param {string} taskId - The ID of the task to edit.
 * @param {string} newTitle - The new title of the task.
 * @param {string} newPriority - The new priority of the task.
 * @param {Date} newDueDate - The new due date of the task.
 * @returns {Promise<GroupedTasks>} A promise that resolves to tasks grouped by priority
 */
export async function editExistingTask(taskId, newTitle, newPriority, newDueDate) {
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
    const tasks = await getTasksFromRepo();
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) {
      throw new Error('Task not found');
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return editTask(t, newTitle, newPriority, newDueDate);
      }
      return t;
    });

    await saveTasksToRepo(updatedTasks);
    return groupAndSortTasks(updatedTasks);
  } catch (error) {
    throw new Error(`Failed to edit task: ${error.message}`);
  }
}

/**
 * Toggles the completion status of a task.
 * @param {string} taskId - The ID of the task to toggle.
 * @returns {Promise<GroupedTasks>} A promise that resolves to tasks grouped by priority
 */
export async function toggleTaskCompletion(taskId) {
  const tasks = await getTasksFromRepo();

  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId) {
      t.toggleCompletion();
    }
    return t;
  });

  await saveTasksToRepo(updatedTasks);
  return groupAndSortTasks(updatedTasks);
}

function createTask(title, priority, dueDate) {
  return new Task({
    id: Date.now().toString(),
    title,
    priority,
    dueDate,
    completed: false,
  });
}

function editTask(task, newTitle, newPriority, newDueDate) {
  task.title = newTitle;
  task.priority = newPriority;
  task.dueDate = new Date(newDueDate);
  return task;
}

function groupAndSortTasks(tasks) {
  const high = tasks.filter((t) => t.priority === 'High');
  const medium = tasks.filter((t) => t.priority === 'Medium');
  const low = tasks.filter((t) => t.priority === 'Low');

  const sortTasks = (tasks) => {
    return tasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.dueDate - b.dueDate;
    });
  };

  return {
    high: sortTasks(high),
    medium: sortTasks(medium),
    low: sortTasks(low),
  };
}
