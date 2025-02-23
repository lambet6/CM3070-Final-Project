import { getTasksFromRepo, saveTasksToRepo } from '../repositories/task-repository';
import { Task } from '../domain/Task';

/**
 * Fetches all tasks and groups them by priority.
 * @returns {Promise<Object>} A promise that resolves to an object containing grouped and sorted tasks.
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
 * @returns {Promise<Object>} A promise that resolves to an object containing grouped and sorted tasks.
 */
export async function createNewTask(title, priority, dueDate) {
  const tasks = await getTasksFromRepo();
  const newTask = createTask(title, priority, dueDate);
  tasks.push(newTask);

  await saveTasksToRepo(tasks);
  return groupAndSortTasks(tasks);
}

/**
 * Edits an existing task.
 * @param {string} taskId - The ID of the task to edit.
 * @param {string} newTitle - The new title of the task.
 * @param {string} newPriority - The new priority of the task.
 * @param {Date} newDueDate - The new due date of the task.
 * @returns {Promise<Object>} A promise that resolves to an object containing grouped and sorted tasks.
 */
export async function editExistingTask(taskId, newTitle, newPriority, newDueDate) {
  const tasks = await getTasksFromRepo();
  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId) {
      return editTask(t, newTitle, newPriority, newDueDate);
    }
    return t;
  });

  await saveTasksToRepo(updatedTasks);
  return groupAndSortTasks(updatedTasks);
}

/**
 * Toggles the completion status of a task.
 * @param {string} taskId - The ID of the task to toggle.
 * @returns {Promise<Object>} A promise that resolves to an object containing grouped and sorted tasks.
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
