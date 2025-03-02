import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
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
import TaskHiddenActions from './components/TaskHiddenActions';
import TaskSectionHeader from './components/TaskSectionHeader';
import TaskFAB from './components/TaskFAB';
import TaskItem from './components/TaskItem';

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

  // Removed unused tasksLoaded state
  const [viewMode, setViewMode] = useState(0); // 0 for grouped, 1 for consolidated

  // Reference to the swipe list to programmatically close rows
  const listRef = React.useRef();
  const [openRowKey, setOpenRowKey] = useState(null);

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

  const handleTaskPress = (taskId) => {
    // In selection mode, toggle task selection
    if (selectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleSelectionToggle(taskId);
      return;
    }

    // If rows are open, just close them without toggling completion
    if (openRowKey !== null) {
      if (listRef.current) {
        listRef.current.closeAllOpenRows();
      }
      return;
    }

    // Normal mode - toggle task completion (only when no rows are open)
    toggleCompleteTask(taskId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Prepare data for the different view modes
  const sections = [
    { title: 'High Priority', data: tasks.high },
    { title: 'Medium Priority', data: tasks.medium },
    { title: 'Low Priority', data: tasks.low },
  ];

  // Create a consolidated list for the single view
  const consolidatedTasks = getConsolidatedTasks();

  useEffect(() => {
    // Close any open rows when switching views
    if (listRef.current) {
      listRef.current.closeAllOpenRows();
    }
  }, [viewMode]);

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      <View style={styles.segmentContainer}>
        <SegmentedControl
          values={['Priority Groups', 'Due Date']}
          selectedIndex={viewMode}
          onChange={(event) => {
            setViewMode(event.nativeEvent.selectedSegmentIndex);
            // Close any open rows when switching views
            if (listRef.current) {
              listRef.current.closeAllOpenRows();
            }
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

      {viewMode === 0 ? (
        <SwipeListView
          ref={listRef}
          useSectionList
          windowSize={11}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={100}
          style={{ flex: 1 }}
          sections={sections}
          keyExtractor={(item) => item.id}
          // Preview settings
          previewRowKey={sections[0]?.data[0]?.id}
          previewOpenValue={-150}
          previewOpenDelay={1500}
          previewDuration={1000}
          onRowOpen={(rowKey) => {
            setOpenRowKey(rowKey);
          }}
          onRowClose={() => {
            setOpenRowKey(null);
          }}
          renderItem={({ item }) => (
            <TaskItem
              item={item}
              onToggleComplete={() => handleTaskPress(item.id)}
              onLongPress={() => handleLongPress(item.id)}
              selected={selectedItems.includes(item.id)}
              selectionMode={selectionMode}
            />
          )}
          renderHiddenItem={({ item }) => (
            <TaskHiddenActions item={item} onEdit={openEditModal} onDelete={handleDeleteTask} />
          )}
          rightOpenValue={-150}
          renderSectionHeader={({ section }) => <TaskSectionHeader section={section} />}
          disableRightSwipe={true}
        />
      ) : (
        <SwipeListView
          ref={listRef}
          style={{ flex: 1 }}
          data={consolidatedTasks}
          windowSize={11}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={100}
          keyExtractor={(item) => item.id}
          onRowOpen={(rowKey) => {
            setOpenRowKey(rowKey);
          }}
          onRowClose={() => {
            setOpenRowKey(null);
          }}
          renderItem={({ item }) => (
            <TaskItem
              item={item}
              onToggleComplete={() => handleTaskPress(item.id)}
              onLongPress={() => handleLongPress(item.id)}
              selected={selectedItems.includes(item.id)}
              selectionMode={selectionMode}
            />
          )}
          renderHiddenItem={({ item }) => (
            <TaskHiddenActions item={item} onEdit={openEditModal} onDelete={handleDeleteTask} />
          )}
          rightOpenValue={-150}
          disableRightSwipe={true}
        />
      )}

      {!selectionMode && <TaskFAB onPress={openAddModal} />}

      <TaskModal
        visible={isModalVisible}
        onSave={() => {
          handleSaveTask();
          // Close any open swipe rows before saving
          if (listRef.current) {
            listRef.current.closeAllOpenRows();
          }
        }}
        onClose={() => {
          setModalVisible(false);
          if (listRef.current) {
            listRef.current.closeAllOpenRows();
          }
        }}
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
});
