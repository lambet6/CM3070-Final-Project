import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../domain/Goal';

export const GOALS_KEY = '@myapp_goals';

/**
 * Creates a goals repository with the specified storage mechanism
 * @param {Object} storage - Storage implementation (defaults to AsyncStorage)
 * @returns {Object} Repository object with methods for goals operations
 */
export const createGoalsRepository = (storage = AsyncStorage) => {
  /**
   * Retrieves goals from storage and converts them into Goal instances.
   * @returns {Promise<Goal[]>}
   * @throws {Error} If fetching or parsing fails.
   */
  const getGoals = async () => {
    try {
      const storedGoals = await storage.getItem(GOALS_KEY);
      if (!storedGoals) return [];
      const parsedGoals = JSON.parse(storedGoals);

      return parsedGoals
        .map((goalData) => {
          try {
            return new Goal(goalData);
          } catch (error) {
            console.error('Error mapping goal data:', error);
            return null;
          }
        })
        .filter((goal) => goal !== null);
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw new Error('Failed to fetch goals: ' + error.message);
    }
  };

  /**
   * Saves an array of Goal instances to storage.
   * @param {Goal[]} goals
   * @returns {Promise<void>}
   * @throws {Error} If saving fails.
   */
  const saveGoals = async (goals) => {
    try {
      const goalData = goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        hoursPerWeek: goal.hoursPerWeek,
      }));
      await storage.setItem(GOALS_KEY, JSON.stringify(goalData));
    } catch (error) {
      console.error('Error saving goals:', error);
      throw new Error('Failed to save goals: ' + error.message);
    }
  };

  return {
    getGoals,
    saveGoals,
  };
};

export const goalsRepository = createGoalsRepository();
