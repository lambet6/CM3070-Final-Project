import { act } from 'react-test-renderer';
import { useWellbeingStore } from '../../../store/wellbeingStore';

// Mock the manager functions used by the store
jest.mock('../../../managers/wellbeing-manager', () => ({
    getMoodData: jest.fn(),
    saveMood: jest.fn()
}));
import { getMoodData, saveMood } from '../../../managers/wellbeing-manager';

describe('wellbeingStore', () => {
    beforeEach(() => {
        useWellbeingStore.setState({ moodData: [] });
        jest.resetAllMocks();
    });

    it('loads mood data and updates state', async () => {
        const dummyData = [{ mood: 'Happy', moodValue: 4, date: '2024-01-01T00:00:00.000Z' }];
        getMoodData.mockResolvedValue(dummyData);
        await act(async () => {
            await useWellbeingStore.getState().loadMoodData();
        });
        expect(useWellbeingStore.getState().moodData).toEqual(dummyData);
    });

    it('adds a mood and replaces any existing entry for today', async () => {
        const today = new Date().toISOString().split('T')[0];
        // set an existing mood for today
        const existing = { mood: 'Low', moodValue: 2, date: new Date().toISOString() };
        act(() => {
            useWellbeingStore.setState({ moodData: [existing] });
        });
        const newMood = { mood: 'Happy', moodValue: 4, date: new Date().toISOString() };
        saveMood.mockResolvedValue(newMood);

        await act(async () => {
            await useWellbeingStore.getState().addMood('Happy');
        });
        const state = useWellbeingStore.getState();
        // Expect only one entry for today and it should be the new mood
        const todayEntries = state.moodData.filter(entry => entry.date.split('T')[0] === today);
        expect(todayEntries).toHaveLength(1);
        expect(todayEntries[0]).toEqual(newMood);
    });

    it('returns correct structure for the last 14 days mood data', () => {
        const { labels, data } = useWellbeingStore.getState().getLast14DaysMoodData([]);
        expect(labels).toHaveLength(14);
        expect(data).toHaveLength(14);
        expect(data.every(value => value === 0)).toBeTruthy();
    });
});
