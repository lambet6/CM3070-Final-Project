/*global jest*/
import { describe, it, beforeEach, afterEach, expect, fail } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { createCalendarStore } from '../../../store/calendarStore';
import { createMockCalendarRepository } from '../../mocks/calendar-repository.mock';
import { createCalendarManager } from '../../../managers/calendar-manager';
import { createSampleCalendarEvents } from '../../fixtures/calendar-fixtures';

describe('Calendar Store', () => {
  let mockRepository;
  let mockManager;
  let useTestStore;
  let sampleEvents;

  beforeEach(() => {
    // Get fresh test data for each test
    sampleEvents = createSampleCalendarEvents();

    // Create testing dependencies with proper injection
    mockRepository = createMockCalendarRepository();
    mockManager = createCalendarManager(mockRepository);
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
    mockRepository.getStoredCalendarEvents.mockResolvedValueOnce([sampleEvents.meeting]);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.loadCalendarEvents();
    });

    // Assert
    expect(mockRepository.getStoredCalendarEvents).toHaveBeenCalledTimes(1);
    expect(result.current.events[0]).toEqual(sampleEvents.meeting);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors when loading events', async () => {
    // Arrange
    const errorMessage = 'Failed to load calendar events';
    mockRepository.getStoredCalendarEvents.mockRejectedValueOnce(new Error(errorMessage));
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
    mockRepository.addCalendarEvent.mockResolvedValueOnce(newEvent);
    const { result } = renderHook(() => useTestStore());

    // Act
    await act(async () => {
      await result.current.createEvent(newEvent.title, newEvent.startDate, newEvent.endDate);
    });

    // Assert
    expect(mockRepository.addCalendarEvent).toHaveBeenCalledTimes(1);
    expect(result.current.events).toContain(newEvent);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors when creating events', async () => {
    // Arrange
    const errorMessage = 'Failed to create event';
    mockRepository.addCalendarEvent.mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useTestStore());
    const newEvent = sampleEvents.meeting;

    // Act & Assert
    await act(async () => {
      try {
        await result.current.createEvent(newEvent.title, newEvent.startDate, newEvent.endDate);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain(errorMessage);
      }
    });
  });
});
