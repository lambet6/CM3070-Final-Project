/* global setTimeout clearTimeout */
import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FlipInXUp,
  FlipOutXUp,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { TASK_ITEM_HEIGHT, TASK_ITEM_WIDTH } from '../utils/timelineHelpers';

const Tooltip = ({ message, position, isVisible, onDismiss, parentViewLayout }) => {
  const dismissTimerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hasLayout, setHasLayout] = useState(false);
  const tooltipWidth = useSharedValue(0);
  const tooltipHeight = useSharedValue(0);
  const arrowPosition = useSharedValue(0);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

  // Update shared values when dimensions change
  useEffect(() => {
    tooltipWidth.value = dimensions.width;
    tooltipHeight.value = dimensions.height;
  }, [dimensions, tooltipHeight, tooltipWidth]);

  // Use animated style to safely access shared values
  const tooltipStyle = useAnimatedStyle(() => {
    // Calculate offsets based on actual dimensions
    const horizontalOffset = tooltipWidth.value / 2;
    const verticalOffset = tooltipHeight.value / 2 + TASK_ITEM_HEIGHT / 2;

    // Default positions (when no parentViewLayout is available)
    let tooltipX = position.x - horizontalOffset; // Center tooltip horizontally
    let tooltipY = position.y - verticalOffset; // Position above finger

    // If parentViewLayout is available, adjust position
    if (parentViewLayout) {
      const parentLayout = parentViewLayout.value;
      if (parentLayout) {
        // Adjust tooltip position based on parent view layout
        tooltipX = position.x - horizontalOffset + TASK_ITEM_WIDTH / 4;
        tooltipY = position.y - parentLayout.y - verticalOffset;
      }
    }

    // Calculate the center point for the arrow before boundary adjustments
    const targetX = tooltipX + horizontalOffset;

    // Ensure tooltip stays within screen boundaries
    // Horizontal boundaries
    const rightEdge = tooltipX + tooltipWidth.value;
    if (rightEdge > screenWidth - 10) {
      tooltipX = screenWidth - tooltipWidth.value - 10; // 10px padding from edge
    }
    if (tooltipX < 10) {
      tooltipX = 10; // 10px padding from left edge
    }

    // Set arrow position relative to the tooltip's adjusted position
    arrowPosition.value = targetX - tooltipX;

    return {
      position: 'absolute',
      left: tooltipX,
      top: tooltipY,
    };
  });

  // Style for the arrow
  const arrowStyle = useAnimatedStyle(() => {
    return {
      left: arrowPosition.value - 10, // -10 to center the 20px wide arrow
    };
  });

  // Set up auto-dismiss timer when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      // Clear any existing timer
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      // Set new timer to auto-dismiss after 3 seconds
      dismissTimerRef.current = setTimeout(() => {
        if (onDismiss) {
          onDismiss();
        }
      }, 3000);
    }

    // Cleanup timer on unmount or when visibility changes
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [isVisible, onDismiss, position, message]);

  // Don't render anything if not visible or no position
  if (!isVisible || !position) {
    return null;
  }
  if (!isVisible || !position) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        tooltipStyle,
        // Only show the tooltip once we have measured its dimensions
        !hasLayout && { opacity: 0 },
      ]}
      // entering={hasLayout ? FadeInDown : undefined}
      // exiting={FadeOutDown}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
        // Mark that we have layout information now
        setHasLayout(true);
      }}>
      <Text style={styles.text}>{message}</Text>
      <Animated.View style={[styles.arrow, arrowStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.75)',
  },
});

export default Tooltip;
