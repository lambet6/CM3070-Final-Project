import { getGoalsFromRepo, saveGoalsToRepo } from '../repositories/goals-repository';
import { Goal } from '../domain/Goal';

export const fetchGoals = async () => {
    return await getGoalsFromRepo();
};

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

export const deleteGoal = async (goalId) => {
    const goals = await getGoalsFromRepo();
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
};

