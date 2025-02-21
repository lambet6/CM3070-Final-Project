jest.mock('../../../repositories/goals-repository', () => ({
    getGoalsFromRepo: jest.fn(),
    saveGoalsToRepo: jest.fn()
}));

import { getGoalsFromRepo, saveGoalsToRepo } from '../../../repositories/goals-repository';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../../../managers/goals-manager';
import { Goal } from '../../../domain/Goal';

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
    });

    describe('addGoal', () => {
        it('handles invalid goal creation without affecting existing goals', async () => {
            const existingGoal = new Goal({ id: '1', title: 'Existing', hoursPerWeek: 5 });
            getGoalsFromRepo.mockResolvedValue([existingGoal]);

            // Should fail due to domain validation
            const result = await addGoal(null, 5);
            
            expect(result).toEqual([existingGoal]);
            expect(saveGoalsToRepo).not.toHaveBeenCalled();
        });

        it('creates new goal with valid data', async () => {
            getGoalsFromRepo.mockResolvedValue([]);
            
            const result = await addGoal('New Goal', 3);
            
            expect(result[0]).toBeInstanceOf(Goal);
            expect(result[0].title).toBe('New Goal');
            expect(result[0].hoursPerWeek).toBe(3);
            expect(saveGoalsToRepo).toHaveBeenCalledWith(result);
        });
    });

    describe('updateGoalData', () => {
        it('preserves other goals when update fails', async () => {
            const goals = [
                new Goal({ id: '1', title: 'Goal 1', hoursPerWeek: 5 }),
                new Goal({ id: '2', title: 'Goal 2', hoursPerWeek: 3 })
            ];
            getGoalsFromRepo.mockResolvedValue(goals);

            const result = await updateGoalData('1', null, 3);
            
            expect(result).toEqual(goals);
            expect(saveGoalsToRepo).not.toHaveBeenCalled();
        });

        it('updates goal when data is valid', async () => {
            const originalGoal = new Goal({ id: '1', title: 'Original', hoursPerWeek: 2 });
            getGoalsFromRepo.mockResolvedValue([originalGoal]);

            const result = await updateGoalData('1', 'Updated', 3);
            
            expect(result[0].title).toBe('Updated');
            expect(result[0].hoursPerWeek).toBe(3);
            expect(saveGoalsToRepo).toHaveBeenCalledWith(result);
        });
    });

    describe('deleteGoal', () => {
        it('removes goal while preserving others', async () => {
            const goals = [
                new Goal({ id: '1', title: 'Goal 1', hoursPerWeek: 5 }),
                new Goal({ id: '2', title: 'Goal 2', hoursPerWeek: 3 })
            ];
            getGoalsFromRepo.mockResolvedValue(goals);

            const result = await deleteGoal('1');
            
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('2');
            expect(saveGoalsToRepo).toHaveBeenCalledWith(result);
        });
    });
});
