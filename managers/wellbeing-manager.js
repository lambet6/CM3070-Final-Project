import { Mood } from '../domain/Mood';

/**
 * Creates a wellbeing manager that uses the provided repository
 * @param {Object} repository - Repository with wellbeing operations
 * @returns {Object} Wellbeing manager functions
 */
export const createWellbeingManager = (repository) => {
  /**
   * Fetches mood data from the repository.
   * @returns {Promise<Mood[]>}
   * @throws {Error} with contextual information if fetching fails.
   */
  const getMoodData = async () => {
    try {
      return await repository.getMoodData();
    } catch (error) {
      throw new Error(`Failed to fetch mood data: ${error.message}`);
    }
  };

  /**
   * Saves today's mood.
   * @param {string} moodValue - The mood value to be saved.
   * @returns {Promise<Mood>} The newly saved Mood object.
   * @throws {Error} with context if saving fails.
   */
  const saveMood = async (moodValue) => {
    try {
      // Create a new Mood instance; the Mood model will validate the mood value.
      const newMood = new Mood({
        mood: moodValue,
        date: new Date(),
      });
      await repository.updateMoodForToday(newMood);
      return newMood;
    } catch (error) {
      console.error('Error saving mood:', error);
      throw new Error(`Failed to save mood: ${error.message}`);
    }
  };

  return {
    getMoodData,
    saveMood,
  };
};
