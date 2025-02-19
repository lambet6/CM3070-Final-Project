// Mock the repository functions used in the manager
jest.mock('../../../repositories/goals-repository', () => ({
    getGoalsFromRepo: jest.fn(),
    saveGoalsToRepo: jest.fn()
}));
import { getGoalsFromRepo, saveGoalsToRepo } from '../../../repositories/goals-repository';
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../../../managers/goals-manager';

describe('goals-manager', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('fetchGoals returns goals without empty titles and updates storage if needed', async () => {
        const repoGoals = [
            { id: '1', title: 'Goal 1', hoursPerWeek: 5 },
            { id: '2', title: '   ', hoursPerWeek: 3 }
        ];
        getGoalsFromRepo.mockResolvedValue(repoGoals);
        const filtered = [{ id: '1', title: 'Goal 1', hoursPerWeek: 5 }];
        await fetchGoals();
        expect(saveGoalsToRepo).toHaveBeenCalledWith(filtered);
    });

    it('addGoal prevents adding empty goal and returns existing goals', async () => {
        getGoalsFromRepo.mockResolvedValue([]);
        const result = await addGoal('', 0);
        expect(result).toEqual([]);
    });

    it('addGoal appends and returns updated goals', async () => {
        const existing = [{ id: '1', title: 'Goal 1', hoursPerWeek: 5 }];
        getGoalsFromRepo.mockResolvedValue(existing);
        const result = await addGoal('New Goal', 0);
        expect(saveGoalsToRepo).toHaveBeenCalled();
        expect(result.length).toBe(existing.length + 1);
        expect(result[result.length - 1].title).toBe('New Goal');
    });

    it('updateGoalData updates goal and filters out empty titles', async () => {
        const repoGoals = [{ id: '1', title: 'Old Goal', hoursPerWeek: 2 }];
        getGoalsFromRepo.mockResolvedValue(repoGoals);
        const result = await updateGoalData('1', '   ', 3);
        expect(result).toEqual([]);
        // Now update with a non-empty title
        getGoalsFromRepo.mockResolvedValue(repoGoals);
        const updated = await updateGoalData('1', 'Updated Goal', 3);
        expect(updated[0].title).toBe('Updated Goal');
    });

    it('deleteGoal removes the goal and returns updated list', async () => {
        const repoGoals = [
            { id: '1', title: 'Goal 1', hoursPerWeek: 5 },
            { id: '2', title: 'Goal 2', hoursPerWeek: 3 }
        ];
        getGoalsFromRepo.mockResolvedValue(repoGoals);
        const result = await deleteGoal('1');
        expect(result).toEqual([{ id: '2', title: 'Goal 2', hoursPerWeek: 3 }]);
    });
});
