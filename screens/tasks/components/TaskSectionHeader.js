import React from 'react';
import { Text, StyleSheet } from 'react-native';

const TaskSectionHeader = ({ section }) => (
  <Text style={styles.priorityHeader}>{section.title}</Text>
);

const styles = StyleSheet.create({
  priorityHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default TaskSectionHeader;
