import { getMoodDataFromRepo, updateMoodForToday } from '../repositories/wellbeing-repository';
import { Mood } from '../domain/Mood';

/**
 * Fetches mood data from the repository.
 * @returns {Promise<Mood[]>}
 * @throws {Error} with contextual information if fetching fails.
 */
export const getMoodData = async () => {
  try {
    return await getMoodDataFromRepo();
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
export const saveMood = async (moodValue) => {
  try {
    // Create a new Mood instance; the Mood model will validate the mood value.
    const newMood = new Mood({
      mood: moodValue,
      date: new Date(),
    });
    await updateMoodForToday(newMood);
    return newMood;
  } catch (error) {
    console.error('Error saving mood:', error);
    throw new Error(`Failed to save mood: ${error.message}`);
  }
};
