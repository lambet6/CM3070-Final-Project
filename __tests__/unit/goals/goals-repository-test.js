/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGoalsRepository, GOALS_KEY } from '../../../repositories/goals-repository';
import { Goal } from '../../../domain/Goal';

describe('Goals Repository', () => {
  let goalsRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();

    // Create a fresh repository instance for each test
    goalsRepository = createGoalsRepository();
  });

  it('returns empty array if nothing stored', async () => {
    // Act
    const goals = await goalsRepository.getGoals();

    // Assert
    expect(goals).toEqual([]);
  });

  it('returns properly instantiated Goal objects', async () => {
    // Arrange
    const sampleGoalData = { id: '1', title: 'Test Goal', hoursPerWeek: 5 };
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([sampleGoalData]));

    // Act
    const goals = await goalsRepository.getGoals();

    // Assert
    expect(goals.length).toBe(1);
    expect(goals[0]).toBeInstanceOf(Goal);
    expect(goals[0].id).toBe(sampleGoalData.id);
    expect(goals[0].title).toBe(sampleGoalData.title);
    expect(goals[0].hoursPerWeek).toBe(sampleGoalData.hoursPerWeek);
  });

  it('stores goals correctly and maintains only necessary properties', async () => {
    // Arrange
    const goal = new Goal({ id: '1', title: 'Test Goal', hoursPerWeek: 5 });

    // Act
    await goalsRepository.saveGoals([goal]);

    // Assert
    const stored = await AsyncStorage.getItem(GOALS_KEY);
    const parsedStored = JSON.parse(stored);

    expect(parsedStored).toEqual([
      {
        id: '1',
        title: 'Test Goal',
        hoursPerWeek: 5,
      },
    ]);
  });

  it('handles invalid data by skipping invalid goals', async () => {
    // Arrange
    const invalidData = [
      { id: '1', title: null, hoursPerWeek: 5 },
      { id: '2', title: 'Valid Goal', hoursPerWeek: 10 },
    ];
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(invalidData));

    // Act
    const goals = await goalsRepository.getGoals();

    // Assert
    expect(goals.length).toBe(1);
    expect(goals[0].id).toBe('2');
  });

  it('throws error when storage operations fail', async () => {
    // Arrange - Mock storage with errors
    const mockErrorStorage = {
      getItem: jest.fn().mockRejectedValue(new Error('Storage error')),
      setItem: jest.fn().mockRejectedValue(new Error('Storage error')),
    };

    // Create repository with error-generating storage
    const errorRepository = createGoalsRepository(mockErrorStorage);

    // Act & Assert - Test fetch failure
    await expect(errorRepository.getGoals()).rejects.toThrow(
      'Failed to fetch goals: Storage error',
    );

    // Act & Assert - Test save failure
    const goal = new Goal({ id: '1', title: 'Test Goal', hoursPerWeek: 5 });
    await expect(errorRepository.saveGoals([goal])).rejects.toThrow(
      'Failed to save goals: Storage error',
    );
  });

  it('works with a custom storage implementation', async () => {
    // Arrange - Create an in-memory mock storage
    let storedData = null;
    const mockStorage = {
      getItem: jest.fn().mockImplementation(() => Promise.resolve(storedData)),
      setItem: jest.fn().mockImplementation((key, value) => {
        storedData = value;
        return Promise.resolve();
      }),
    };

    // Create repository with custom storage
    const customRepository = createGoalsRepository(mockStorage);

    // Act - Save data
    const goal = new Goal({ id: '1', title: 'Custom Storage Goal', hoursPerWeek: 7 });
    await customRepository.saveGoals([goal]);

    // Assert - Mock methods were called
    expect(mockStorage.setItem).toHaveBeenCalledWith(GOALS_KEY, expect.any(String));

    // Act - Retrieve data
    const retrievedGoals = await customRepository.getGoals();

    // Assert - Data was correctly retrieved
    expect(retrievedGoals.length).toBe(1);
    expect(retrievedGoals[0].title).toBe('Custom Storage Goal');
    expect(mockStorage.getItem).toHaveBeenCalledWith(GOALS_KEY);
  });
});
