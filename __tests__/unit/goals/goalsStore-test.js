/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { act } from 'react-test-renderer';
import { useGoalsStore } from '../../../store/goalsStore';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../../../managers/goals-manager';

// Mock the manager functions used by the store
jest.mock('../../../managers/goals-manager', () => ({
  fetchGoals: jest.fn(),
  addGoal: jest.fn(),
  updateGoalData: jest.fn(),
  deleteGoal: jest.fn(),
}));

describe('goalsStore', () => {
  beforeEach(() => {
    useGoalsStore.setState({ goals: [] });
    jest.resetAllMocks();
  });

  it('loads goals and updates state', async () => {
    const sampleGoals = [{ id: '1', title: 'Test Goal', hoursPerWeek: 2 }];
    fetchGoals.mockResolvedValue(sampleGoals);
    await act(async () => {
      await useGoalsStore.getState().loadGoals();
    });
    expect(useGoalsStore.getState().goals).toEqual(sampleGoals);
  });

  it('adds a new goal and updates state', async () => {
    const newGoal = { id: '2', title: 'New Goal', hoursPerWeek: 0 };
    addGoal.mockResolvedValue([newGoal]);
    await act(async () => {
      await useGoalsStore.getState().addNewGoal('New Goal', 0);
    });
    expect(useGoalsStore.getState().goals).toEqual([newGoal]);
  });

  it('updates a goal and updates state', async () => {
    const existing = { id: '1', title: 'Old Goal', hoursPerWeek: 2 };
    useGoalsStore.setState({ goals: [existing] });
    const updated = { id: '1', title: 'Updated Goal', hoursPerWeek: 3 };
    updateGoalData.mockResolvedValue([updated]);
    await act(async () => {
      await useGoalsStore.getState().updateGoal('1', 'Updated Goal', 3);
    });
    expect(useGoalsStore.getState().goals).toEqual([updated]);
  });

  it('deletes a goal and updates state', async () => {
    const existing = { id: '1', title: 'Goal to delete', hoursPerWeek: 2 };
    useGoalsStore.setState({ goals: [existing] });
    deleteGoal.mockResolvedValue([]);
    await act(async () => {
      await useGoalsStore.getState().deleteGoal('1');
    });
    expect(useGoalsStore.getState().goals).toEqual([]);
  });

  it('should set error state when loading fails', async () => {
    fetchGoals.mockRejectedValue(new Error('Failed to load'));

    await act(async () => {
      await useGoalsStore.getState().loadGoals();
    });

    expect(useGoalsStore.getState().error).toBe('Failed to load');
    expect(useGoalsStore.getState().goals).toEqual([]);
  });

  it('should set error state when adding goal fails', async () => {
    addGoal.mockRejectedValue(new Error('Invalid goal'));

    await act(async () => {
      try {
        await useGoalsStore.getState().addNewGoal('', 0);
      } catch (error) {
        // Expected error
      }
    });

    expect(useGoalsStore.getState().error).toBe('Invalid goal');
  });

  it('should maintain current goals when update fails', async () => {
    const existing = { id: '1', title: 'Old Goal', hoursPerWeek: 2 };
    useGoalsStore.setState({ goals: [existing] });

    updateGoalData.mockRejectedValue(new Error('Update failed'));

    await act(async () => {
      try {
        await useGoalsStore.getState().updateGoal('1', '', 3);
      } catch (error) {
        // Expected error
      }
    });

    expect(useGoalsStore.getState().goals).toEqual([existing]);
    expect(useGoalsStore.getState().error).toBe('Update failed');
  });
});
