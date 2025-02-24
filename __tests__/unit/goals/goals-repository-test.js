/*global jest*/
import { describe, it, beforeEach, expect } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getGoalsFromRepo,
  saveGoalsToRepo,
  GOALS_KEY,
} from '../../../repositories/goals-repository';
import { Goal } from '../../../domain/Goal';

describe('goals-repository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('getGoalsFromRepo returns empty array if nothing stored', async () => {
    const goals = await getGoalsFromRepo();
    expect(goals).toEqual([]);
  });

  it('getGoalsFromRepo returns properly instantiated Goal objects', async () => {
    const sampleGoalData = { id: '1', title: 'Test Goal', hoursPerWeek: 5 };
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([sampleGoalData]));

    const goals = await getGoalsFromRepo();

    expect(goals.length).toBe(1);
    expect(goals[0]).toBeInstanceOf(Goal);
    expect(goals[0].id).toBe(sampleGoalData.id);
    expect(goals[0].title).toBe(sampleGoalData.title);
    expect(goals[0].hoursPerWeek).toBe(sampleGoalData.hoursPerWeek);
  });

  it('saveGoalsToRepo stores goals correctly and maintains only necessary properties', async () => {
    const goal = new Goal({ id: '1', title: 'Test Goal', hoursPerWeek: 5 });
    await saveGoalsToRepo([goal]);

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

  it('getGoalsFromRepo handles invalid data by skipping invalid goals', async () => {
    const invalidData = [
      { id: '1', title: null, hoursPerWeek: 5 },
      { id: '2', title: 'Valid Goal', hoursPerWeek: 10 },
    ];
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(invalidData));

    const goals = await getGoalsFromRepo();

    expect(goals.length).toBe(1);
    expect(goals[0].id).toBe('2');
  });

  it('should throw error when storage operations fail', async () => {
    // Test fetch failure
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('Storage error'));
    await expect(getGoalsFromRepo()).rejects.toThrow('Failed to fetch goals: Storage error');

    // Test save failure
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('Storage error'));
    const goal = new Goal({ id: '1', title: 'Test Goal', hoursPerWeek: 5 });
    await expect(saveGoalsToRepo([goal])).rejects.toThrow('Failed to save goals: Storage error');
  });
});
