import { parseISO } from 'date-fns';

export class CalendarEvent {
  constructor({ id, title, startDate, endDate }) {
    if (!id) throw new Error('ID cannot be null');
    if (!title) throw new Error('Title cannot be null');
    if (!startDate || !endDate) throw new Error('Dates cannot be null');

    this.id = id;
    this.title = title;
    this.setStartDate(startDate);
    this.setEndDate(endDate);
  }

  setStartDate(date) {
    const parsedDate = date instanceof Date ? date : parseISO(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid start date');
    }
    this.startDate = parsedDate;
  }

  setEndDate(date) {
    const parsedDate = date instanceof Date ? date : parseISO(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid end date');
    }
    if (this.startDate && parsedDate < this.startDate) {
      throw new Error('End date cannot be before start date');
    }
    this.endDate = parsedDate;
  }

  isOngoing() {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  getDuration() {
    return this.endDate.getTime() - this.startDate.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
    };
  }
}
