/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import { createGoalsManager } from '../../../managers/goals-manager';
import { createSampleGoals } from '../../fixtures/goal-fixtures';
import { Goal } from '../../../domain/Goal';
import { createGoalsRepository } from '../../../repositories/goals-repository';

// Automatically mock the repository
jest.mock('../../../repositories/goals-repository');

describe('Goals Manager', () => {
  let mockRepository;
  let goalsManager;
  let sampleGoals;

  beforeEach(() => {
    // Setup fresh test data
    sampleGoals = createSampleGoals();

    // Create mock repository and inject it into the manager
    mockRepository = createGoalsRepository();
    goalsManager = createGoalsManager(mockRepository);

    // Spy on console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('fetchGoals', () => {
    it('returns goals from repository', async () => {
      // Arrange
      const validGoal = new Goal({ id: '1', title: 'Goal 1', hoursPerWeek: 5 });
      mockRepository.getGoals.mockResolvedValueOnce([validGoal]);

      // Act
      const goals = await goalsManager.fetchGoals();

      // Assert
      expect(mockRepository.getGoals).toHaveBeenCalledTimes(1);
      expect(goals).toEqual([validGoal]);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepository.getGoals.mockRejectedValueOnce(new Error('Storage error'));

      // Act & Assert
      await expect(goalsManager.fetchGoals()).rejects.toThrow(
        'Failed to fetch goals: Storage error',
      );
    });
  });

  describe('addGoal', () => {
    it('creates goal with valid data', async () => {
      // Arrange
      mockRepository.getGoals.mockResolvedValueOnce([]);

      // Act
      const result = await goalsManager.addGoal('New Goal', 3);

      // Assert
      expect(result[0]).toBeInstanceOf(Goal);
      expect(result[0].title).toBe('New Goal');
      expect(result[0].hoursPerWeek).toBe(3);
      expect(mockRepository.saveGoals).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid inputs', async () => {
      // Test empty title
      await expect(goalsManager.addGoal('', 5)).rejects.toThrow(
        'Failed to create goal: Goal title is required',
      );

      // Test null title
      await expect(goalsManager.addGoal(null, 5)).rejects.toThrow(
        'Failed to create goal: Goal title is required',
      );

      expect(mockRepository.saveGoals).not.toHaveBeenCalled();
    });
  });

  describe('updateGoalData', () => {
    it('should throw error when updating with invalid title', async () => {
      // Act & Assert
      await expect(goalsManager.updateGoalData('1', null, 3)).rejects.toThrow(
        'Failed to update goal: Goal title is required',
      );
      expect(mockRepository.saveGoals).not.toHaveBeenCalled();
    });

    it('updates goal successfully', async () => {
      // Arrange
      const originalGoal = new Goal({ id: '1', title: 'Original', hoursPerWeek: 2 });
      mockRepository.getGoals.mockResolvedValueOnce([originalGoal]);

      // Act
      const result = await goalsManager.updateGoalData('1', 'Updated', 3);

      // Assert
      expect(result[0].title).toBe('Updated');
      expect(result[0].hoursPerWeek).toBe(3);
      expect(mockRepository.saveGoals).toHaveBeenCalledTimes(1);

      // Verify the correct data was passed to saveGoals
      const savedData = mockRepository.saveGoals.mock.calls[0][0];
      expect(savedData[0].title).toBe('Updated');
      expect(savedData[0].hoursPerWeek).toBe(3);
    });
  });

  describe('deleteGoal', () => {
    it('removes goal while preserving others', async () => {
      // Arrange
      const goals = [
        new Goal({ id: '1', title: 'Goal 1', hoursPerWeek: 5 }),
        new Goal({ id: '2', title: 'Goal 2', hoursPerWeek: 3 }),
      ];
      mockRepository.getGoals.mockResolvedValueOnce(goals);

      // Act
      const result = await goalsManager.deleteGoal('1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(mockRepository.saveGoals).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: '2' })]),
      );
    });

    it('should throw error when goal ID is missing', async () => {
      // Act & Assert
      await expect(goalsManager.deleteGoal()).rejects.toThrow(
        'Failed to delete goal: Goal ID is required',
      );
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      mockRepository.getGoals.mockResolvedValueOnce([sampleGoals.exercise]);
      mockRepository.saveGoals.mockRejectedValueOnce(new Error('Storage error'));

      // Act & Assert
      await expect(goalsManager.deleteGoal('1')).rejects.toThrow(
        'Failed to delete goal: Storage error',
      );
    });
  });
});
