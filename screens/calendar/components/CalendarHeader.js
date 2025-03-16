import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from '@marceloterreiro/flash-calendar';
import { styles } from '../CalendarStyles';

export const CalendarHeader = ({ calendarRowMonth, onPrev, onNext, onReset, isToday }) => (
  <Calendar.HStack style={styles.headerContainer}>
    <TouchableOpacity onPress={onPrev} style={styles.navButton} activeOpacity={0.7}>
      <Text style={styles.navButtonText}>❮</Text>
    </TouchableOpacity>

    <View style={styles.titleContainer}>
      <Text style={styles.monthTitle}>{calendarRowMonth}</Text>
      <TouchableOpacity
        onPress={onReset}
        disabled={isToday}
        style={styles.todayButton}
        activeOpacity={0.7}>
        <Text style={styles.todayButtonText}>Today</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity onPress={onNext} style={styles.navButton} activeOpacity={0.7}>
      <Text style={styles.navButtonText}>❯</Text>
    </TouchableOpacity>
  </Calendar.HStack>
);
