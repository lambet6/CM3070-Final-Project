import { Task } from '../../domain/Task';

/**
 * Creates fresh sample task instances for testing
 * @returns {Object} Object containing sample task instances
 */
export const createSampleTasks = () => ({
  highPriorityTask: new Task({
    id: '1',
    title: 'High Priority Task',
    priority: 'High',
    dueDate: new Date('2025-02-10'),
    completed: false,
  }),

  mediumPriorityTask: new Task({
    id: '2',
    title: 'Medium Priority Task',
    priority: 'Medium',
    dueDate: new Date('2025-02-11'),
    completed: false,
  }),

  lowPriorityTask: new Task({
    id: '3',
    title: 'Low Priority Task',
    priority: 'Low',
    dueDate: new Date('2025-02-12'),
    completed: false,
  }),

  completedTask: new Task({
    id: '4',
    title: 'Completed Task',
    priority: 'Medium',
    dueDate: new Date('2025-02-09'),
    completed: true,
  }),
});

/**
 * Helper to create grouped tasks format
 * @param {Task[]} tasks - Array of tasks to group
 * @returns {Object} Object with tasks grouped by priority
 */
export const createGroupedTasks = (tasks = []) => {
  const high = tasks.filter((task) => task.priority === 'High');
  const medium = tasks.filter((task) => task.priority === 'Medium');
  const low = tasks.filter((task) => task.priority === 'Low');

  return { high, medium, low };
};

/**
 * Creates fresh grouped task sets for testing
 * @returns {Object} Object containing common grouped task arrangements
 */
export const createGroupedTaskSets = () => {
  const tasks = createSampleTasks();

  return {
    empty: { high: [], medium: [], low: [] },

    singleHighTask: {
      high: [tasks.highPriorityTask],
      medium: [],
      low: [],
    },

    allPriorities: {
      high: [tasks.highPriorityTask],
      medium: [tasks.mediumPriorityTask],
      low: [tasks.lowPriorityTask],
    },

    withCompleted: {
      high: [tasks.highPriorityTask],
      medium: [tasks.completedTask],
      low: [tasks.lowPriorityTask],
    },
  };
};

/**
 * Creates fresh test dates
 * @returns {Object} Object containing common test dates
 */
export const createTestDates = () => ({
  today: new Date('2025-02-15T12:00:00.000Z'),
  tomorrow: new Date('2025-02-16T12:00:00.000Z'),
  nextWeek: new Date('2025-02-22T12:00:00.000Z'),
});
