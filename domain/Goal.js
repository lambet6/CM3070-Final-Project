export class Goal {
  constructor({ id, title, hoursPerWeek }) {
    if (!id) throw new Error('Goal must have an id');
    this.id = id;
    this.setTitle(title);
    this.setHours(hoursPerWeek);
  }

  setTitle(title) {
    if (title === undefined || title === null) {
      throw new Error('Goal title cannot be null');
    }
    this.title = title.trim();
  }

  setHours(hours) {
    this.hoursPerWeek = Math.max(0, Number(hours) || 0); // Ensure non-negative number
  }

  // Domain-specific validations
  hasValidTitle() {
    return this.title.length > 0;
  }

  hasValidHours() {
    return this.hoursPerWeek >= 0 && this.hoursPerWeek <= 168; // Max hours in a week
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      hoursPerWeek: this.hoursPerWeek,
    };
  }
}
