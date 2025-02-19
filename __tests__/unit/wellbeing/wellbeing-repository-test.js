import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getMoodDataFromRepo, 
  saveMoodToRepo, 
  updateMoodForToday,
  MOOD_DATA_KEY 
} from '../../../repositories/wellbeing-repository';


describe('wellbeing-repository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('getMoodDataFromRepo returns empty array if no data exists', async () => {
    const data = await getMoodDataFromRepo();
    expect(data).toEqual([]);
  });

  it('getMoodDataFromRepo returns parsed data if stored', async () => {
    const sampleData = [{ mood: 'Happy', moodValue: 4, date: '2024-01-01T00:00:00.000Z' }];
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(sampleData));
    const data = await getMoodDataFromRepo();
    expect(data).toEqual(sampleData);
  });

  it('saveMoodToRepo appends new mood data correctly', async () => {
    const newMood = { mood: 'Neutral', moodValue: 3, date: '2024-02-02T00:00:00.000Z' };
    await saveMoodToRepo(newMood);
    const storedValue = await AsyncStorage.getItem(MOOD_DATA_KEY);
    expect(JSON.parse(storedValue)).toEqual([newMood]);
    
    const anotherMood = { mood: 'Happy', moodValue: 4, date: '2024-02-03T00:00:00.000Z' };
    await saveMoodToRepo(anotherMood);
    const updatedValue = await AsyncStorage.getItem(MOOD_DATA_KEY);
    expect(JSON.parse(updatedValue)).toEqual([newMood, anotherMood]);
  });

  it('updateMoodForToday replaces any existing entry for today', async () => {
    // Pre-populate with two entries: one for today and one for another day 
    const today = new Date().toISOString();
    const todayDate = today.split('T')[0];
    const oldMoodToday = { mood: 'Low', moodValue: 2, date: today };
    const otherMood = { mood: 'Neutral', moodValue: 3, date: '2024-01-01T00:00:00.000Z' };
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify([oldMoodToday, otherMood]));

    const newMoodToday = { mood: 'Happy', moodValue: 4, date: new Date().toISOString() };
    await updateMoodForToday(newMoodToday);
    const storedValue = await AsyncStorage.getItem(MOOD_DATA_KEY);
    const allData = JSON.parse(storedValue);

    // Check that only one entry for today exists and it is newMoodToday, and otherMood remains unchanged
    const todayEntries = allData.filter(entry => entry.date.split('T')[0] === todayDate);
    expect(todayEntries).toHaveLength(1);
    expect(todayEntries[0]).toEqual(newMoodToday);
    expect(allData).toContainEqual(otherMood);
  });
});
