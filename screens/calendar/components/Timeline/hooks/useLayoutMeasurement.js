import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useAnimatedRef, runOnUI, measure, useSharedValue } from 'react-native-reanimated';

export const useLayoutMeasurement = () => {
  const timelineLayoutRef = useAnimatedRef();
  const removeButtonRef = useAnimatedRef();
  const cancelButtonRef = useAnimatedRef();
  const parentViewRef = useAnimatedRef(); // Add reference for parent view

  const timelineLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const removeButtonLayout = useSharedValue(null);
  const cancelButtonLayout = useSharedValue(null);
  const parentViewLayout = useSharedValue({ x: 0, y: 0, width: 0, height: 0 }); // Add layout for parent view
  const timelineViewHeight = useSharedValue(0);
  const layoutChanged = useSharedValue(0);

  // Measure timeline layout
  const measureTimelineOnUI = useCallback(() => {
    'worklet';
    try {
      const measured = measure(timelineLayoutRef);
      if (measured) {
        timelineLayout.value = {
          x: measured.pageX,
          y: measured.pageY,
          width: measured.width,
          height: measured.height,
        };

        // Update the visible height of the timeline
        timelineViewHeight.value = measured.height;
      }
    } catch (e) {
      console.log('Measurement error:', e);
    }
  }, [timelineLayoutRef, timelineLayout, timelineViewHeight]);

  // Measure buttons layout
  const measureButtons = useCallback(() => {
    'worklet';
    try {
      const removeMeasured = measure(removeButtonRef);
      const cancelMeasured = measure(cancelButtonRef);

      if (removeMeasured) {
        removeButtonLayout.value = {
          x: removeMeasured.pageX,
          y: removeMeasured.pageY,
          width: removeMeasured.width,
          height: removeMeasured.height,
        };
      }

      if (cancelMeasured) {
        cancelButtonLayout.value = {
          x: cancelMeasured.pageX,
          y: cancelMeasured.pageY,
          width: cancelMeasured.width,
          height: cancelMeasured.height,
        };
      }
    } catch (e) {
      console.log('Button measurement error:', e);
    }
  }, [removeButtonRef, cancelButtonRef, removeButtonLayout, cancelButtonLayout]);

  // Measure parent view layout
  const measureParentViewOnUI = useCallback(() => {
    'worklet';
    try {
      const measured = measure(parentViewRef);
      if (measured) {
        parentViewLayout.value = {
          x: measured.pageX,
          y: measured.pageY,
          width: measured.width,
          height: measured.height,
        };
      }
    } catch (e) {
      console.log('Parent view measurement error:', e);
    }
  }, [parentViewRef, parentViewLayout]);

  // Handle timeline layout
  const handleTimelineLayout = useCallback(
    (event) => {
      layoutChanged.value += 1;
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          runOnUI(measureTimelineOnUI)();
        });
      } else {
        runOnUI(measureTimelineOnUI)();
      }
    },
    [measureTimelineOnUI, layoutChanged],
  );

  // Handle button layout
  const handleButtonLayout = useCallback(() => {
    if (Platform.OS === 'ios') {
      requestAnimationFrame(() => {
        runOnUI(measureButtons)();
      });
    } else {
      runOnUI(measureButtons)();
    }
  }, [measureButtons]);

  // Handle parent view layout
  const handleParentViewLayout = useCallback(
    (event) => {
      layoutChanged.value += 1;
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          runOnUI(measureParentViewOnUI)();
        });
      } else {
        runOnUI(measureParentViewOnUI)();
      }
    },
    [measureParentViewOnUI, layoutChanged],
  );

  return {
    timelineLayoutRef,
    removeButtonRef,
    cancelButtonRef,
    parentViewRef,
    timelineLayout,
    removeButtonLayout,
    cancelButtonLayout,
    parentViewLayout,
    timelineViewHeight,
    layoutChanged,
    handleTimelineLayout,
    handleButtonLayout,
    handleParentViewLayout,
    measureButtons,
  };
};
