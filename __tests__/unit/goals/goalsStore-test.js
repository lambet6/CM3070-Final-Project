import { act } from 'react-test-renderer';
import { useGoalsStore } from '../../../store/goalsStore';

// Mock the manager functions used by the store
jest.mock('../../../managers/goals-manager', () => ({
    fetchGoals: jest.fn(),
    addGoal: jest.fn(),
    updateGoalData: jest.fn(),
    deleteGoal: jest.fn()
}));
import { fetchGoals, addGoal, updateGoalData, deleteGoal } from '../../../managers/goals-manager';

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
});
