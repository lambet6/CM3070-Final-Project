import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export const TimelineIndicator = ({ visible, position, height, style, isValid }) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Dynamic styling based on position validity
    const validStyle = {
      backgroundColor: 'rgba(0, 123, 255, 0.4)',
      borderColor: 'rgba(0, 123, 255, 0.6)',
    };

    const invalidStyle = {
      backgroundColor: 'rgba(255, 0, 0, 0.4)',
      borderColor: 'rgba(255, 0, 0, 0.6)',
    };

    // Apply color based on validity
    const colorStyle = isValid && isValid.value ? validStyle : invalidStyle;

    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 1 : 0,
      zIndex: 500,
      borderRadius: 8,
      borderWidth: 2,
      ...colorStyle,
      ...style,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

export const GhostSquare = ({ visible, position, height, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 0.5 : 0,
      zIndex: 400,
      backgroundColor: 'rgba(156, 156, 156, 0.43)',
      borderRadius: 8,
      ...style,
    };
  });

  return <Animated.View style={animatedStyle} />;
};
