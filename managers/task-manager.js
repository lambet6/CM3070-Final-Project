import { getTasksFromRepo, saveTasksToRepo } from '../repositories/task-repository';

// Task Creation
export function createTask(title, priority, dueDate) {
  return {
    id: Date.now().toString(),
    title,
    priority,
    dueDate: dueDate.toISOString(),
  };
}

// Task Editing
export function editTask(originalTask, newTitle, newPriority, newDueDate) {
  return {
    ...originalTask,
    title: newTitle,
    priority: newPriority,
    dueDate: newDueDate.toISOString(),
  };
}

// Group tasks by priority
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

// Fetch Tasks
export async function getTasks() {
  const tasks = await getTasksFromRepo();
  return groupAndSortTasks(tasks);
}

// Add New Task
export async function createNewTask(title, priority, dueDate) {
  const tasks = await getTasksFromRepo();
  const newTask = createTask(title, priority, dueDate);
  const updatedTasks = [...tasks, newTask];
  await saveTasksToRepo(updatedTasks);
  return groupAndSortTasks(updatedTasks);
}

// Edit Task
export async function editExistingTask(taskId, newTitle, newPriority, newDueDate) {
  const tasks = await getTasksFromRepo();
  const updatedTasks = tasks.map((t) =>
    t.id === taskId ? editTask(t, newTitle, newPriority, newDueDate) : t
  );
  await saveTasksToRepo(updatedTasks);
  return groupAndSortTasks(updatedTasks);
}

// Get tasks for a given week
export async function getTasksForWeek(startDate, endDate) {
  const allTasks = await getTasksFromRepo();
  return allTasks.filter(task => {
    const due = new Date(task.dueDate);
    return due >= startDate && due <= endDate;
  });
}

