import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTaskStore } from '../../store/taskStore';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Icon, Snackbar, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useBottomSheet } from '../../contexts/BottomSheetContext';
import { SegmentedButtons, Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { FlatList } from 'react-native-gesture-handler';

// Custom hooks
import useTaskActions from './hooks/useTaskActions';
import useSelectionMode from './hooks/useSelectionMode';

// Components
import SwipeableTaskItem from './components/SwipeableTaskItem';

// Constants for item height calculation
const ITEM_HEIGHT = 64;
const SECTION_HEADER_HEIGHT = 42;

// Create animated versions of our components
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Item types for our FlashList
const ITEM_TYPES = {
  SECTION_HEADER: 'section-header',
  TASK_ITEM: 'task-item',
};

const calculateOffset = (data, index) => {
  // Calculate the offset position of an item in the list
  // by determining the total height of all items before it
  let offset = 0;

  for (let i = 0; i < index; i++) {
    offset += data[i].type === ITEM_TYPES.SECTION_HEADER ? SECTION_HEADER_HEIGHT : ITEM_HEIGHT;
  }

  return offset;
};

// Section Header component with animations
const SectionHeader = React.memo(({ title }) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.priorityHeader}>
      <Text variant="headlineSmall">{title}</Text>
    </Animated.View>
  );
});
SectionHeader.displayName = 'SectionHeader';

// Prepare data for Priority view FlashList (flattening sections)
const preparePriorityData = (sections) => {
  const data = [];

  sections.forEach((section) => {
    // Add section header
    data.push({
      id: `header-${section.title}`,
      title: section.title,
      type: ITEM_TYPES.SECTION_HEADER,
    });

    // Add tasks with their type
    section.data.forEach((task) => {
      data.push({
        ...task,
        type: ITEM_TYPES.TASK_ITEM,
      });
    });
  });

  return data;
};

// MemoizedSwipeableTaskItem component (from original code)
const MemoizedSwipeableTaskItem = React.memo(SwipeableTaskItem, (prevProps, nextProps) => {
  // Shallow compare task properties that affect rendering
  return (
    Object.is(prevProps.task.id, nextProps.task.id) &&
    Object.is(prevProps.task.title, nextProps.task.title) &&
    Object.is(prevProps.task.dueDate, nextProps.task.dueDate) &&
    Object.is(prevProps.task.completed, nextProps.task.completed) &&
    Object.is(prevProps.task.priority, nextProps.task.priority) &&
    Object.is(prevProps.selected, nextProps.selected) &&
    Object.is(prevProps.selectionMode, nextProps.selectionMode)
  );
});

