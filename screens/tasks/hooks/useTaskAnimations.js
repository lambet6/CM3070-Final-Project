/* global setTimeout, clearTimeout */
import { useRef, useEffect, useCallback, useState } from 'react';
import { Animated } from 'react-native';

export default function useTaskAnimations(tasks, tasksLoaded, loadTasks) {
  const animatedValues = useRef(new Map()).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const [animationsComplete, setAnimationsComplete] = useState(false);

  // Pre-initialize all items as invisible
  const initializeAnimations = useCallback(
    (taskId, forceValue = null) => {
      if (!animatedValues.has(taskId)) {
        // Start with completely hidden values
        const animVal = new Animated.Value(forceValue !== null ? forceValue : 0);
        animatedValues.set(taskId, animVal);
        return animVal;
      }
      // If we're forcing a value for an existing animation, update it
      if (forceValue !== null) {
        const animVal = animatedValues.get(taskId);
        animVal.setValue(forceValue);
      }
      return animatedValues.get(taskId);
    },
    [animatedValues],
  );

  // Make sure all task items have animation values before render
  useEffect(() => {
    // Pre-initialize all tasks with animation values set to 0 (hidden)
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    allTasks.forEach((task) => {
      initializeAnimations(task.id);
    });
  }, [initializeAnimations, tasks]);

  // Load tasks and fade in list
  useEffect(() => {
    const fetchTasks = async () => {
      await loadTasks();

      // Fade in the entire list container after data is loaded
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
    fetchTasks();
  }, [listOpacity, loadTasks]);

  // Set up animated values for new tasks
  useEffect(() => {
    if (tasksLoaded) {
      // Create new animation values for all tasks
      const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];

      // Prepare all animations
      const animations = allTasks.map((task, index) => {
        // We already pre-initialized the animation values, so just get them
        const animVal = animatedValues.get(task.id);

        // Return the animation to be started after a delay
        return Animated.spring(animVal, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: 200 + index * 80, // Initial delay + stagger timing
          useNativeDriver: true,
        });
      });

      // Calculate total animation duration (initial delay + all animations)
      const totalDuration =
        animations.length > 0 ? 100 + 200 + (animations.length - 1) * 80 + 300 : 400; // 300ms buffer for spring animation

      // Start all animations in sequence
      if (animations.length > 0) {
        Animated.sequence([
          // Small pause to ensure list container is fully visible first
          Animated.delay(100),
          // Run all task animations in parallel with their individual delays
          Animated.parallel(animations),
        ]).start();
      }

      // Set animations as complete after the estimated total duration
      const timer = setTimeout(() => {
        setAnimationsComplete(true);
      }, totalDuration);

      return () => clearTimeout(timer);
    }
  }, [animatedValues, tasks, tasksLoaded]);

  useEffect(() => {
    // Clean up animation values for deleted tasks
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    const allTaskIds = new Set(allTasks.map((task) => task.id));

    // Remove animation values that don't correspond to existing tasks
    animatedValues.forEach((_, key) => {
      if (!allTaskIds.has(key)) {
        animatedValues.delete(key);
      }
    });
  }, [tasks, animatedValues]);

  return {
    listOpacity,
    initializeAnimations,
    animationsComplete,
  };
}
