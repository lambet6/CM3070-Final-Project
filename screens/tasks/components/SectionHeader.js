import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * Section header component for task lists
 * Displays a styled headline with animation
 */
const SectionHeader = React.memo(({ title }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.priorityHeader}>
      <Text variant="headlineSmall">{title}</Text>
    </Animated.View>
  );
});

SectionHeader.displayName = 'SectionHeader';

/**
 * Component styles with theme support
 */
const getStyles = (theme) =>
  StyleSheet.create({
    priorityHeader: {
      paddingVertical: 8,
      marginTop: 8,
      marginBottom: 4,
    },
  });

export default SectionHeader;
