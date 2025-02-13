import { create } from 'zustand';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../managers/goals-manager';

export const useGoalsStore = create((set) => ({
    goals: [],
    
    loadGoals: async () => {
        const fetchedGoals = await fetchGoals();
        set({ goals: fetchedGoals });
    },

    addNewGoal: async (title, hours) => {
        const updatedGoals = await addGoal(title, hours);
        console.log(updatedGoals.length);
        set({ goals: updatedGoals });
    },

    updateGoal: async (goalId, newTitle, newHours) => {
        const updatedGoals = await updateGoalData(goalId, newTitle, newHours);
        set({ goals: updatedGoals });
    },

    deleteGoal: async (goalId) => {
        const updatedGoals = await deleteGoal(goalId);
        set({ goals: updatedGoals });
    }
}));