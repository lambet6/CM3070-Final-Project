/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { getGoalsFromRepo, saveGoalsToRepo } from '../../../repositories/goals-repository';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../../../managers/goals-manager';
import { Goal } from '../../../domain/Goal';
jest.mock('../../../repositories/goals-repository', () => ({
  getGoalsFromRepo: jest.fn(),
  saveGoalsToRepo: jest.fn(),
}));

describe('goals-manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchGoals', () => {
    it('returns goals from repository', async () => {
      const validGoal = new Goal({ id: '1', title: 'Goal 1', hoursPerWeek: 5 });
      getGoalsFromRepo.mockResolvedValue([validGoal]);

      const goals = await fetchGoals();
      expect(goals).toEqual([validGoal]);
    });

    it('should throw error when repository fails', async () => {
      getGoalsFromRepo.mockRejectedValue(new Error('Storage error'));
      await expect(fetchGoals()).rejects.toThrow('Failed to fetch goals: Storage error');
    });
  });

  describe('addGoal', () => {
    it('creates goal with valid data', async () => {
      getGoalsFromRepo.mockResolvedValue([]);
      const result = await addGoal('New Goal', 3);
      expect(result[0]).toBeInstanceOf(Goal);
      expect(result[0].title).toBe('New Goal');
      expect(result[0].hoursPerWeek).toBe(3);
    });

    it('should throw error for invalid inputs', async () => {
      // Test empty title
      await expect(addGoal('', 5)).rejects.toThrow('Failed to create goal: Goal title is required');

      // Test null title
      await expect(addGoal(null, 5)).rejects.toThrow(
        'Failed to create goal: Goal title is required',
      );

      expect(saveGoalsToRepo).not.toHaveBeenCalled();
    });
  });

  describe('updateGoalData', () => {
    it('should throw error when updating with invalid title', async () => {
      await expect(updateGoalData('1', null, 3)).rejects.toThrow(
        'Failed to update goal: Goal title is required',
      );
      expect(saveGoalsToRepo).not.toHaveBeenCalled();
    });

    it('updates goal successfully', async () => {
      const originalGoal = new Goal({ id: '1', title: 'Original', hoursPerWeek: 2 });
      getGoalsFromRepo.mockResolvedValue([originalGoal]);

      const result = await updateGoalData('1', 'Updated', 3);
      expect(result[0].title).toBe('Updated');
      expect(result[0].hoursPerWeek).toBe(3);
      expect(saveGoalsToRepo).toHaveBeenCalled();
    });
  });

  describe('deleteGoal', () => {
    it('removes goal while preserving others', async () => {
      const goals = [
        new Goal({ id: '1', title: 'Goal 1', hoursPerWeek: 5 }),
        new Goal({ id: '2', title: 'Goal 2', hoursPerWeek: 3 }),
      ];
      getGoalsFromRepo.mockResolvedValue(goals);

      const result = await deleteGoal('1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(saveGoalsToRepo).toHaveBeenCalledWith(result);
    });

    it('should throw error when goal ID is missing', async () => {
      await expect(deleteGoal()).rejects.toThrow('Failed to delete goal: Goal ID is required');
    });

    it('should throw error when repository fails', async () => {
      saveGoalsToRepo.mockRejectedValue(new Error('Storage error'));
      await expect(deleteGoal('1')).rejects.toThrow('Failed to delete goal: Storage error');
    });
  });
});
