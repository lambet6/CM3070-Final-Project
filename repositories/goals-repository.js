import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../domain/Goal';

export const GOALS_KEY = '@myapp_goals';

export const getGoalsFromRepo = async () => {
    try {
        const storedGoals = await AsyncStorage.getItem(GOALS_KEY);
        const parsedGoals = storedGoals ? JSON.parse(storedGoals) : [];
        
        // Map and filter out invalid goals
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

export const saveGoalsToRepo = async (goals) => {
    try {
        // Convert Goal instances to plain objects for storage
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
