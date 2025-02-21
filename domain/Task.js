export class Task {
    constructor({ id, title, priority, dueDate, completed=false }) {
        this.id = id;
        this.title = title;
        this.priority = priority;
        // Ensure dueDate is always a Date object
        this.dueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
        this.completed = completed;
    }
  
    toggleCompletion() {
      this.completed = !this.completed;
    }
  
    isOverdue() {
      return !this.completed && this.dueDate < new Date();
    }
  }
