// Mock the repository functions used in the manager
jest.mock('../../../repositories/wellbeing-repository', () => ({
    getMoodDataFromRepo: jest.fn(),
    updateMoodForToday: jest.fn().mockResolvedValue()
}));
import { getMoodDataFromRepo } from '../../../repositories/wellbeing-repository';

import { getMoodData, saveMood } from '../../../managers/wellbeing-manager';

describe('wellbeing-manager', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('getMoodData returns data with moodValue mapped correctly', async () => {
        // Provide an entry without moodValue; manager should map "Happy" to 4.
        const repoData = [{ mood: 'Happy', date: '2024-01-01T00:00:00.000Z' }];
        getMoodDataFromRepo.mockResolvedValue(repoData);
        const data = await getMoodData();
        expect(data).toEqual([{ mood: 'Happy', date: '2024-01-01T00:00:00.000Z', moodValue: 4 }]);
    });

    it('saveMood returns new mood data with correct moodValue', async () => {
        const mood = 'Very happy';
        const newMoodData = await saveMood(mood);
        expect(newMoodData.mood).toBe(mood);
        expect(newMoodData.moodValue).toBe(5);
        expect(newMoodData.date).toBeDefined();
    });
});
