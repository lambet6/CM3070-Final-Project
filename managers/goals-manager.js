import { getGoalsFromRepo, saveGoalsToRepo } from '../repositories/goals-repository';

export const fetchGoals = async () => {
    let goals = await getGoalsFromRepo();

    // Remove any goals without titles
    const filteredGoals = goals.filter(goal => goal.title.trim() !== '');

    // If any goals were removed, update AsyncStorage
    if (filteredGoals.length !== goals.length) {
        await saveGoalsToRepo(filteredGoals);
    }
    return filteredGoals;
};

export const addGoal = async (title, hoursPerWeek) => {
    const existingGoals = await getGoalsFromRepo();
  
    if (title.trim() === '') return existingGoals; // Prevent adding empty goals
  
    const newGoal = { id: Date.now().toString(), title, hoursPerWeek };
    const updatedGoals = [...existingGoals, newGoal];

    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
};

export const updateGoalData = async (goalId, newTitle, newHours) => {
    const goals = await getGoalsFromRepo();
    const updatedGoals = goals.map(goal =>
        goal.id === goalId ? { ...goal, title: newTitle.trim(), hoursPerWeek: newHours } : goal
    );

    const finalGoals = updatedGoals.filter(goal => goal.title !== '');

    await saveGoalsToRepo(finalGoals);
    return finalGoals;
};

export const deleteGoal = async (goalId) => {
    const goals = await getGoalsFromRepo();
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
};

