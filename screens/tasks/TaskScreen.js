/**
 * TaskScreen
 *
 * Primary task management interface that allows users to view, create, complete,
 * edit, and delete tasks with a low-friction user experience.
 *
 * Features:
 * - Two view modes: Priority (grouped by High/Medium/Low) and Due Date (chronological list)
 * - Quick task completion via tap with optimistic UI updates
 * - Swipe actions for editing and deletion
 * - Multi-select mode for batch deletion
 * - Automatic rescheduling of overdue tasks
 *
 * UX enhancements:
 * - Animations for view transitions and list updates
 * - Haptic feedback for important interactions
 * - Informative snackbar notifications
 * - Error handling with clear user feedback
 */

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
import { calculateOffset, preparePriorityData } from './utils';
import SectionHeader from './components/SectionHeader';

// Custom hooks
import useTaskActions from './hooks/useTaskActions';
import useSelectionMode from './hooks/useSelectionMode';

// Components
import SwipeableTaskItem from './components/SwipeableTaskItem';

// Constants
const ITEM_HEIGHT = 64;
const SECTION_HEADER_HEIGHT = 42;
const ITEM_TYPES = {
  SECTION_HEADER: 'section-header',
  TASK_ITEM: 'task-item',
};

// Create animated components
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function TasksScreen() {
  // State from store
  const tasks = useTaskStore((state) => state.tasks);
  const error = useTaskStore((state) => state.error);
  const getConsolidatedTasks = useTaskStore((state) => state.getConsolidatedTasks);
  const consolidatedTasks = useMemo(() => getConsolidatedTasks(), [tasks]);

  // Task manager
  const taskManager = useTaskManager();

  // Local state
  const [viewMode, setViewMode] = useState('Priority'); // 'Priority' or 'DueDate'
  const [optimisticUpdates, setOptimisticUpdates] = useState({});

  // Animation values
  const priorityOpacity = useSharedValue(1);
  const dueDateOpacity = useSharedValue(0);

  // Theme
  const theme = useTheme();
  const styles = getStyles(theme);

  // Bottom sheet context
  const { openSheet } = useBottomSheet();

  // Custom hooks
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

  /**
   * Handle view mode change with animations
   */
  const handleViewModeChange = useCallback(
    (newMode) => {
      if (newMode !== viewMode) {
        if (newMode === 'Priority') {
          dueDateOpacity.value = 0;
          priorityOpacity.value = 1;
        } else {
          priorityOpacity.value = 0;
          dueDateOpacity.value = 1;
        }

        setViewMode(newMode);
      }
    },
    [viewMode, priorityOpacity, dueDateOpacity],
  );

  /**
   * Reschedule overdue tasks when component mounts
   */
  useEffect(() => {
    const rescheduleTasks = async () => {
      try {
        const { count } = await taskManager.rescheduleOverdueTasks();

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
  }, [setSnackbarState, taskManager]);

  // Prepare data for views
  const prioritySections = useMemo(() => {
    return [
      { title: 'High Priority', data: tasks.high },
      { title: 'Medium Priority', data: tasks.medium },
      { title: 'Low Priority', data: tasks.low },
    ];
  }, [tasks.high, tasks.medium, tasks.low]);

  const priorityData = useMemo(() => preparePriorityData(prioritySections), [prioritySections]);

  const dueDateData = useMemo(
    () =>
      consolidatedTasks.map((task) => ({
        ...task,
        type: ITEM_TYPES.TASK_ITEM,
      })),
    [consolidatedTasks],
  );

  // Animated styles for view transitions
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

  /**
   * Shared empty list component
   */
  const EmptyComponent = useCallback(
    () => (
      <Animated.Text entering={FadeIn.delay(300)} style={styles.emptyText}>
        No tasks yet. Add a task to get started!
      </Animated.Text>
    ),
    [styles.emptyText],
  );

  /**
   * Renders a list item (either section header or task)
   */
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
          <SwipeableTaskItem
            task={displayTask}
            onEdit={() => {
              openSheet(item);
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

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarState.visible}
        wrapperStyle={styles.snackbar}
        onDismiss={handleSnackbarDismiss}
        duration={5000}
        action={snackbarState.action}>
        {snackbarState.message}
      </Snackbar>
    </View>
  );
}

/**
 * Component styles with theme support
 */
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
