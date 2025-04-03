import { parseISO } from 'date-fns';
import { autoSchedulingRepository } from '../repositories/auto-scheduling-repository';

/**
 * Creates an auto-scheduling manager that coordinates between task manager,
 * calendar manager, and auto-scheduling repository
 *
 * @param {Object} dependencies - Dependencies needed by the manager
 * @param {Object} dependencies.taskManager - Task manager instance
 * @param {Object} dependencies.calendarManager - Calendar manager instance
 * @param {Object} dependencies.repository - Auto-scheduling repository (optional)
 * @returns {Object} Auto-scheduling manager functions
 */
export const createAutoSchedulingManager = (dependencies) => {
  const { taskManager, calendarManager, repository = autoSchedulingRepository } = dependencies;

  /**
   * Generates an optimized schedule for tasks due on or before the specified date
   *
   * @param {Date} date - The date to generate a schedule for
   * @param {Object} options - Additional scheduling options
   * @param {Object} [options.constraints] - Custom scheduling constraints
   * @param {Object} [options.constraints.workHours] - Work hours for the specified date
   * @param {string} [options.constraints.workHours.start] - Start time (HH:MM)
   * @param {string} [options.constraints.workHours.end] - End time (HH:MM)
   * @param {number} [options.constraints.maxContinuousWorkMin] - Maximum continuous work time
   * @param {string} [options.optimizationGoal] - Optimization strategy to use
   * @returns {Promise<Object>} Scheduling result information
   * @throws {Error} If scheduling fails
   */
  const generateScheduleForDate = async (date, options = {}) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Valid date is required for scheduling');
    }

    try {
      // Check if service is available before proceeding
      const isServiceAvailable = await repository.isServiceAvailable();
      if (!isServiceAvailable) {
        throw new Error('Auto-scheduling service is currently unavailable');
      }

      // 1. Get tasks for the selected date
      const { dueToday: tasksForScheduling } = await taskManager.getTasksForDate(date);

      // 2. Get events for the selected date
      const eventsForScheduling = await calendarManager.getEventsForDate(date);
      console.log('Events for scheduling:', eventsForScheduling);

      // If there are no tasks to schedule, return early
      if (tasksForScheduling.length === 0) {
        return {
          status: 'success',
          message: 'No tasks available for scheduling',
          scheduledTasks: [],
          unscheduledTasks: [],
          date: date,
        };
      }

      // 3. Call the auto-scheduling repository
      const schedulingResult = await repository.optimizeSchedule({
        tasks: tasksForScheduling,
        events: eventsForScheduling,
        constraints: options.constraints,
        optimizationGoal: options.optimizationGoal,
        targetDate: date,
      });

      // 4. Use the domain-converted tasks directly from the repository
      const { tasksToUpdate, scheduledTasks = [], unscheduledTaskIds = [] } = schedulingResult;

      // 5. Update all tasks in one batch operation
      await taskManager.updateTaskScheduledTimes(tasksToUpdate);

      // Create the updated tasks list with the scheduled times
      const updatedTasks = tasksToUpdate.map((update) => ({
        ...update.originalTask,
        scheduledTime: update.scheduledTime,
      }));
      console.log('Updated tasks:', updatedTasks);

      // Find tasks that couldn't be scheduled using the IDs the repository provided
      const unscheduledTasks = tasksForScheduling.filter((task) =>
        unscheduledTaskIds.includes(task.id),
      );

      // 6. Return information about the scheduling result
      let resultMessage =
        scheduledTasks.length > 0
          ? `Successfully scheduled ${scheduledTasks.length} tasks`
          : 'No tasks could be scheduled for the selected date';

      // Customize message for partial schedules
      if (schedulingResult.isPartialSchedule || schedulingResult.status === 'partial') {
        resultMessage =
          unscheduledTasks.length > 0
            ? `Created partial schedule with ${scheduledTasks.length} tasks. ${unscheduledTasks.length} tasks couldn't be scheduled due to time constraints.`
            : 'Created partial schedule.';
      }

      return {
        status: schedulingResult.isPartialSchedule ? 'partial' : 'success',
        message: resultMessage,
        scheduledTasks: updatedTasks.filter(Boolean),
        unscheduledTasks: unscheduledTasks,
        date: date,
        isPartialSchedule:
          schedulingResult.isPartialSchedule || schedulingResult.status === 'partial',
      };
    } catch (error) {
      console.log('Error in auto-scheduling:', error);
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }
  };

  /**
   * Records feedback about a previously generated schedule
   *
   * @param {Object} params - Feedback parameters
   * @param {Date} params.date - The date the schedule was for
   * @param {number} params.moodScore - User's mood score (1-5)
   * @param {Array} [params.completedTaskIds=[]] - IDs of completed tasks
   * @param {Array} [params.adjustedTasks=[]] - Tasks that were manually adjusted
   * @param {Object} [params.scheduleData] - The original schedule data (if available)
   * @returns {Promise<Object>} Feedback submission result
   */
  const recordScheduleFeedback = async ({
    date,
    moodScore,
    completedTaskIds = [],
    adjustedTasks = [],
    scheduleData,
  }) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Valid date is required for feedback');
    }

    if (typeof moodScore !== 'number' || moodScore < 1 || moodScore > 5) {
      throw new Error('Mood score must be a number between 1 and 5');
    }

    try {
      return await repository.recordFeedback({
        feedbackData: {
          moodScore,
          completedTasks: completedTaskIds,
          adjustedTasks,
        },
        scheduleData: scheduleData || {
          date: date.toISOString(),
          target_date: date.toISOString(), // Add explicit target date
        },
      });
    } catch (error) {
      console.log('Error recording schedule feedback:', error);
      throw new Error(`Failed to record feedback: ${error.message}`);
    }
  };

  /**
   * Clears scheduled times for all tasks on the specified date
   *
   * @param {Date} date - The date to clear schedule for
   * @returns {Promise<Object>} Result with count of cleared tasks
   */
  const clearScheduleForDate = async (date) => {
    try {
      const result = await taskManager.clearSchedulesForDate(date);

      return {
        status: 'success',
        message: `Cleared scheduled times for ${result.count} tasks`,
        count: result.count,
        date: date,
      };
    } catch (error) {
      console.log('Error clearing schedule:', error);
      throw new Error(`Failed to clear schedule: ${error.message}`);
    }
  };

  return {
    generateScheduleForDate,
    recordScheduleFeedback,
    clearScheduleForDate,
  };
};
