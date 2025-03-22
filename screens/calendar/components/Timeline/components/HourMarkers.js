import React from 'react';
import { View, Text } from 'react-native';
import { HOURS, QUARTERS, HOUR_HEIGHT, QUARTER_HEIGHT } from '../utils/timelineHelpers';
import styles from '../styles';

const HourMarkers = () => {
  return HOURS.flatMap((hour, hourIndex) => {
    const markers = [
      <View key={`hour-${hourIndex}`} style={styles.hourContainer}>
        <Text style={styles.hourText}>{hour}</Text>
        <View style={styles.hourLine} />
      </View>,
    ];
    if (hourIndex < HOURS.length - 1) {
      markers.push(
        ...QUARTERS.slice(1).map((quarter, qIndex) => (
          <View
            key={`hour-${hourIndex}-q-${qIndex}`}
            style={[
              styles.quarterContainer,
              { top: hourIndex * HOUR_HEIGHT + (qIndex + 1) * QUARTER_HEIGHT },
            ]}>
            <Text style={styles.quarterText}>{quarter}</Text>
            <View style={styles.quarterLine} />
          </View>
        )),
      );
    }
    return markers;
  });
};

export default React.memo(HourMarkers);
