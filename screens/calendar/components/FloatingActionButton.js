import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import { AnimatedFAB } from 'react-native-paper';

const FloatingActionButton = ({ isScrolled }) => {
  // The FAB is extended when not scrolled, collapsed when scrolled
  const isExtended = !isScrolled;

  return (
    <AnimatedFAB
      icon={'plus'}
      label={'Add Task'}
      extended={isExtended}
      onPress={() => console.log('FAB Pressed')}
      visible={true}
      animateFrom={'right'}
      iconMode={'static'}
      style={styles.fab}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FloatingActionButton;
