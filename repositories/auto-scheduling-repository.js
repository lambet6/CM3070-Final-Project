/* global setTimeout clearTimeout AbortController */

/**
 * Creates an auto-scheduling repository for interacting with the scheduling optimization API
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Base URL of the scheduling API
 * @param {string} options.defaultUserId - Default user ID to use
 * @param {Function} options.fetch - Custom fetch implementation (defaults to global fetch)
 * @returns {Object} Repository object with methods for auto-scheduling operations
 */
export const createAutoSchedulingRepository = (options = {}) => {
  // Default options
  const baseUrl = options.baseUrl || 'https://task-scheduler-qpbq.onrender.com';
  const defaultUserId = options.defaultUserId || 'default-user';
  const fetchImpl = options.fetch || fetch;

  /**
   * Formats Task objects to the structure expected by the API
   * Ensures dates are consistently formatted
   * @param {Array} tasks - Array of Task objects from the app
   * @param {Date} targetDate - The date we're scheduling for
   * @returns {Array} Formatted task objects for the API
   */
  const formatTasks = (tasks, targetDate) => {
    // Create midnight for the target date
    const targetDateMidnight = new Date(targetDate);
    targetDateMidnight.setHours(23, 59, 59, 59);

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      estimated_duration: task.duration, // Map duration to estimated_duration
      due: targetDateMidnight.toISOString(), // Set all tasks' due date to the target date
    }));
  };

  /**
   * Formats CalendarEvent objects to the structure expected by the API
   * @param {Array} events - Array of CalendarEvent objects from the app
   * @returns {Array} Formatted event objects for the API
   */
  const formatEvents = (events) => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startDate.toISOString(), // Format start date as ISO string
      end: event.endDate.toISOString(), // Format end date as ISO string
    }));
  };

  /**
   * Converts API scheduled task responses back to domain-compatible format
   * @param {Array} scheduledTasks - The API scheduled tasks response
   * @param {Array} originalTasks - The original domain task objects
   * @returns {Array} Tasks with updated scheduled times in domain format
   */
  const convertScheduledTasksToDomain = (scheduledTasks, originalTasks) => {
    return scheduledTasks
      .map((scheduledTask) => {
        const originalTask = originalTasks.find((t) => t.id === scheduledTask.id);
        if (!originalTask) return null;

        // Parse the scheduled time from API response to a Date object
        try {
          const scheduledTime = new Date(scheduledTask.start);

          // Return the task with updated scheduled time
          return {
            id: originalTask.id,
            scheduledTime,
            originalTask,
          };
        } catch (error) {
          console.log(`Failed to parse scheduled time for task ${scheduledTask.id}:`, error);
          return null;
        }
      })
      .filter(Boolean);
  };

  /**
   * Sends a request to optimize the schedule with the given tasks and events
   * @param {Object} params - Scheduling parameters
   * @param {Array} params.tasks - Array of tasks to schedule
   * @param {Array} [params.events=[]] - Array of calendar events to consider as fixed
   * @param {Object} [params.constraints] - Scheduling constraints
   * @param {Object} [params.constraints.workHours] - Work hours constraints
   * @param {string} [params.constraints.workHours.start='09:00'] - Start time (HH:MM)
   * @param {string} [params.constraints.workHours.end='17:00'] - End time (HH:MM)
   * @param {number} [params.constraints.maxContinuousWorkMin=90] - Maximum continuous work time in minutes
   * @param {string} [params.optimizationGoal='maximize_wellbeing'] - Optimization goal
   * @param {string} [params.userId] - User ID (defaults to the configured default)
   * @param {Date} [params.targetDate] - The date we're scheduling for (defaults to today)
   * @returns {Promise<Object>} The scheduling response with status and scheduled tasks
   * @throws {Error} If the request fails or returns an error
   */
  const optimizeSchedule = async ({
    tasks,
    events = [],
    constraints = {
      workHours: { start: '07:00', end: '19:00' },
      maxContinuousWorkMin: 90,
    },
    optimizationGoal = 'maximize_wellbeing',
    userId = defaultUserId,
    targetDate = new Date(),
  }) => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('At least one task is required for scheduling');
    }

    try {
      // Format the request payload according to the API schema
      // Pass the target date to formatTasks
      const payload = {
        user_id: userId,
        tasks: formatTasks(tasks, targetDate),
        calendar_events: formatEvents(events),
        constraints: {
          work_hours: {
            start: constraints.workHours?.start || '08:00',
            end: constraints.workHours?.end || '20:00',
          },
          max_continuous_work_min: constraints.maxContinuousWorkMin || 90,
        },
        optimization_goal: optimizationGoal,
        target_date: targetDate.toISOString(),
      };

      console.log('Scheduling payload:', JSON.stringify(payload, null, 2));

      // Send the request
      const response = await fetchImpl(`${baseUrl}/optimize_schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage = `API returned status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, try to get the text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage += `: ${errorText}`;
          } catch (e2) {
            // If all else fails, just use the status code
          }
        }
        throw new Error(errorMessage);
      }

      // Parse the response
      // Parse the response
      const result = await response.json();

      console.log('Scheduling result:', JSON.stringify(result, null, 2));

      // Convert scheduled tasks to domain format
      const tasksToUpdate = convertScheduledTasksToDomain(result.scheduled_tasks || [], tasks);

      // Build response with both API and domain formatted data
      const schedulingResponse = {
        status: result.status,
        message: result.message,
        tasksToUpdate, // Domain-formatted tasks ready for the manager to use
        scheduledTasks:
          result.scheduled_tasks?.map((task) => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            estimatedDuration: task.estimated_duration,
            start: task.start,
            end: task.end,
            mandatory: task.mandatory,
          })) || [],
        unscheduledTaskIds: tasks
          .filter((task) => !tasksToUpdate.some((update) => update.id === task.id))
          .map((task) => task.id),
      };

      // Handle partial schedules
      if (result.status === 'partial') {
        console.warn('Partial schedule created:', result.message);
        return {
          ...schedulingResponse,
          isPartialSchedule: true,
        };
      }

      // Check for API-level errors
      if (result.status === 'error') {
        throw new Error(`Scheduling failed: ${result.message || 'Unknown error'}`);
      }

      // Return successful result
      return schedulingResponse;
    } catch (error) {
      // Handle specific error cases
      if (error.name === 'AbortError') {
        throw new Error('Request was aborted');
      } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        throw new Error('Network error - check your internet connection');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Failed to connect to the scheduling service');
      }

      // Re-throw with context
      console.log('Error optimizing schedule:', error);
      throw new Error(`Failed to optimize schedule: ${error.message}`);
    }
  };

  /**
   * Sends feedback about a schedule to improve future scheduling
   * @param {Object} params - Feedback parameters
   * @param {string} [params.userId] - User ID
   * @param {Object} params.scheduleData - The original schedule data
   * @param {Object} params.feedbackData - Feedback about the schedule
   * @param {number} params.feedbackData.moodScore - User's mood score (1-5)
   * @param {Array} [params.feedbackData.adjustedTasks=[]] - Tasks that were adjusted
   * @param {Array} [params.feedbackData.completedTasks=[]] - IDs of completed tasks
   * @returns {Promise<Object>} The response from the feedback API
   * @throws {Error} If the request fails
   */
  const recordFeedback = async ({ userId = defaultUserId, scheduleData, feedbackData }) => {
    if (!scheduleData) {
      throw new Error('Schedule data is required for feedback');
    }
    if (!feedbackData || typeof feedbackData.moodScore !== 'number') {
      throw new Error('Valid feedback data with mood score is required');
    }

    try {
      // Format the feedback payload according to the API schema
      const payload = {
        user_id: userId,
        schedule_data: scheduleData,
        feedback_data: {
          mood_score: feedbackData.moodScore,
          adjusted_tasks: feedbackData.adjustedTasks || [],
          completed_tasks: feedbackData.completedTasks || [],
        },
      };

      // Send the request
      const response = await fetchImpl(`${baseUrl}/record_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage = `API returned status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage += `: ${errorText}`;
          } catch (e2) {
            // If all else fails, just use the status code
          }
        }
        throw new Error(errorMessage);
      }

      // Parse and return the response
      return await response.json();
    } catch (error) {
      // Handle network errors or other exceptions
      if (error.name === 'AbortError') {
        throw new Error('Request was aborted');
      } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        throw new Error('Network error - check your internet connection');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Failed to connect to the feedback service');
      }

      // Re-throw with context
      console.log('Error recording feedback:', error);
      throw new Error(`Failed to record feedback: ${error.message}`);
    }
  };

  /**
   * Checks if the scheduling service is available
   * @returns {Promise<boolean>} True if the service is available, false otherwise
   */
  const isServiceAvailable = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // lightweight request to check if the service is up
      const response = await fetchImpl(`${baseUrl}/optimize_schedule`, {
        method: 'OPTIONS',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.warn('Scheduling service availability check failed:', error);
      return false;
    }
  };

  return {
    optimizeSchedule,
    recordFeedback,
    isServiceAvailable,
  };
};

// Default instance with standard configuration
export const autoSchedulingRepository = createAutoSchedulingRepository();
