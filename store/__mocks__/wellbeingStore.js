/* global jest beforeEach */
import { create } from 'zustand';

const mockMoodData = [];

export const useWellbeingStore = create((set) => ({
  // Initial state
  moodData: mockMoodData,
  error: null,
  isLoading: false,

  // Mock setters
  setMoodData: jest.fn((moodData) => set({ moodData })),
  setError: jest.fn((error) => set({ error })),
  setLoading: jest.fn((isLoading) => set({ isLoading })),
}));

// Reset all mock implementations between tests
beforeEach(() => {
  useWellbeingStore.getState().setMoodData.mockClear();
  useWellbeingStore.getState().setError.mockClear();
  useWellbeingStore.getState().setLoading.mockClear();
});

// Expose store reset helper for tests
export const resetWellbeingStore = () => {
  useWellbeingStore.setState({
    moodData: mockMoodData,
    error: null,
    isLoading: false,
  });
};
