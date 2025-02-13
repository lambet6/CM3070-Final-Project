import AsyncStorage from '@react-native-async-storage/async-storage';

export const GOALS_KEY = '@myapp_goals';

export const getGoalsFromRepo = async () => {
    try {
        const storedGoals = await AsyncStorage.getItem(GOALS_KEY);
        return storedGoals ? JSON.parse(storedGoals) : [];
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
};

export const saveGoalsToRepo = async (goals) => {
    try {
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch (error) {
        console.error('Error saving goals:', error);
    }
};
