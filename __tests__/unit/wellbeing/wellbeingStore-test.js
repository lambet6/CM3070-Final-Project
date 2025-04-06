/*global */
import { useWellbeingStore } from '../../../store/wellbeingStore';
import { describe, it, beforeEach, expect, jest } from '@jest/globals';

describe('wellbeingStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useWellbeingStore.setState({
      moodData: [],
      error: null,
      isLoading: false,
    });
  });

  describe('initial state', () => {
    it('should initialize with empty mood data', () => {
      expect(useWellbeingStore.getState().moodData).toEqual([]);
    });

    it('should initialize with null error', () => {
      expect(useWellbeingStore.getState().error).toBeNull();
    });

    it('should initialize with loading set to false', () => {
      expect(useWellbeingStore.getState().isLoading).toBe(false);
    });
  });

  describe('setMoodData', () => {
    it('should update mood data with single entry', () => {
      const testData = [{ mood: 'happy', date: '2025-04-06' }];
      useWellbeingStore.getState().setMoodData(testData);
      expect(useWellbeingStore.getState().moodData).toEqual(testData);
    });

    it('should update mood data with multiple entries', () => {
      const testData = [
        { mood: 'happy', date: '2025-04-06' },
        { mood: 'sad', date: '2025-04-05' },
        { mood: 'neutral', date: '2025-04-04' },
      ];
      useWellbeingStore.getState().setMoodData(testData);
      expect(useWellbeingStore.getState().moodData).toEqual(testData);
    });

    it('should replace existing mood data instead of merging', () => {
      // Set initial data
      const initialData = [{ mood: 'content', date: '2025-04-03' }];
      useWellbeingStore.getState().setMoodData(initialData);

      // Set new data
      const newData = [{ mood: 'happy', date: '2025-04-06' }];
      useWellbeingStore.getState().setMoodData(newData);

      // Check that data was replaced, not merged
      expect(useWellbeingStore.getState().moodData).toEqual(newData);
      expect(useWellbeingStore.getState().moodData).not.toContainEqual(initialData[0]);
    });

    it('should handle empty array', () => {
      // First set some data
      useWellbeingStore.getState().setMoodData([{ mood: 'happy', date: '2025-04-06' }]);

      // Then clear it
      useWellbeingStore.getState().setMoodData([]);
      expect(useWellbeingStore.getState().moodData).toEqual([]);
    });
  });

  describe('setError', () => {
    it('should update error state with string', () => {
      const testError = 'Network error';
      useWellbeingStore.getState().setError(testError);
      expect(useWellbeingStore.getState().error).toBe(testError);
    });

    it('should update error state with Error object', () => {
      const testError = new Error('Test error message');
      useWellbeingStore.getState().setError(testError);
      expect(useWellbeingStore.getState().error).toBe(testError);
    });

    it('should clear error state when null is passed', () => {
      // Set an error first
      useWellbeingStore.getState().setError('Some error');

      // Clear it
      useWellbeingStore.getState().setError(null);
      expect(useWellbeingStore.getState().error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should update loading state to true', () => {
      useWellbeingStore.getState().setLoading(true);
      expect(useWellbeingStore.getState().isLoading).toBe(true);
    });

    it('should update loading state to false', () => {
      // First set to true
      useWellbeingStore.getState().setLoading(true);

      // Then back to false
      useWellbeingStore.getState().setLoading(false);
      expect(useWellbeingStore.getState().isLoading).toBe(false);
    });
  });

  describe('state interaction', () => {
    it('should maintain separate state properties', () => {
      // Update all properties
      useWellbeingStore.getState().setMoodData([{ mood: 'happy', date: '2025-04-06' }]);
      useWellbeingStore.getState().setError('Some error');
      useWellbeingStore.getState().setLoading(true);

      // Verify all properties maintain their values
      expect(useWellbeingStore.getState().moodData).toEqual([
        { mood: 'happy', date: '2025-04-06' },
      ]);
      expect(useWellbeingStore.getState().error).toBe('Some error');
      expect(useWellbeingStore.getState().isLoading).toBe(true);
    });

    it('should allow updating one property without affecting others', () => {
      // Set initial state
      useWellbeingStore.getState().setMoodData([{ mood: 'happy', date: '2025-04-06' }]);
      useWellbeingStore.getState().setError('Some error');
      useWellbeingStore.getState().setLoading(true);

      // Update only one property
      useWellbeingStore.getState().setError(null);

      // Verify other properties remain unchanged
      expect(useWellbeingStore.getState().moodData).toEqual([
        { mood: 'happy', date: '2025-04-06' },
      ]);
      expect(useWellbeingStore.getState().error).toBeNull();
      expect(useWellbeingStore.getState().isLoading).toBe(true);
    });
  });

  describe('multiple store operations', () => {
    it('should handle rapid sequential updates correctly', () => {
      // Perform multiple updates in sequence
      useWellbeingStore.getState().setLoading(true);
      useWellbeingStore.getState().setMoodData([{ mood: 'happy', date: '2025-04-06' }]);
      useWellbeingStore.getState().setError('An error occurred');
      useWellbeingStore.getState().setLoading(false);

      // Verify final state
      expect(useWellbeingStore.getState().moodData).toEqual([
        { mood: 'happy', date: '2025-04-06' },
      ]);
      expect(useWellbeingStore.getState().error).toBe('An error occurred');
      expect(useWellbeingStore.getState().isLoading).toBe(false);
    });

    it('should support loading-data-error flow', () => {
      // Simulate start of data loading
      useWellbeingStore.getState().setLoading(true);
      useWellbeingStore.getState().setError(null);

      // Simulate successful data load
      useWellbeingStore.getState().setMoodData([{ mood: 'happy', date: '2025-04-06' }]);
      useWellbeingStore.getState().setLoading(false);

      // Verify state reflects successful operation
      expect(useWellbeingStore.getState().moodData).toEqual([
        { mood: 'happy', date: '2025-04-06' },
      ]);
      expect(useWellbeingStore.getState().error).toBeNull();
      expect(useWellbeingStore.getState().isLoading).toBe(false);

      // Simulate another load with error
      useWellbeingStore.getState().setLoading(true);
      useWellbeingStore.getState().setError(null);

      // Simulate error during load
      useWellbeingStore.getState().setError('Failed to fetch');
      useWellbeingStore.getState().setLoading(false);

      // Data should remain unchanged, but error should be set
      expect(useWellbeingStore.getState().moodData).toEqual([
        { mood: 'happy', date: '2025-04-06' },
      ]);
      expect(useWellbeingStore.getState().error).toBe('Failed to fetch');
      expect(useWellbeingStore.getState().isLoading).toBe(false);
    });
  });
});
