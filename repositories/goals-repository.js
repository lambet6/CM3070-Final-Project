import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../domain/Goal';

export const GOALS_KEY = '@myapp_goals';

/**
 * Retrieves goals from the repository stored in AsyncStorage.
 * 
 * @async
 * @function getGoalsFromRepo
 * @returns {Promise<Goal[]>} A promise that resolves to an array of Goal objects.
 * @throws Will log an error to the console if there is an issue fetching or parsing the goals.
 */
export const getGoalsFromRepo = async () => {
    try {
        const storedGoals = await AsyncStorage.getItem(GOALS_KEY);
        const parsedGoals = storedGoals ? JSON.parse(storedGoals) : [];
        
        return parsedGoals
            .map(goalData => {
                try {
                    return new Goal(goalData);
                } catch (error) {
                    return null;
                }
            })
            .filter(goal => goal !== null);
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
};

/**
 * Saves an array of goals to the repository.
 *
 * @param {Goal[]} goals - The array of Goal objects to be saved.
 * @returns {Promise<void>} A promise that resolves when the goals have been saved.
 * @throws Will log an error to the console if there is an error saving the goals.
 */
export const saveGoalsToRepo = async (goals) => {
    try {
        const goalData = goals.map(goal => ({
            id: goal.id,
            title: goal.title,
            hoursPerWeek: goal.hoursPerWeek
        }));
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goalData));
    } catch (error) {
        console.error('Error saving goals:', error);
    }
};
