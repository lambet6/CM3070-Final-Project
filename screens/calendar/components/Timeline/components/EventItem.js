import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles';
import {
  timeToPosition,
  HOUR_HEIGHT,
  formatTimeFromDecimal,
  dateToDecimalHours,
  HOURS,
  MIN_HOUR,
  MAX_HOUR,
} from '../utils/timelineHelpers';

const EventItem = ({ event, layout = null }) => {
  // Calculate position and height from event times
  const startTime = dateToDecimalHours(event.startDate);
  const endTime = dateToDecimalHours(event.endDate);

  // Use the MIN_HOUR and MAX_HOUR constants directly instead of parsing HOURS
  const timelineStartHour = MIN_HOUR;
  const timelineEndHour = MAX_HOUR;

  // Check if event is completely outside the timeline
  if (startTime >= timelineEndHour || endTime <= timelineStartHour) {
    return null; // Don't render events completely outside timeline
  }

  // Adjust start and end times for events partially within the timeline
  const adjustedStartTime = Math.max(startTime, timelineStartHour);
  const adjustedEndTime = Math.min(endTime, timelineEndHour);
  const adjustedDuration = adjustedEndTime - adjustedStartTime; // in hours

  const position = timeToPosition(adjustedStartTime);
  const height = adjustedDuration * HOUR_HEIGHT;

  // Original duration for display purposes
  const duration = endTime - startTime;

  // Check if the event was clipped
  const isClippedStart = startTime < timelineStartHour;
  const isClippedEnd = endTime > timelineEndHour;

  // Rest of your code remains the same...
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

  // Add visual indication for clipped events
  if (isClippedStart) {
    viewStyle.borderTopLeftRadius = 0;
    viewStyle.borderTopRightRadius = 0;
    viewStyle.borderTopWidth = 2;
    viewStyle.borderTopColor = '#4b6584';
    viewStyle.borderTopStyle = 'dashed';
  }

  if (isClippedEnd) {
    viewStyle.borderBottomLeftRadius = 0;
    viewStyle.borderBottomRightRadius = 0;
    viewStyle.borderBottomWidth = 2;
    viewStyle.borderBottomColor = '#4b6584';
    viewStyle.borderBottomStyle = 'dashed';
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
        {(isClippedStart || isClippedEnd) && ' ⋯'}
      </Text>
      <View
        style={layout && layout.columnCount > 1 ? styles.smallEventDetails : styles.EventDetails}>
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

export default React.memo(EventItem);
