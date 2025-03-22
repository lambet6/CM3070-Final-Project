/* global setTimeout clearTimeout */
import React, { useState, useEffect } from 'react';
import { Text, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  StretchInX,
  StretchOutX,
  FlipInXDown,
  FlipOutXDown,
} from 'react-native-reanimated';

// Tooltip component
const Tooltip = ({ message, position, isVisible, onDismiss }) => {
  // Get screen dimensions for boundary checking - use Dimensions API for better cross-platform support
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Update dimensions when they change (handles rotation and resize)
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setDimensions({ width, height });
    };

    // Initial update
    updateDimensions();

    // Set up event listener
    const dimensionsListener = Dimensions.addEventListener('change', updateDimensions);

    // Clean up
    return () => {
      if (dimensionsListener?.remove) {
        dimensionsListener.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Auto-dismiss tooltip after 3 seconds
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss, position, message]);

  const [tooltipWidth, setTooltipWidth] = useState(250); // Default width
  const [tooltipHeight, setTooltipHeight] = useState(70); // Default height

  if (!isVisible) return null;

  // Constants
  const TOOLTIP_MARGIN = 5; // Margin from screen edges
  const ARROW_OFFSET = 2; // Space for visual arrow/pointer

  // Calculate adjusted positions
  // Start with the preferred position (above the tap point)
  let tooltipLeft = position.x;
  let tooltipTop = position.y - tooltipHeight + ARROW_OFFSET;

  // Left boundary check
  if (tooltipLeft < TOOLTIP_MARGIN) {
    tooltipLeft = TOOLTIP_MARGIN;
  }

  // Right boundary check
  if (tooltipLeft + tooltipWidth > dimensions.width - TOOLTIP_MARGIN) {
    tooltipLeft = dimensions.width - tooltipWidth - TOOLTIP_MARGIN;
  }

  // Top boundary check - if not enough space above, position below
  if (tooltipTop < TOOLTIP_MARGIN) {
    tooltipTop = position.y + ARROW_OFFSET; // Position below the tap point

    // Check if below also has enough space, otherwise place wherever there's more space
    if (tooltipTop + tooltipHeight > dimensions.height - TOOLTIP_MARGIN) {
      // If there's not enough space below either, place where there's more space
      const spaceAbove = position.y - TOOLTIP_MARGIN;
      const spaceBelow = dimensions.height - TOOLTIP_MARGIN - position.y - ARROW_OFFSET;

      if (spaceAbove > spaceBelow) {
        // More space above
        tooltipTop = TOOLTIP_MARGIN;
      } else {
        // More space below
        tooltipTop = dimensions.height - tooltipHeight - TOOLTIP_MARGIN;
      }
    }
  }

  // Bottom boundary check
  if (tooltipTop + tooltipHeight > dimensions.height - TOOLTIP_MARGIN) {
    tooltipTop = dimensions.height - tooltipHeight - TOOLTIP_MARGIN;
  }

  return (
    <Animated.View
      entering={FlipInXDown.duration(150)}
      exiting={FlipOutXDown.duration(150)}
      onLayout={(event) => {
        // Get actual dimensions after rendering
        const { width, height } = event.nativeEvent.layout;
        setTooltipWidth(width);
        setTooltipHeight(height);
      }}
      style={{
        position: 'absolute',
        top: tooltipTop,
        left: tooltipLeft,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        borderRadius: 6,
        maxWidth: Math.min(dimensions.width * 0.8, 350), // 80% of screen width, max 350
        zIndex: 1500, // Ensure it appears above other elements
      }}>
      <Text style={{ color: 'white', fontSize: 14 }}>{message}</Text>
    </Animated.View>
  );
};

export default Tooltip;
