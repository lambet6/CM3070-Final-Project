import { isSameDay, parseISO } from 'date-fns';

export class Mood {
  constructor({ mood, date }) {
    if (!mood) throw new Error('Mood value cannot be null');
    this.setMood(mood);
    this.setDate(date || new Date());
  }

  setMood(mood) {
    const validMoods = ['Very low', 'Low', 'Neutral', 'Happy', 'Very happy'];
    if (!validMoods.includes(mood)) {
      throw new Error('Invalid mood value');
    }
    this.mood = mood;
    this.moodValue = this.getMoodValue(mood);
  }

  setDate(date) {
    const parsedDate = date instanceof Date ? date : parseISO(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
    this.date = parsedDate;
  }

  getMoodValue(mood) {
    const moodValues = {
      'Very low': 1,
      Low: 2,
      Neutral: 3,
      Happy: 4,
      'Very happy': 5,
    };
    return moodValues[mood];
  }

  isToday() {
    return isSameDay(this.date, new Date());
  }

  toJSON() {
    // This method is automatically called by JSON.stringify
    // It ensures proper serialization of the date when saving to storage
    return {
      mood: this.mood,
      date: this.date.toISOString(),
    };
  }
}
