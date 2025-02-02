// services/taskManager.js
import { loadTasksFromStorage, saveTasksToStorage } from '../Servers/tasks-server';

// Basic creation logic
export function createTask(title, priority, dueDate) {
  return {
    id: Date.now().toString(),
    title,
    priority,
    dueDate: dueDate.toISOString(),
  };
}

// Basic edit logic
export function editTask(originalTask, newTitle, newPriority, newDueDate) {
  return {
    ...originalTask,
    title: newTitle,
    priority: newPriority,
    dueDate: newDueDate.toISOString(),
  };
}

// Group tasks by priority and sort by dueDate
export function groupAndSortTasks(tasks) {
  const high = tasks.filter((t) => t.priority === 'High');
  const medium = tasks.filter((t) => t.priority === 'Medium');
  const low = tasks.filter((t) => t.priority === 'Low');

  const sortByDate = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
  high.sort(sortByDate);
  medium.sort(sortByDate);
  low.sort(sortByDate);

  return { high, medium, low };
}

// Public method: get tasks from storage, return them (grouped/sorted if you like)
export async function getTasks() {
  const allTasks = await loadTasksFromStorage();
  // If you want to return them grouped/sorted by default, do:
  return groupAndSortTasks(allTasks);
}

// Public method: create a new task & persist
export async function createNewTask(title, priority, dueDate) {
  const existingTasks = await loadTasksFromStorage();
  const newTask = createTask(title, priority, dueDate);
  const updatedTasks = [...existingTasks, newTask];
  await saveTasksToStorage(updatedTasks);
  // Return grouped version for convenience
  return groupAndSortTasks(updatedTasks);
}

// Public method: edit an existing task & persist
export async function editExistingTask(taskId, newTitle, newPriority, newDueDate) {
  const existingTasks = await loadTasksFromStorage();
  const updatedList = existingTasks.map(t =>
    t.id === taskId
      ? editTask(t, newTitle, newPriority, newDueDate)
      : t
  );
  await saveTasksToStorage(updatedList);
  return groupAndSortTasks(updatedList);
}

// You could add more methods like deleteTask, etc., if needed.
