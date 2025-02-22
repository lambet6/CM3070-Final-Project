// Mock the repository functions used in the manager
jest.mock('../../../repositories/wellbeing-repository', () => ({
    getMoodDataFromRepo: jest.fn(),
    updateMoodForToday: jest.fn().mockResolvedValue()
}));
import { getMoodDataFromRepo } from '../../../repositories/wellbeing-repository';

import { getMoodData, saveMood } from '../../../managers/wellbeing-manager';
import { Mood } from '../../../domain/Mood';

describe('wellbeing-manager', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('getMoodData returns array of Mood objects', async () => {
        const mockMood = new Mood({ mood: 'Happy', date: '2024-01-01T00:00:00.000Z' });
        getMoodDataFromRepo.mockResolvedValue([mockMood]);
        
        const data = await getMoodData();
        expect(data[0]).toBeInstanceOf(Mood);
        expect(data[0].mood).toBe('Happy');
        expect(data[0].moodValue).toBe(4);
    });

    it('saveMood creates and returns new Mood object', async () => {
        const mood = 'Very happy';
        const newMoodData = await saveMood(mood);
        
        expect(newMoodData).toBeInstanceOf(Mood);
        expect(newMoodData.mood).toBe(mood);
        expect(newMoodData.moodValue).toBe(5);
        expect(newMoodData.date).toBeInstanceOf(Date);
    });
});
