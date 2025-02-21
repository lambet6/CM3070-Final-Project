import { getTasksFromRepo, saveTasksToRepo } from '../repositories/task-repository';
import { Task } from '../domain/Task';

// Create a new domain object
export function createTask(title, priority, dueDate) {
  return new Task({
    id: Date.now().toString(),  // or use uuid
    title,
    priority,
    dueDate,    
    completed: false,
  });
}

export function editTask(task, newTitle, newPriority, newDueDate) {
  task.title = newTitle;
  task.priority = newPriority;
  task.dueDate = new Date(newDueDate);
  return task;
}

// Group tasks by priority and sort by date
export function groupAndSortTasks(tasks) {
  const high = tasks.filter((t) => t.priority === 'High');
  const medium = tasks.filter((t) => t.priority === 'Medium');
  const low = tasks.filter((t) => t.priority === 'Low');

  // Sort by dueDate
  const sortByDate = (a, b) => a.dueDate - b.dueDate;
  high.sort(sortByDate);
  medium.sort(sortByDate);
  low.sort(sortByDate);

  return { high, medium, low };
}

// Fetch Tasks
export async function getTasks() {
  const tasks = await getTasksFromRepo(); // returns Task[] domain objects
  return groupAndSortTasks(tasks);
}

// Add New Task
export async function createNewTask(title, priority, dueDate) {
  const tasks = await getTasksFromRepo(); // domain objects
  const newTask = createTask(title, priority, dueDate);
  tasks.push(newTask);

  await saveTasksToRepo(tasks);
  return groupAndSortTasks(tasks);
}

// Edit Task
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

export async function toggleTaskCompletion(taskId) {
  const tasks = await getTasksFromRepo();

  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId) {
      t.toggleCompletion(); // domain method on Task
    }
    return t;
  });

  await saveTasksToRepo(updatedTasks);
  return groupAndSortTasks(updatedTasks);
}
