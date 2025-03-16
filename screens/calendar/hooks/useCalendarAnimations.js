/*global setTimeout*/
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { CONSTANTS } from '../CalendarConstants';

export function useCalendarAnimations(isWeekView) {
  const slideAnimation = useSharedValue(0);
  const horizontalSlide = useSharedValue(0);

  // Create animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
  }));

  const weekRowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: horizontalSlide.value }],
  }));

  // Handle view mode changes
  useEffect(() => {
    slideAnimation.value = isWeekView ? 20 : -20;
    slideAnimation.value = withTiming(0, {
      duration: CONSTANTS.ANIMATION.DURATION,
      easing: CONSTANTS.ANIMATION.EASING,
    });
  }, [isWeekView, slideAnimation]);

  const animateHorizontalSlide = (initialValue, finalValue, updateFn) => {
    horizontalSlide.value = initialValue;
    horizontalSlide.value = withTiming(finalValue, {
      duration: CONSTANTS.ANIMATION.DURATION,
      easing: CONSTANTS.ANIMATION.EASING,
    });

    setTimeout(() => {
      updateFn();

      horizontalSlide.value = -finalValue;
      horizontalSlide.value = withTiming(0, {
        duration: CONSTANTS.ANIMATION.DURATION,
        easing: CONSTANTS.ANIMATION.EASING,
      });
    }, 50);
  };

  return {
    slideAnimation,
    horizontalSlide,
    animatedStyle,
    weekRowAnimatedStyle,
    animateHorizontalSlide,
  };
}
