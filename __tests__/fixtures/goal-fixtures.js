import { Goal } from '../../domain/Goal';

/**
 * Creates fresh sample goal instances for testing
 * @returns {Object} Object containing sample goal instances
 */
export const createSampleGoals = () => {
  return {
    exercise: new Goal({
      id: '1',
      title: 'Exercise',
      hoursPerWeek: 3,
    }),

    reading: new Goal({
      id: '2',
      title: 'Reading',
      hoursPerWeek: 5,
    }),

    learning: new Goal({
      id: '3',
      title: 'Learning Spanish',
      hoursPerWeek: 2.5,
    }),

    meditation: new Goal({
      id: '4',
      title: 'Meditation',
      hoursPerWeek: 1.75,
    }),

    family: new Goal({
      id: '5',
      title: 'Family time',
      hoursPerWeek: 10,
    }),
  };
};

/**
 * Creates goal collections for different test scenarios
 * @returns {Object} Various goal collections for testing
 */
export const createGoalCollections = () => {
  const goals = createSampleGoals();

  return {
    empty: [],
    singleGoal: [goals.exercise],
    multipleGoals: [goals.exercise, goals.reading, goals.learning],
    fullSet: [goals.exercise, goals.reading, goals.learning, goals.meditation, goals.family],
  };
};
