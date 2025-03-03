import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { useTaskStore } from '../../store/taskStore';
import { Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

// Custom hooks
import useTaskActions from './hooks/useTaskActions';
import useSelectionMode from './hooks/useSelectionMode';

// Components
import TaskModal from '../../components/TaskModal';
import TaskSectionHeader from './components/TaskSectionHeader';
import TaskFAB from './components/TaskFAB';
import SwipeableTaskItem from './components/SwipeableTaskItem';

export default function TasksScreen() {
  const {
    tasks,
    loadTasks,
    addTask,
    editTask,
    toggleCompleteTask,
    deleteTasks,
    getConsolidatedTasks,
    rescheduleOverdueTasks,
  } = useTaskStore();

  const [viewMode, setViewMode] = useState(0); // 0 for grouped, 1 for consolidated

  const {
    isModalVisible,
    setModalVisible,
    taskTitle,
    setTaskTitle,
    taskPriority,
    setTaskPriority,
    taskDueDate,
    setTaskDueDate,
    error,
    snackbarState,
    setSnackbarState,
    handleSaveTask,
    handleDeleteTask,
    openAddModal,
    openEditModal,
    handleDeleteMultipleTasks,
  } = useTaskActions(tasks, addTask, editTask, deleteTasks);

  const {
    selectionMode,
    selectedItems,
    handleLongPress,
    handleSelectionToggle,
    cancelSelection,
    deleteSelectedItems,
  } = useSelectionMode(handleDeleteMultipleTasks);

  useEffect(() => {
    const initializeTasks = async () => {
      try {
        // Load all tasks first
        await loadTasks();

        // Then handle any overdue tasks
        const { count } = await rescheduleOverdueTasks();

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
        console.error('Failed to initialize tasks:', error);
      }
    };

    initializeTasks();
  }, []); // Run once on component mount

  // Get the right sections based on viewMode
  const getSections = () => {
    if (viewMode === 0) {
      // Grouped by priority
      return [
        { title: 'High Priority', data: tasks.high },
        { title: 'Medium Priority', data: tasks.medium },
        { title: 'Low Priority', data: tasks.low },
      ];
    } else {
      // Consolidated list with a single section
      return [{ title: 'All Tasks', data: getConsolidatedTasks() }];
    }
  };

  // Render a task item
  const renderItem = ({ item }) => (
    <SwipeableTaskItem
      task={item}
      onEdit={() => openEditModal(item)}
      onDelete={() => handleDeleteTask(item.id)}
      onTap={() => {
        if (selectionMode) {
          handleSelectionToggle(item.id);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleCompleteTask(item.id);
        }
      }}
      onLongPress={() => {
        if (!selectionMode) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        sections={getSections()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <TaskSectionHeader section={section} />}
        stickySectionHeadersEnabled={false}
        windowSize={11}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={100}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet. Add a task to get started!</Text>
        }
      />

      {!selectionMode && <TaskFAB onPress={openAddModal} />}

      <TaskModal
        visible={isModalVisible}
        onSave={handleSaveTask}
        onClose={() => setModalVisible(false)}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskDueDate={taskDueDate}
        setTaskDueDate={setTaskDueDate}
      />

      {/* Consolidated single snackbar */}
      <Snackbar
        visible={snackbarState.visible}
        wrapperStyle={styles.snackbar}
        onDismiss={() => setSnackbarState((prev) => ({ ...prev, visible: false }))}
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
});
