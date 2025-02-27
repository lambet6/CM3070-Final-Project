/*global jest*/
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { createCalendarStore } from '../../../store/calendarStore';
import { createSampleCalendarEvents } from '../../fixtures/calendar-fixtures';
import { createCalendarManager } from '../../../managers/calendar-manager';

// Automatically mock the repository
jest.mock('../../../managers/calendar-manager');

describe('Calendar Store', () => {
  let mockManager;
  let useTestStore;
  let sampleEvents;

  beforeEach(() => {
    // Get fresh test data for each test
    sampleEvents = createSampleCalendarEvents();

    // Create testing dependencies with proper injection
    mockManager = createCalendarManager();
    useTestStore = createCalendarStore(mockManager);

    // Spy on console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with empty events array', () => {
    // Arrange & Act
    const { result } = renderHook(() => useTestStore());

    // Assert
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should load weekly calendar events into the store', async () => {
    // Arrange
    mockManager.getWeeklyCalendarEvents.mockResolvedValueOnce([sampleEvents.meeting]);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.loadCalendarEvents();
    });

    // Assert
    expect(mockManager.getWeeklyCalendarEvents).toHaveBeenCalledTimes(1);
    expect(result.current.events[0]).toEqual(sampleEvents.meeting);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors when loading events', async () => {
    // Arrange
    const errorMessage = 'Failed to load calendar events';
    mockManager.getWeeklyCalendarEvents.mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.loadCalendarEvents();
    });

    // Assert
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toContain(errorMessage);
    expect(result.current.isLoading).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should create and add new event to the store', async () => {
    // Arrange
    const newEvent = sampleEvents.meeting;
    mockManager.createNewCalendarEvent.mockResolvedValueOnce(newEvent);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.createEvent(newEvent.title, newEvent.startDate, newEvent.endDate);
    });

    // Assert
    expect(mockManager.createNewCalendarEvent).toHaveBeenCalledTimes(1);
    expect(result.current.events).toContain(newEvent);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors when creating events', async () => {
    // Arrange
    const errorMessage = 'Failed to create event';
    mockManager.createNewCalendarEvent.mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useTestStore());
    const newEvent = sampleEvents.meeting;

    // Act & Assert
    await act(async () => {
      await expect(
        result.current.createEvent(newEvent.title, newEvent.startDate, newEvent.endDate),
      ).rejects.toThrow(errorMessage);
    });
  });
});
