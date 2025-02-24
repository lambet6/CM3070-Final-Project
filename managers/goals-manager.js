import { getGoalsFromRepo, saveGoalsToRepo } from '../repositories/goals-repository';
import { Goal } from '../domain/Goal';

/**
 * Fetches all goals.
 * @returns {Promise<Goal[]>}
 */
export const fetchGoals = async () => {
  try {
    return await getGoalsFromRepo();
  } catch (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }
};

/**
 * Adds a new goal.
 * @param {string} title - The goal title.
 * @param {number} hoursPerWeek - Hours per week for the goal.
 * @returns {Promise<Goal[]>} Updated goals array.
 */
export const addGoal = async (title, hoursPerWeek) => {
  try {
    if (!title?.trim()) {
      throw new Error('Goal title is required');
    }
    const existingGoals = await getGoalsFromRepo();
    const newGoal = new Goal({
      id: Date.now().toString(),
      title,
      hoursPerWeek,
    });
    const updatedGoals = [...existingGoals, newGoal];
    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
  } catch (error) {
    console.error('Failed to create goal:', error);
    throw new Error(`Failed to create goal: ${error.message}`);
  }
};

/**
 * Updates an existing goal.
 * @param {string} goalId - The goal ID.
 * @param {string} newTitle - The new title.
 * @param {number} newHours - The new hours per week.
 * @returns {Promise<Goal[]>} Updated goals array.
 */
export const updateGoalData = async (goalId, newTitle, newHours) => {
  try {
    if (!goalId) throw new Error('Goal ID is required');
    if (!newTitle?.trim()) throw new Error('Goal title is required');

    const goals = await getGoalsFromRepo();
    const updatedGoals = goals.map((goal) =>
      goal.id === goalId
        ? new Goal({ id: goal.id, title: newTitle, hoursPerWeek: newHours })
        : goal,
    );
    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
  } catch (error) {
    console.error('Failed to update goal:', error);
    throw new Error(`Failed to update goal: ${error.message}`);
  }
};

/**
 * Deletes a goal.
 * @param {string} goalId - The goal ID.
 * @returns {Promise<Goal[]>} Updated goals array.
 */
export const deleteGoal = async (goalId) => {
  try {
    if (!goalId) throw new Error('Goal ID is required');

    const goals = await getGoalsFromRepo();
    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    await saveGoalsToRepo(updatedGoals);
    return updatedGoals;
  } catch (error) {
    console.error('Failed to delete goal:', error);
    throw new Error(`Failed to delete goal: ${error.message}`);
  }
};
