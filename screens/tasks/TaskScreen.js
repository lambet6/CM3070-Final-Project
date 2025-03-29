import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { useTaskStore } from '../../store/taskStore';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useBottomSheet } from '../../contexts/BottomSheetContext';

// Custom hooks
import useTaskActions from './hooks/useTaskActions';
import useSelectionMode from './hooks/useSelectionMode';

// Components
import SwipeableTaskItem from './components/SwipeableTaskItem';

export default function TasksScreen() {
  // Get state from store
  const tasks = useTaskStore((state) => state.tasks);
  const error = useTaskStore((state) => state.error);
  const getConsolidatedTasks = useTaskStore((state) => state.getConsolidatedTasks);

  // Get methods from manager
  const taskManager = useTaskManager();

  const [viewMode, setViewMode] = useState(0); // 0 for grouped, 1 for consolidated

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

  useEffect(() => {
    const rescheduleTasks = async () => {
      try {
        // Then handle any overdue tasks
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

  const sections = useMemo(() => {
    if (viewMode === 0) {
      return [
        { title: 'High Priority', data: tasks.high },
        { title: 'Medium Priority', data: tasks.medium },
        { title: 'Low Priority', data: tasks.low },
      ];
    } else {
      return [{ title: 'All Tasks', data: getConsolidatedTasks() }];
    }
  }, [viewMode, tasks, getConsolidatedTasks]);

  // Render a task item
  const renderItem = ({ item }) => (
    <SwipeableTaskItem
      task={item}
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
          taskManager.toggleTaskCompletion(item.id);
        }
      }}
      onLongPress={() => {
        if (!selectionMode) {
          // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleLongPress(item.id);
        }
      }}
      selected={selectedItems.includes(item.id)}
      selectionMode={selectionMode}
    />
  );

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      <View style={styles.segmentContainer}>
        <SegmentedControl
          values={['Priority Groups', 'Due Date']}
          selectedIndex={viewMode}
          onChange={(event) => {
            setViewMode(event.nativeEvent.selectedSegmentIndex);
          }}
        />
      </View>

      {selectionMode && (
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionText}>{selectedItems.length} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={cancelSelection} style={styles.selectionButton}>
              <MaterialIcons name="close" size={24} color="#777" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={deleteSelectedItems}
              style={[styles.selectionButton, styles.deleteButton]}
              disabled={selectedItems.length === 0}>
              <MaterialIcons name="delete" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.priorityHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        windowSize={11}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={100}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet. Add a task to get started!</Text>
        }
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    borderBottomColor: '#ddd',
  },
  selectionText: {
    fontSize: 18,
    fontWeight: '600',
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
    backgroundColor: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#757575',
  },
  priorityHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
});
