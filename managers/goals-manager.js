import { Goal } from '../domain/Goal';

/**
 * Creates a goals manager that uses the provided repository and store
 * @param {Object} repository - Repository with goals operations
 * @param {Function} getStore - Function to get the store state/actions
 * @returns {Object} Goals manager functions
 */
export const createGoalsManager = (repository, getStore) => {
  /**
   * Fetches all goals.
   * @returns {Promise<Goal[]>}
   */
  const fetchGoals = async () => {
    const store = getStore();
    store.setLoading(true);

    try {
      const goals = await repository.getGoals();
      store.setGoals(goals);
      store.setError(null);
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      store.setError(`Failed to fetch goals: ${error.message}`);
      store.setGoals([]);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  /**
   * Adds a new goal.
   * @param {string} title - The goal title.
   * @param {number} hoursPerWeek - Hours per week for the goal.
   * @returns {Promise<Goal[]>} Updated goals array.
   */
  const addGoal = async (title, hoursPerWeek) => {
    const store = getStore();
    store.setError(null);

    try {
      if (!title?.trim()) {
        throw new Error('Goal title is required');
      }

      const existingGoals = await repository.getGoals();
      const newGoal = new Goal({
        id: Date.now().toString(),
        title,
        hoursPerWeek,
      });

      const updatedGoals = [...existingGoals, newGoal];
      await repository.saveGoals(updatedGoals);

      store.setGoals(updatedGoals);
      return updatedGoals;
    } catch (error) {
      console.error('Failed to create goal:', error);
      store.setError(`Failed to create goal: ${error.message}`);
      throw error;
    }
  };

  /**
   * Updates an existing goal.
   * @param {string} goalId - The goal ID.
   * @param {string} newTitle - The new title.
   * @param {number} newHours - The new hours per week.
   * @returns {Promise<Goal[]>} Updated goals array.
   */
  const updateGoalData = async (goalId, newTitle, newHours) => {
    const store = getStore();
    store.setError(null);

    try {
      if (!goalId) throw new Error('Goal ID is required');
      if (!newTitle?.trim()) throw new Error('Goal title is required');

      const goals = await repository.getGoals();
      const updatedGoals = goals.map((goal) =>
        goal.id === goalId
          ? new Goal({ id: goal.id, title: newTitle, hoursPerWeek: newHours })
          : goal,
      );

      await repository.saveGoals(updatedGoals);

      store.setGoals(updatedGoals);
      return updatedGoals;
    } catch (error) {
      console.error('Failed to update goal:', error);
      store.setError(`Failed to update goal: ${error.message}`);
      throw error;
    }
  };

  /**
   * Deletes a goal.
   * @param {string} goalId - The goal ID.
   * @returns {Promise<Goal[]>} Updated goals array.
   */
  const deleteGoal = async (goalId) => {
    const store = getStore();
    store.setError(null);

    try {
      if (!goalId) throw new Error('Goal ID is required');

      const goals = await repository.getGoals();
      const updatedGoals = goals.filter((goal) => goal.id !== goalId);

      await repository.saveGoals(updatedGoals);

      store.setGoals(updatedGoals);
      return updatedGoals;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      store.setError(`Failed to delete goal: ${error.message}`);
      throw error;
    }
  };

  return {
    fetchGoals,
    addGoal,
    updateGoalData,
    deleteGoal,
  };
};
