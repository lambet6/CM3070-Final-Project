import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoalsFromRepo, saveGoalsToRepo, GOALS_KEY } from '../../../repositories/goals-repository';

describe('goals-repository', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
        jest.clearAllMocks();
    });

    it('getGoalsFromRepo returns empty array if nothing stored', async () => {
        const goals = await getGoalsFromRepo();
        expect(goals).toEqual([]);
    });

    it('getGoalsFromRepo returns parsed goals if stored', async () => {
        const sampleGoals = [{ id: '1', title: 'Test Goal', hoursPerWeek: 5 }];
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(sampleGoals));
        const goals = await getGoalsFromRepo();
        expect(goals).toEqual(sampleGoals);
    });

    it('saveGoalsToRepo stores goals correctly', async () => {
        const sampleGoals = [{ id: '1', title: 'Test Goal', hoursPerWeek: 5 }];
        await saveGoalsToRepo(sampleGoals);
        const stored = await AsyncStorage.getItem(GOALS_KEY);
        expect(JSON.parse(stored)).toEqual(sampleGoals);
    });

    it('getGoalsFromRepo handles errors and returns empty array', async () => {
        // Simulate AsyncStorage error by spying and forcing an error
        jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('test error'));
        const goals = await getGoalsFromRepo();
        expect(goals).toEqual([]);
    });
});
