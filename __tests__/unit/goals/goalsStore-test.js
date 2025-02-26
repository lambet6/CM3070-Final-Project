/*global jest*/
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { createGoalsStore } from '../../../store/goalsStore';
import { createMockGoalsManager } from '../../mocks/goals-manager.mock';
import { createSampleGoals, createGoalCollections } from '../../fixtures/goal-fixtures';

describe('GoalsStore', () => {
  let mockGoalsManager;
  let useTestStore;
  let sampleGoals;
  let goalCollections;

  beforeEach(() => {
    // Get fresh test data for each test
    sampleGoals = createSampleGoals();
    goalCollections = createGoalCollections();

    // Create testing dependencies with proper injection
    mockGoalsManager = createMockGoalsManager();
    useTestStore = createGoalsStore(mockGoalsManager);

    // Spy on console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with empty goals array', () => {
    // Arrange & Act
    const { result } = renderHook(() => useTestStore());

    // Assert
    expect(result.current.goals).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should load goals successfully', async () => {
    // Arrange
    mockGoalsManager.fetchGoals.mockResolvedValueOnce(goalCollections.multipleGoals);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.loadGoals();
    });

    // Assert
    expect(mockGoalsManager.fetchGoals).toHaveBeenCalledTimes(1);
    expect(result.current.goals).toEqual(goalCollections.multipleGoals);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading errors gracefully', async () => {
    // Arrange
    const errorMessage = 'Failed to load goals';
    mockGoalsManager.fetchGoals.mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.loadGoals();
    });

    // Assert
    expect(result.current.goals).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should add a new goal', async () => {
    // Arrange
    const title = 'New Goal';
    const hours = 3.5;
    mockGoalsManager.addGoal.mockResolvedValueOnce(goalCollections.singleGoal);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.addNewGoal(title, hours);
    });

    // Assert
    expect(mockGoalsManager.addGoal).toHaveBeenCalledWith(title, hours);
    expect(result.current.goals).toEqual(goalCollections.singleGoal);
    expect(result.current.error).toBeNull();
  });

  it('should update a goal', async () => {
    // Arrange
    const goalId = '1';
    const newTitle = 'Updated Goal';
    const newHours = 4.5;
    mockGoalsManager.updateGoalData.mockResolvedValueOnce([
      { ...sampleGoals.exercise, title: newTitle, hoursPerWeek: newHours },
    ]);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.updateGoal(goalId, newTitle, newHours);
    });

    // Assert
    expect(mockGoalsManager.updateGoalData).toHaveBeenCalledWith(goalId, newTitle, newHours);
    expect(result.current.goals[0].title).toBe(newTitle);
    expect(result.current.goals[0].hoursPerWeek).toBe(newHours);
    expect(result.current.error).toBeNull();
  });

  it('should delete a goal', async () => {
    // Arrange
    const goalId = '1';
    mockGoalsManager.deleteGoal.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.deleteGoal(goalId);
    });

    // Assert
    expect(mockGoalsManager.deleteGoal).toHaveBeenCalledWith(goalId);
    expect(result.current.goals).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors during goal operations', async () => {
    // Arrange
    const errorMessage = 'Failed to add goal';
    mockGoalsManager.addGoal.mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useTestStore());

    // Act & Assert
    await act(async () => {
      try {
        await result.current.addNewGoal('Test', 5);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toBe(errorMessage);
      }
    });

    expect(result.current.error).toBe(errorMessage);
    expect(console.error).toHaveBeenCalled();
  });
});
