import { getMoodDataFromRepo, updateMoodForToday } from '../repositories/wellbeing-repository';
import { Mood } from '../domain/Mood';

/**
 * Fetches mood data from the repository.
 * @returns {Promise<Array>} A promise that resolves to an array of mood data.
 */
export const getMoodData = async () => {
  return await getMoodDataFromRepo();
};

/**
 * Saves the mood for today.
 * @param {string} moodValue - The mood value to be saved.
 * @returns {Promise<Mood>} A promise that resolves to the newly created Mood object.
 */
export const saveMood = async (moodValue) => {
  const newMood = new Mood({
    mood: moodValue,
    date: new Date(),
  });
  await updateMoodForToday(newMood);
  return newMood;
};
