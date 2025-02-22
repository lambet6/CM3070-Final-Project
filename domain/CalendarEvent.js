export class CalendarEvent {
    constructor({ id, title, startDate, endDate }) {
        this.id = id;
        this.title = title;
        // Ensure dates are always Date objects
        this.startDate = startDate instanceof Date ? startDate : new Date(startDate);
        this.endDate = endDate instanceof Date ? endDate : new Date(endDate);
    }

    isOngoing() {
        const now = new Date();
        return now >= this.startDate && now <= this.endDate;
    }

    getDuration() {
        return this.endDate.getTime() - this.startDate.getTime();
    }
}
