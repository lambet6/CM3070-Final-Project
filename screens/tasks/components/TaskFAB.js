import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const TaskFAB = ({ onPress }) => (
  <TouchableOpacity testID="fab-add-task" style={styles.fab} onPress={onPress}>
    <Text style={styles.fabText}>+</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'blue',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
  },
});

export default TaskFAB;
