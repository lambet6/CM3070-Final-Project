import { StyleSheet, Dimensions } from 'react-native';
import { HOUR_HEIGHT, QUARTER_HEIGHT, TASK_ITEM_WIDTH, TIMELINE_OFFSET } from './utils';
import { TASK_ITEM_HEIGHT } from './utils';
import { useMemo } from 'react';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },

  // Unscheduled tasks
  unscheduledArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'rgba(39, 245, 140, 1)',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  unscheduledTasksContainer: {
    width: '100%',
    height: TASK_ITEM_HEIGHT / 2 + 20,
    // zIndex: 1,
  },
  unscheduledTaskList: {
    overflow: 'visible',
  },
  unscheduledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  taskCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  taskListContent: {
    paddingHorizontal: 10,
    gap: 10,
  },
  unscheduledTaskItem: {
    marginHorizontal: 5,
  },

  // Timeline styles
  timelineContainer: {
    flex: 1,
    // overflow: 'hidden',
  },
  timelineSideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TIMELINE_OFFSET,
    height: '100%',
  },
  timelineContent: {
    marginLeft: TIMELINE_OFFSET,
    position: 'relative',
    minHeight: 13 * HOUR_HEIGHT, // HOURS.length * HOUR_HEIGHT
    overflow: 'visible',
  },
  hourContainer: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hourText: {
    fontSize: 12,
    color: '#333',
  },
  hourLine: {
    position: 'absolute',
    right: 0,
    left: TIMELINE_OFFSET,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  quarterContainer: {
    position: 'absolute',
    left: 0,
    width: TIMELINE_OFFSET,
    height: QUARTER_HEIGHT,
    justifyContent: 'top',
    paddingHorizontal: 10,
  },
  quarterText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    width: '100%',
    paddingRight: 35,
  },
  quarterLine: {
    position: 'absolute',
    right: 0,
    left: TIMELINE_OFFSET - 20,
    height: 1,
    backgroundColor: '#e8e8e8',
  },

  // Base task item shared styles
  taskItem: {
    borderRadius: 8,
    padding: 10,
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 200,
  },

  // Text styles
  taskTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  taskDuration: {
    fontSize: 14,
    color: '#555',
  },
  unscheduledTaskTitle: {
    fontWeight: '600',
    fontSize: 12,
  },
  unscheduledTaskDuration: {
    fontSize: 10,
    color: '#555',
  },
  scheduledTaskTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  scheduledTaskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    textAlign: 'center',
  },
  EventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  smallEventDetails: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  scheduledTaskTime: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  scheduledTaskDuration: {
    fontSize: 12,
    color: '#555',
  },

  // Action buttons styles
  actionButtonsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  actionButton: {
    width: 120,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgb(224, 133, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  expandButton: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },

  // Scheduled task styles
  scheduledTaskStatic: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 5,
    backgroundColor: '#a8e6cf',
  },

  // Unscheduled task styles
  unscheduledTaskStatic: {
    width: TASK_ITEM_WIDTH / 2,
    height: TASK_ITEM_HEIGHT / 2,
    padding: 5,
  },

  // Non-schedulable task styles
  nonSchedulableTaskStatic: {
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderStyle: 'dashed',
  },
});
export default styles;

export const stylesTooltip = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.75)',
  },
});

// Helper functions for EventItem styling
export const getEventBaseStyle = (position, height) => ({
  position: 'absolute',
  top: position,
  height: height,
  backgroundColor: 'rgba(149, 175, 192, 0.6)',
  borderRadius: 8,
  padding: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#4b6584',
  zIndex: 50,
});

export const getEventWidthStyle = (layout) => {
  if (layout) {
    if (layout.isFullWidth) {
      return {
        left: 0,
        right: 0,
        marginHorizontal: 5,
      };
    } else {
      // Part of an overlap group
      return {
        width: `${layout.width}%`,
        left: `${layout.leftPosition}%`,
        marginHorizontal: 2, // Reduced for better fit
        padding: layout.columnCount > 2 ? 4 : 8, // Adjust padding for narrower events
      };
    }
  }

  // Fallback for events without layout data
  return {
    left: 0,
    right: 0,
    marginHorizontal: 5,
  };
};

export const getClippedEventStyle = (isClippedStart, isClippedEnd) => {
  const style = {};

  if (isClippedStart) {
    style.borderTopLeftRadius = 0;
    style.borderTopRightRadius = 0;
    style.borderTopWidth = 2;
    style.borderTopColor = '#4b6584';
    style.borderTopStyle = 'dashed';
  }

  if (isClippedEnd) {
    style.borderBottomLeftRadius = 0;
    style.borderBottomRightRadius = 0;
    style.borderBottomWidth = 2;
    style.borderBottomColor = '#4b6584';
    style.borderBottomStyle = 'dashed';
  }

  return style;
};

// Priority indicator styles
export const priorityIndicatorStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  high: {
    backgroundColor: '#ff5252', // Red color for high priority
  },
  medium: {
    backgroundColor: '#ffca28', // Yellow color for medium priority
  },
  low: {
    backgroundColor: '#4caf50', // Green color for low priority
  },
});
