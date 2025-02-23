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
    this.date = date instanceof Date ? date : new Date(date);
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
    const today = new Date().toISOString().split('T')[0];
    return this.date.toISOString().split('T')[0] === today;
  }
}
