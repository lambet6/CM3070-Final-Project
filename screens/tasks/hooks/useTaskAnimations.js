import { useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';

export default function useTaskAnimations(tasks, tasksLoaded, loadTasks) {
  const animatedValues = useRef(new Map()).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  // Pre-initialize all items as invisible
  const initializeAnimations = useCallback(
    (taskId) => {
      if (!animatedValues.has(taskId)) {
        // Start with completely hidden values
        const animVal = new Animated.Value(0);
        animatedValues.set(taskId, animVal);
        return animVal;
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

      // Start all animations in sequence
      if (animations.length > 0) {
        Animated.sequence([
          // Small pause to ensure list container is fully visible first
          Animated.delay(100),
          // Run all task animations in parallel with their individual delays
          Animated.parallel(animations),
        ]).start();
      }
    }
  }, [animatedValues, tasks, tasksLoaded]);

  return {
    listOpacity,
    initializeAnimations,
  };
}
