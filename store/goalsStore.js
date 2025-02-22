import { create } from 'zustand';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../managers/goals-manager';

/**
 * @typedef {import('../domain/Goal').Goal} Goal
 */

/**
 * Store for managing goals state.
 * @typedef {Object} GoalsStore
 * @property {Goal[]} goals - Array of user goals
 * @property {() => Promise<void>} loadGoals - Loads all goals
 * @property {(title: string, hours: number) => Promise<void>} addNewGoal - Creates and adds a new goal
 * @property {(goalId: string, newTitle: string, newHours: number) => Promise<void>} updateGoal - Updates an existing goal
 * @property {(goalId: string) => Promise<void>} deleteGoal - Deletes a goal by ID
 */

/**
 * Creates a store for managing goals.
 * @type {import('zustand').UseBoundStore<GoalsStore>}
 */
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