// filepath: __tests__/fixtures/wellbeing-fixtures.js
import { Mood } from '../../domain/Mood';
import { subDays } from 'date-fns';

/**
 * Creates collections of mood data fixtures for testing
 * @returns {Object} Collections of mood data for different testing scenarios
 */
export const createSampleMoods = () => {
  const today = new Date();

  return {
    empty: [],

    singleMood: [new Mood({ mood: 'Happy', date: today })],

    multipleDay: [
      new Mood({ mood: 'Happy', date: today }),
      new Mood({ mood: 'Low', date: subDays(today, 1) }),
      new Mood({ mood: 'Neutral', date: subDays(today, 2) }),
      new Mood({ mood: 'Very happy', date: subDays(today, 5) }),
    ],

    // Helper to create a custom set of moods
    createCustomMoods: (moodSpecs) => {
      return moodSpecs.map(
        (spec) =>
          new Mood({
            mood: spec.mood,
            date: spec.daysAgo ? subDays(today, spec.daysAgo) : new Date(spec.date || today),
          }),
      );
    },
  };
};
