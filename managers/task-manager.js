import { getTasksFromRepo, saveTasksToRepo } from '../repositories/task-repository';

// Task Creation
export function createTask(title, priority, dueDate) {
  return {
    id: Date.now().toString(),
    title,
    priority,
    dueDate: dueDate.toISOString(),
    completed: false,
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

export async function toggleTaskCompletion(taskId) {
  const tasks = await getTasksFromRepo();

  // Find and modify the task in memory
  const updatedTasks = tasks.map(task =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );

  // Save the updated tasks back to storage
  await saveTasksToRepo(updatedTasks);

  return groupAndSortTasks(updatedTasks);
}


