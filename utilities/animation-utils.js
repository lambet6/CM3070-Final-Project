import { Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

/**
 * Creates animated styles for task list items
 * @param {Animated.Value} animValue - The animation value
 * @param {boolean} isHidden - Whether this is for the hidden actions view
 * @returns {Object} Animation styles
 */
export const createAnimatedStyles = (animValue, isHidden = false) => {
  // Shared transformations that are the same for visible and hidden items
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.2, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.8, 1.05, 1],
  });

  // Different opacity behavior for visible vs hidden items
  const opacity = animValue.interpolate({
    inputRange: isHidden
      ? [0, 0.9, 1] // Hidden items stay invisible longer
      : [0, 0.6, 1], // Visible items fade in earlier
    outputRange: isHidden
      ? [0, 0, 1] // Hidden items pop in at end
      : [0, 0.7, 1], // Visible items fade in gradually
  });

  return {
    transform: [{ translateY }, { scale }],
    opacity,
    marginBottom: 8,
    ...(isHidden ? { flex: 1 } : {}),
  };
};
