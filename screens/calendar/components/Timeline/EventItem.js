import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import {
  timeToPosition,
  HOUR_HEIGHT,
  formatTimeFromDecimal,
  dateToDecimalHours,
} from './utils/timelineHelpers';

const EventItem = ({ event, layout = null }) => {
  // Calculate position and height from event times
  const startTime = dateToDecimalHours(event.startDate);
  const endTime = dateToDecimalHours(event.endDate);
  const duration = endTime - startTime; // in hours

  const position = timeToPosition(startTime);
  const height = duration * HOUR_HEIGHT;

  // Default styles for full width (no overlap)
  let viewStyle = {
    position: 'absolute',
    top: position,
    height: height,
    backgroundColor: 'rgba(149, 175, 192, 0.6)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4b6584',
    zIndex: 50,
  };

  // If layout data is provided, check if the event is full width or part of a collision group
  if (layout) {
    if (layout.isFullWidth) {
      // Full width event (no overlaps)
      viewStyle = {
        ...viewStyle,
        left: 0,
        right: 0,
        marginHorizontal: 5,
      };
    } else {
      // Part of an overlap group
      viewStyle = {
        ...viewStyle,
        width: `${layout.width}%`,
        left: `${layout.leftPosition}%`,
        marginHorizontal: 2, // Reduced for better fit
      };

      // Adjust padding for narrower events
      if (layout.columnCount > 2) {
        viewStyle.padding = 4;
      }
    }
  } else {
    // Fallback for events without layout data (should be full width)
    viewStyle = {
      ...viewStyle,
      left: 0,
      right: 0,
      marginHorizontal: 5,
    };
  }

  return (
    <View style={viewStyle}>
      <Text
        style={[
          styles.scheduledTaskTitle,
          { fontWeight: '500' },
          // Reduce font size for narrower events
          layout && layout.columnCount > 1 ? { fontSize: 12 } : {},
        ]}
        numberOfLines={1}>
        {event.title}
      </Text>
      <View
        style={
          layout && layout.columnCount > 1
            ? styles.smallScheduledTaskDetails
            : styles.scheduledTaskDetails
        }>
        <Text
          style={[
            styles.scheduledTaskTime,
            // Reduce font size for narrower events
            layout && layout.columnCount > 1 ? { fontSize: 10 } : {},
          ]}>
          {formatTimeFromDecimal(startTime)} - {formatTimeFromDecimal(endTime)}
        </Text>
        <Text
          style={[
            styles.scheduledTaskDuration,
            // Reduce font size for narrower events
            layout && layout.columnCount > 1 ? { fontSize: 10 } : {},
          ]}>
          {Math.floor(duration)}h
          {Math.round((duration % 1) * 60) ? ` ${Math.round((duration % 1) * 60)}m` : ''}
        </Text>
      </View>
    </View>
  );
};

export default EventItem;
