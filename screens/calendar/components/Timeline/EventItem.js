import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import {
  timeToPosition,
  HOUR_HEIGHT,
  formatTimeFromDecimal,
  dateToDecimalHours,
} from './utils/timelineHelpers';

const EventItem = ({ event }) => {
  // Calculate position and height from event times
  const startTime = dateToDecimalHours(event.startDate);
  const endTime = dateToDecimalHours(event.endDate);
  const duration = endTime - startTime; // in hours

  const position = timeToPosition(startTime);
  const height = duration * HOUR_HEIGHT;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: position,
        height: height,
        backgroundColor: 'rgba(149, 175, 192, 0.6)', // Different color from tasks
        borderRadius: 8,
        marginHorizontal: 5,
        padding: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4b6584',
        zIndex: 50, // Below tasks but above timeline grid
      }}>
      <Text style={[styles.scheduledTaskTitle, { fontWeight: '500' }]} numberOfLines={1}>
        {event.title}
      </Text>
      <View style={styles.scheduledTaskDetails}>
        <Text style={styles.scheduledTaskTime}>
          {formatTimeFromDecimal(startTime)} - {formatTimeFromDecimal(endTime)}
        </Text>
        <Text style={styles.scheduledTaskDuration}>
          {Math.floor(duration)}h
          {Math.round((duration % 1) * 60) ? ` ${Math.round((duration % 1) * 60)}m` : ''}
        </Text>
      </View>
    </View>
  );
};

export default EventItem;
