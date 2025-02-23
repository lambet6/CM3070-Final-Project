import { parseISO } from 'date-fns';

export class Task {
  constructor({ id, title, priority, dueDate, completed = false }) {
    if (!id) throw new Error('Task must have an id');
    if (!title) throw new Error('Title cannot be null');

    this.id = id;
    this.setTitle(title);
    this.setPriority(priority);
    this.setDueDate(dueDate);
    this.completed = completed;
  }

  setTitle(title) {
    if (!title) throw new Error('Title cannot be null');
    this.title = title.trim();
  }

  setPriority(priority) {
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(priority)) {
      throw new Error('Invalid priority value');
    }
    this.priority = priority;
  }

  setDueDate(date) {
    const parsedDate = date instanceof Date ? date : parseISO(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid due date');
    }
    this.dueDate = parsedDate;
  }

  toggleCompletion() {
    this.completed = !this.completed;
  }

  isOverdue() {
    return !this.completed && this.dueDate < new Date();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      priority: this.priority,
      dueDate: this.dueDate.toISOString(),
      completed: this.completed,
    };
  }
}