export default function TasksScreen() {
  // Get state from store with shallow equality to prevent unnecessary rerenders
  const tasks = useTaskStore((state) => state.tasks);
  const error = useTaskStore((state) => state.error);
  const getConsolidatedTasks = useTaskStore((state) => state.getConsolidatedTasks);

  // Pre-compute consolidated tasks to avoid recomputation during view toggle
  const consolidatedTasks = useMemo(() => getConsolidatedTasks(), [tasks]);

  // Get methods from manager
  const taskManager = useTaskManager();

  const [viewMode, setViewMode] = useState('Priority'); // 'Priority' or 'DueDate'

  // Animation values for view transitions
  const priorityOpacity = useSharedValue(1);
  const dueDateOpacity = useSharedValue(0);

  const theme = useTheme();
  const styles = getStyles(theme);

  const {
    snackbarState,
    setSnackbarState,
    handleDeleteTask,
    handleDeleteMultipleTasks,
    handleSnackbarDismiss,
  } = useTaskActions(tasks, taskManager.createNewTask, taskManager.deleteTasks);

  const {
    selectionMode,
    selectedItems,
    handleLongPress,
    handleSelectionToggle,
    cancelSelection,
    deleteSelectedItems,
  } = useSelectionMode(handleDeleteMultipleTasks);

  const { openSheet } = useBottomSheet();

  const [optimisticUpdates, setOptimisticUpdates] = useState({});

  // Handle view mode change with animations
  const handleViewModeChange = useCallback(
    (newMode) => {
      // Only process if the view is actually changing
      if (newMode !== viewMode) {
        const sharedConfig = { duration: 200 };

        if (newMode === 'Priority') {
          dueDateOpacity.value = withTiming(0, sharedConfig);
          priorityOpacity.value = withTiming(1, sharedConfig);
        } else {
          priorityOpacity.value = withTiming(0, sharedConfig);
          dueDateOpacity.value = withTiming(1, sharedConfig);
        }

        // Update state only after animation is in progress
        setViewMode(newMode);
      }
    },
    [viewMode, priorityOpacity, dueDateOpacity],
  );

  useEffect(() => {
    const rescheduleTasks = async () => {
      try {
        // Handle any overdue tasks
        const { count } = await taskManager.rescheduleOverdueTasks();

        // Show notification immediately if needed
        if (count > 0) {
          setSnackbarState({
            visible: true,
            message: `${count} overdue ${count === 1 ? 'task' : 'tasks'} rescheduled to tomorrow`,
            action: {
              label: 'OK',
              onPress: () => setSnackbarState((prev) => ({ ...prev, visible: false })),
            },
          });
        }
      } catch (error) {
        console.error('Failed to reschedule tasks', error);
      }
    };

    rescheduleTasks();
  }, [setSnackbarState, taskManager]); // Run once on component mount

  // Memoize priority sections to prevent recalculation on every render
  const prioritySections = useMemo(() => {
    return [
      { title: 'High Priority', data: tasks.high },
      { title: 'Medium Priority', data: tasks.medium },
      { title: 'Low Priority', data: tasks.low },
    ];
  }, [tasks.high, tasks.medium, tasks.low]);

  // Prepare data for priority view
  const priorityData = useMemo(() => preparePriorityData(prioritySections), [prioritySections]);

  // Ensure consolidated tasks are ready for the due date view
  const dueDateData = useMemo(
    () =>
      consolidatedTasks.map((task) => ({
        ...task,
        type: ITEM_TYPES.TASK_ITEM,
      })),
    [consolidatedTasks],
  );

  // Create animated styles for view transitions
  const priorityAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: priorityOpacity.value,
      display: priorityOpacity.value === 0 ? 'none' : 'flex',
    };
  });

  const dueDateAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: dueDateOpacity.value,
      display: dueDateOpacity.value === 0 ? 'none' : 'flex',
    };
  });

  // Item renderer for FlashList - shared between both views
  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === ITEM_TYPES.SECTION_HEADER) {
        return <SectionHeader title={item.title} />;
      }

      // Apply optimistic update if available
      const optimisticCompleted =
        optimisticUpdates[item.id] !== undefined ? optimisticUpdates[item.id] : item.completed;

      // Create a modified task with optimistic completion state
      const displayTask =
        optimisticUpdates[item.id] !== undefined
          ? { ...item, completed: optimisticCompleted }
          : item;

      return (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <MemoizedSwipeableTaskItem
            task={displayTask} // Use modified task
            onEdit={() => {
              openSheet(item); // Open sheet with the task to edit
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onDelete={() => handleDeleteTask(item.id)}
            onTap={() => {
              if (selectionMode) {
                handleSelectionToggle(item.id);
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                // Apply optimistic update first for immediate UI feedback
                const isCompleted = !item.completed;
                setOptimisticUpdates((prev) => ({
                  ...prev,
                  [item.id]: isCompleted,
                }));

                // Then perform the actual update
                taskManager.toggleTaskCompletion(item.id).catch((error) => {
                  // Revert the optimistic update if there's an error
                  setOptimisticUpdates((prev) => ({
                    ...prev,
                    [item.id]: !isCompleted,
                  }));
                });
              }
            }}
            onLongPress={() => {
              if (!selectionMode) {
                handleLongPress(item.id);
              }
            }}
            selected={selectedItems.includes(item.id)}
            selectionMode={selectionMode}
          />
        </Animated.View>
      );
    },
    [
      selectionMode,
      selectedItems,
      handleSelectionToggle,
      handleLongPress,
      handleDeleteTask,
      openSheet,
      taskManager,
      optimisticUpdates,
    ],
  );

  // Shared empty component for both lists
  const EmptyComponent = useCallback(
    () => (
      <Animated.Text entering={FadeIn.delay(300)} style={styles.emptyText}>
        No tasks yet. Add a task to get started!
      </Animated.Text>
    ),
    [styles.emptyText],
  );

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      {!selectionMode && (
        <View style={styles.segmentContainer}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={handleViewModeChange}
            buttons={[
              { value: 'Priority', label: 'Priority', icon: 'flag-outline' },
              { value: 'DueDate', label: 'Due Date', icon: 'calendar-clock' },
            ]}
          />
        </View>
      )}

      {selectionMode && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.selectionHeader}>
          <Text style={styles.selectionHeaderText} variant="titleLarge">
            {selectedItems.length} selected
          </Text>
          <View style={styles.selectionActions}>
            <AnimatedTouchableOpacity
              entering={FadeIn}
              onPress={cancelSelection}
              style={styles.selectionButton}>
              <Icon source="close" size={24} />
            </AnimatedTouchableOpacity>
            <AnimatedTouchableOpacity
              entering={FadeIn}
              onPress={deleteSelectedItems}
              style={[styles.selectionButton, styles.deleteButton]}
              disabled={selectedItems.length === 0}>
              <Icon color={theme.colors.onError} source="trash-can-outline" size={24} />
            </AnimatedTouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Priority view list */}
      <Animated.View style={[styles.listContainer, priorityAnimatedStyle]}>
        <FlatList
          data={priorityData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          extraData={[selectionMode, selectedItems]}
          // Performance optimizations
          initialNumToRender={10} // Reduce initial render amount
          maxToRenderPerBatch={10} // Reduce number in each render batch
          updateCellsBatchingPeriod={50} // Increase time between batches
          windowSize={21} // Reduce the window size (visible items = approx. 10)
          // Only re-render items that change
          getItemLayout={(data, index) => ({
            length:
              data[index].type === ITEM_TYPES.SECTION_HEADER ? SECTION_HEADER_HEIGHT : ITEM_HEIGHT,
            offset: calculateOffset(data, index),
            index,
          })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyComponent}
        />
      </Animated.View>

      {/* Due date view list */}
      <Animated.View style={[styles.listContainer, dueDateAnimatedStyle]}>
        <FlatList
          data={dueDateData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          extraData={[selectionMode, selectedItems]}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          getItemLayout={(data, index) => ({
            length:
              data[index].type === ITEM_TYPES.SECTION_HEADER ? SECTION_HEADER_HEIGHT : ITEM_HEIGHT,
            offset: calculateOffset(data, index),
            index,
          })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyComponent}
          ListHeaderComponent={
            dueDateData.length > 0 ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.priorityHeader}>
                <Text variant="headlineSmall">All Tasks</Text>
              </Animated.View>
            ) : null
          }
        />
      </Animated.View>

      {/* Consolidated single snackbar */}
      <Snackbar
        visible={snackbarState.visible}
        wrapperStyle={styles.snackbar}
        onDismiss={handleSnackbarDismiss} // Use the dismissal handler
        duration={5000}
        action={snackbarState.action}>
        {snackbarState.message}
      </Snackbar>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    listContainer: {
      flex: 1,
    },
    segmentContainer: {
      marginBottom: 10,
    },
    errorMessage: {
      color: 'red',
      padding: 10,
      marginBottom: 10,
    },
    snackbar: {
      alignSelf: 'center',
      width: '90%',
    },
    selectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    selectionHeaderText: {
      color: theme.colors.primary,
    },

    selectionActions: {
      flexDirection: 'row',
    },
    selectionButton: {
      padding: 8,
      marginLeft: 8,
      borderRadius: 20,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
      color: '#757575',
    },
    priorityHeader: {
      paddingVertical: 8,
      marginTop: 8,
      marginBottom: 4,
    },
  });
