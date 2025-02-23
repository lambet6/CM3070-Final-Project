import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mood } from '../domain/Mood';

export const MOOD_DATA_KEY = 'MOOD_DATA';

/**
 * Retrieves mood data from AsyncStorage and converts it into Mood objects.
 *
 * @async
 * @function getMoodDataFromRepo
 * @returns {Promise<Mood[]>} A promise that resolves to an array of Mood objects.
 * @throws Will log an error to the console if AsyncStorage operations fail.
 */
export const getMoodDataFromRepo = async () => {
  try {
    const data = await AsyncStorage.getItem(MOOD_DATA_KEY);
    const parsedData = data ? JSON.parse(data) : [];
    return parsedData.map((moodData) => new Mood(moodData));
  } catch (error) {
    console.error('Error fetching mood data:', error);
    return [];
  }
};

/**
 * Saves a mood entry to the repository by appending it to existing mood data in AsyncStorage.
 *
 * @param {Mood} mood - The mood object to be saved.
 * @returns {Promise<void>} A promise that resolves when the mood is successfully saved.
 * @throws Will log an error to the console if there's an error saving the mood data.
 * @async
 */
export const saveMoodToRepo = async (mood) => {
  try {
    const existingData = await getMoodDataFromRepo();
    const newData = [...existingData, mood];
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error('Error saving mood:', error);
    throw error;
  }
};

/**
 * Updates the user's mood for the current day in AsyncStorage.
 * If a mood entry already exists for today, it will be replaced.
 *
 * @param {Mood} mood - The mood object to be stored.
 * @returns {Promise<void>} A promise that resolves when the mood is successfully updated.
 * @throws {Error} If there's an error updating the mood in AsyncStorage.
 * @async
 */
export const updateMoodForToday = async (mood) => {
  try {
    const existingData = await getMoodDataFromRepo();
    const filteredData = existingData.filter((entry) => !entry.isToday());
    const updatedData = [...filteredData, mood];
    await AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error updating mood:', error);
    throw error;
  }
};
