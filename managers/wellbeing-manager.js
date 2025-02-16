import { getMoodDataFromRepo, saveMoodToRepo } from '../repositories/wellbeing-repository';

export const getMoodData = async () => {
  const data = await getMoodDataFromRepo();
  return data.map((entry) => ({
    ...entry,
    moodValue: entry.moodValue ?? moodToValue(entry.mood)
  }));
};

const moodToValue = (mood) => {
  switch (mood) {
    case 'Very low': return 1;
    case 'Low': return 2;
    case 'Neutral': return 3;
    case 'Happy': return 4;
    case 'Very happy': return 5;
    default: return 3;
  }
};

export const saveMood = async (mood) => {
  const newMoodData = { mood, moodValue: moodToValue(mood), date: new Date() };
  await saveMoodToRepo(newMoodData);
  return newMoodData;
};
