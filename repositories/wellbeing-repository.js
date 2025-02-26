import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mood } from '../domain/Mood';
import { parseISO } from 'date-fns';

export const MOOD_DATA_KEY = 'MOOD_DATA';

/**
 * Creates a wellbeing repository with the specified storage mechanism
 * @param {Object} storage - Storage implementation (defaults to AsyncStorage)
 * @returns {Object} Repository object with methods for wellbeing operations
 */
export const createWellbeingRepository = (storage = AsyncStorage) => {
  /**
   * Retrieves mood data from storage and converts it into Mood instances.
   * @returns {Promise<Mood[]>}
   * @throws {Error} If fetching or parsing fails.
   */
  const getMoodData = async () => {
    try {
      const data = await storage.getItem(MOOD_DATA_KEY);
      const parsedData = data ? JSON.parse(data) : [];
      return parsedData.map((moodData) => {
        try {
          return new Mood({
            mood: moodData.mood,
            date: parseISO(moodData.date),
          });
        } catch (error) {
          console.error('Error mapping mood data:', error);
          throw new Error('Invalid mood data format');
        }
      });
    } catch (error) {
      console.error('Error fetching mood data:', error);
      throw new Error('Failed to fetch mood data: ' + error.message);
    }
  };

  /**
   * Saves a mood entry by appending it to existing mood data.
   * @param {Mood} mood - The mood object to be saved.
   * @returns {Promise<void>}
   * @throws {Error} If saving fails.
   */
  const saveMood = async (mood) => {
    try {
      const existingData = await getMoodData();
      const newData = [...existingData, mood];
      await storage.setItem(MOOD_DATA_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving mood:', error);
      throw new Error('Failed to save mood: ' + error.message);
    }
  };

  /**
   * Updates the mood for the current day in storage.
   * Replaces any existing mood entry for today.
   * @param {Mood} mood - The mood object to update.
   * @returns {Promise<void>}
   * @throws {Error} If updating fails.
   */
  const updateMoodForToday = async (mood) => {
    try {
      const existingData = await getMoodData();
      const filteredData = existingData.filter((entry) => !entry.isToday());
      const updatedData = [...filteredData, mood];
      await storage.setItem(MOOD_DATA_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error updating mood:', error);
      throw new Error('Failed to update mood: ' + error.message);
    }
  };

  return {
    getMoodData,
    saveMood,
    updateMoodForToday,
  };
};

// Default repository instance for backward compatibility and easy use
export const wellbeingRepository = createWellbeingRepository();
