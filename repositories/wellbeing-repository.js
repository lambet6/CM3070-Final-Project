import AsyncStorage from '@react-native-async-storage/async-storage';

const MOOD_DATA_KEY = 'MOOD_DATA';

export const getMoodDataFromRepo = async () => {
  const data = await AsyncStorage.getItem(MOOD_DATA_KEY);
  console.log('Retrieved Mood Data from Repo:', data);
  return data ? JSON.parse(data) : [];
};

export const saveMoodToRepo = async (moodData) => {
  const existingData = await getMoodDataFromRepo();
  const newData = [...existingData, moodData];
  await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(newData));
  console.log('Saved Mood Data to Repo:', newData);
};

export const updateMoodForToday = async (moodData) => {
  const existingData = await getMoodDataFromRepo();
  const today = new Date().toISOString().split('T')[0];
  const updatedData = existingData.filter(entry => entry.date.split('T')[0] !== today);
  updatedData.push(moodData);
  await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(updatedData));
  console.log('Updated Mood Data for Today:', updatedData);
};

