import React from 'react';
import { StyleSheet } from 'react-native';
import { AnimatedFAB } from 'react-native-paper';

/**
 * FloatingActionButton - Renders an animated Floating Action Button
 *
 * Features:
 * - Dynamically extends/collapses based on scroll state
 * - Static icon mode
 * - Positioned at the bottom right of the screen
 */
const FloatingActionButton = ({ isScrolled, onPress }) => {
  // The FAB is extended when not scrolled, collapsed when scrolled
  const isExtended = !isScrolled;

  return (
    <AnimatedFAB
      icon={'plus'}
      label={'Add Task'}
      extended={isExtended}
      onPress={onPress}
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
