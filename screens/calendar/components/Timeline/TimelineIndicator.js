import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export const TimelineIndicator = ({ visible, position, height, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: position.value,
      height: height.value,
      marginHorizontal: 5,
      opacity: visible.value ? 1 : 0,
      zIndex: style.zIndex || 500,
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
