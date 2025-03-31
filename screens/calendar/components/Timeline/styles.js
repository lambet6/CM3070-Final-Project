import { StyleSheet, Dimensions } from 'react-native';
import { HOUR_HEIGHT, QUARTER_HEIGHT, TASK_ITEM_WIDTH, TIMELINE_OFFSET } from './utils';
import { TASK_ITEM_HEIGHT } from './utils';
import { useTheme } from 'react-native-paper';
import { useMemo } from 'react';
import { te } from 'date-fns/locale';

export const useTimelineStyles = () => {
  const theme = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
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
          // borderBottomWidth: 1,
          // borderBottomColor: '#e0e0e0',
          backgroundColor: theme.colors.primary,
          paddingVertical: 10,
        },
        sectionTitle: {
          color: theme.colors.onPrimary,
        },
        unscheduledTasksContainer: {
          width: '100%',
          height: TASK_ITEM_HEIGHT / 2 + 20,
          // zIndex: 1,
          zIndex: 100,
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
          color: theme.colors.onSurfaceVariant,
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
        emptyStateContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyStateText: {
          color: theme.colors.onPrimary,
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
          // backgroundColor: theme.colors.surface,
          // overflow: 'hidden',
        },
        timelineSideBar: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: TIMELINE_OFFSET,
          height: '100%',
          backgroundColor: theme.colors.surfaceVariant,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
        },
        timelineContent: {
          marginLeft: TIMELINE_OFFSET,
          position: 'relative',
          minHeight: 13 * HOUR_HEIGHT,
          overflow: 'visible',
        },
        hourContainer: {
          height: HOUR_HEIGHT,
          width: TIMELINE_OFFSET,
          flexDirection: 'row',
          borderColor: theme.colors.outline,
          borderBottomWidth: 0.5,
        },
        hourLabelRow: {
          paddingHorizontal: 5,
          flex: 1,
          // height: QUARTER_HEIGHT,
          // justifyContent: 'flex-start',
          // alignItems: 'flex-start',
        },
        hourText: {
          color: theme.colors.onSurfaceVariant,
        },
        quartersContainer: {
          flexDirection: 'column',
          justifyContent: 'center',
          // borderWidth: 1,
          // justifyContent: 'flex-start',
          // alignItems: 'flex-start',
        },
        quarterRow: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          // paddingHorizontal: 16,
          // borderWidth: 1,
        },
        quarterText: {
          color: theme.colors.outline,
          // opacity: 0.8,
          textAlign: 'right',
          marginRight: 8,
        },
        quarterDot: {
          width: 4,
          height: 2,
          borderRadius: 2,
          backgroundColor: theme.colors.outline,
          // opacity: 0.6,
        },
        hourDivider: {
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 30,
        },

        // Base task item shared styles
        taskItem: {
          borderRadius: 8,
          paddingRight: 10,
          paddingLeft: 16,
          justifyContent: 'center',
          alignItems: 'center',
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
          color: theme.colors.onPrimaryContainer,
        },
        unscheduledTaskDuration: {
          color: theme.colors.onPrimaryContainer,
        },
        scheduledTaskTitle: {
          color: theme.colors.onSecondaryContainer,
        },
        scheduledTaskDetails: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          // marginTop: 4,
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
          color: theme.colors.onSecondaryContainer,
        },
        scheduledTaskDuration: {
          color: theme.colors.outline,
        },

        // Event item styles
        eventText: {
          color: theme.colors.onTertiaryContainer,
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
          borderColor: theme.colors.onPrimary,
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
        cancelButtonIcon: {
          fontSize: 18,
        },
        removeButtonIcon: {
          fontSize: 14,
        },

        // Scheduled task styles
        scheduledTaskStatic: {
          position: 'absolute',
          left: 0,
          right: 0,
          marginHorizontal: 5,
          backgroundColor: theme.colors.secondaryContainer,
        },

        // Unscheduled task styles
        unscheduledTaskStatic: {
          width: TASK_ITEM_WIDTH / 2,
          height: TASK_ITEM_HEIGHT / 2,
          padding: 5,
          backgroundColor: theme.colors.primaryContainer,
          zIndex: 1000,
        },

        unscheduledTaskDragged: {
          backgroundColor: theme.colors.secondaryContainer,
          zIndex: 1000,
        },

        // Non-schedulable task styles
        nonSchedulableTaskStatic: {
          borderWidth: 1,
          borderColor: '#bdbdbd',
          borderStyle: 'dashed',
        },
      }),
    [theme],
  );
};

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
export const getEventBaseStyle = (position, height, theme) => ({
  position: 'absolute',
  top: position,
  height: height,
  backgroundColor: theme.colors.tertiaryContainer,
  borderRadius: 8,
  padding: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#ff00ff',
  zIndex: 1,
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
