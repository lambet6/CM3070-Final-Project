import { getGoalsFromRepo, saveGoalsToRepo } from '../repositories/goals-repository';
import { Goal } from '../domain/Goal';

/**
 * Fetches all goals from the repository.
 * @returns {Promise<Array>} A promise that resolves to an array of goals.
 */
export const fetchGoals = async () => {
    return await getGoalsFromRepo();
};

/**
 * Adds a new goal.
 * @param {string} title - The title of the goal.
 * @param {number} hoursPerWeek - The number of hours per week dedicated to the goal.
 * @returns {Promise<Array>} A promise that resolves to an updated array of goals.
 */
export const addGoal = async (title, hoursPerWeek) => {
    const existingGoals = await getGoalsFromRepo();
    
    try {
        const newGoal = new Goal({
            id: Date.now().toString(),
            title,
            hoursPerWeek
        });
        
        const updatedGoals = [...existingGoals, newGoal];
        await saveGoalsToRepo(updatedGoals);
        return updatedGoals;
    } catch (error) {
        console.error('Failed to create goal:', error);
        return existingGoals;
    }
};

/**
 * Updates an existing goal.
 * @param {string} goalId - The ID of the goal to update.
 * @param {string} newTitle - The new title of the goal.
 * @param {number} newHours - The new number of hours per week dedicated to the goal.
 * @returns {Promise<Array>} A promise that resolves to an updated array of goals.
 */
export const updateGoalData = async (goalId, newTitle, newHours) => {
    const goals = await getGoalsFromRepo();
    
    try {
        const updatedGoals = goals.map(goal => 
            goal.id === goalId 
                ? new Goal({ id: goal.id, title: newTitle, hoursPerWeek: newHours })
                : goal
        );
        
        await saveGoalsToRepo(updatedGoals);
        return updatedGoals;
    } catch (error) {
        console.error('Failed to update goal:', error);
        return goals;
    }
};

/**
 * Deletes a goal.
 * @param {string} goalId - The ID of the goal to delete.
 * @returns {Promise<Array>} A promise that resolves to an updated array of goals.
 */
export const deleteGoal = async (goalId) => {
    const goals = await getGoalsFromRepo();
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
};

