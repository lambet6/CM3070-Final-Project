import { Mood } from '../domain/Mood';
import { subDays, startOfDay, isSameDay } from 'date-fns';

/**
 * Creates a wellbeing manager that uses the provided repository and store
 * @param {Object} repository - Repository with wellbeing operations
 * @param {Function} getStore - Function to get the store state/actions
 * @returns {Object} Wellbeing manager functions
 */
export const createWellbeingManager = (repository, getStore) => {
  /**
   * Fetches mood data from the repository.
   * @returns {Promise<Mood[]>}
   * @throws {Error} with contextual information if fetching fails.
   */
  const getMoodData = async () => {
    const store = getStore();
    store.setLoading(true);

    try {
      const data = await repository.getMoodData();
      store.setMoodData(data);
      store.setError(null);
      return data;
    } catch (error) {
      console.error('Error fetching mood data:', error);
      store.setError(`Failed to fetch mood data: ${error.message}`);
      store.setMoodData([]);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  /**
   * Saves today's mood.
   * @param {string} moodValue - The mood value to be saved.
   * @returns {Promise<Mood>} The newly saved Mood object.
   * @throws {Error} with context if saving fails.
   */
  const saveMood = async (moodValue) => {
    const store = getStore();
    store.setError(null);

    try {
      // Create a new Mood instance; the Mood model will validate the mood value.
      const newMood = new Mood({
        mood: moodValue,
        date: new Date(),
      });
      await repository.updateMoodForToday(newMood);

      // Update the store
      const currentMoodData = store.moodData;
      const updatedMoodData = currentMoodData.filter((entry) => !entry.isToday());
      store.setMoodData([...updatedMoodData, newMood]);

      return newMood;
    } catch (error) {
      console.error('Error saving mood:', error);
      store.setError(`Failed to save mood: ${error.message}`);
      throw error;
    }
  };

  /**
   * Returns mood chart data for the last 14 days.
   * @returns {{labels: string[], data: number[]}}
   */
  const getLast14DaysMoodData = () => {
    const store = getStore();
    const moodData = store.moodData;
    const today = startOfDay(new Date());
    const last14Days = Array.from({ length: 14 }, (_, i) => subDays(today, 13 - i));

    const fullData = last14Days.map((date) => {
      const entry = moodData.find((entry) => isSameDay(entry.date, date));
      return { date, moodValue: entry ? entry.moodValue : 0 };
    });

    return {
      labels: fullData.map((item) => item.date.toISOString().slice(0, 10)),
      data: fullData.map((item) => item.moodValue),
    };
  };

  return {
    getMoodData,
    saveMood,
    getLast14DaysMoodData,
  };
};
