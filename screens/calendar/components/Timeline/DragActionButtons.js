import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import styles from './styles';

const DragActionButtons = ({
  isVisible,
  removeButtonRef,
  cancelButtonRef,
  onLayoutChange,
  isRemoveHovered,
  isCancelHovered,
  isDraggingScheduled,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      zIndex: 2000,
      opacity: isVisible.value ? 1 : 0,
      pointerEvents: isVisible.value ? 'auto' : 'none',
    };
  });

  const cancelButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isCancelHovered.value ? 'rgb(224, 133, 0)' : 'transparent',
    };
  });

  const removeButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isRemoveHovered.value ? 'rgb(224, 133, 0)' : 'transparent',
      width: isDraggingScheduled.value ? 120 : 0,
      marginLeft: isDraggingScheduled.value ? 10 : 0,
    };
  });

  // Center cancel button when remove button is hidden
  const cancelContainerStyle = useAnimatedStyle(() => {
    return {
      width: isDraggingScheduled.value ? '50%' : '100%',
      alignItems: isDraggingScheduled.value ? 'flex-end' : 'center',
      paddingRight: isDraggingScheduled.value ? 10 : 0,
    };
  });

  const removeButtonTextStyle = useAnimatedStyle(() => {
    return {
      color: isRemoveHovered.value ? 'white' : 'rgb(224, 133, 0)',
    };
  });

  const cancelButtonTextStyle = useAnimatedStyle(() => {
    return {
      color: isCancelHovered.value ? 'white' : 'rgb(224, 133, 0)',
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={cancelContainerStyle}>
        <Animated.View
          ref={cancelButtonRef}
          style={[styles.actionButton, cancelButtonStyle]}
          onLayout={onLayoutChange}>
          <Animated.Text style={[styles.actionButtonIcon, cancelButtonTextStyle]}>↩</Animated.Text>
          <Animated.Text style={[styles.actionButtonText, cancelButtonTextStyle]}>
            Cancel
          </Animated.Text>
        </Animated.View>
      </Animated.View>
      <Animated.View
        ref={removeButtonRef}
        style={[styles.actionButton, removeButtonStyle]}
        onLayout={onLayoutChange}>
        <Animated.Text style={[styles.actionButtonIcon, removeButtonTextStyle]}>✕</Animated.Text>
        <Animated.Text style={[styles.actionButtonText, removeButtonTextStyle]}>
          Remove
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};

export default DragActionButtons;
