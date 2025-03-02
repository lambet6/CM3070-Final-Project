import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useTaskStore } from '../../store/taskStore';
import { Snackbar, Button } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

// Custom hooks
import useTaskAnimations from './hooks/useTaskAnimations';
import useTaskActions from './hooks/useTaskActions';

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
  } = useTaskStore();
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const [viewMode, setViewMode] = useState(0); // 0 for grouped, 1 for consolidated

  // Reference to the swipe list to programmatically close rows
  const listRef = React.useRef();
  const [openRowKey, setOpenRowKey] = useState(null);

  // Custom hooks
  const { listOpacity, initializeAnimations } = useTaskAnimations(tasks, tasksLoaded, loadTasks);

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
    snackbarVisible,
    setSnackbarVisible,
    snackbarMessage,
    handleSaveTask,
    handleDeleteTask,
    handleUndoDelete,
    openAddModal,
    openEditModal,
    handleDeleteMultipleTasks,
  } = useTaskActions(tasks, addTask, editTask, deleteTasks);

  useEffect(() => {
    setTasksLoaded(true);
  }, []);

  const handleLongPress = (taskId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedTasks([taskId]);
  };

  const handleTaskPress = (taskId) => {
    // In selection mode, toggle task selection
    if (selectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTasks((prev) => {
        if (prev.includes(taskId)) {
          return prev.filter((id) => id !== taskId);
        } else {
          return [...prev, taskId];
        }
      });
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

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedTasks([]);
  };

  const deleteSelectedTasks = () => {
    if (selectedTasks.length > 0) {
      handleDeleteMultipleTasks(selectedTasks);
      setSelectionMode(false);
      setSelectedTasks([]);
    }
  };

  // Prepare data for the different view modes
  const sections = [
    { title: 'High Priority', data: tasks.high },
    { title: 'Medium Priority', data: tasks.medium },
    { title: 'Low Priority', data: tasks.low },
  ];

  // Create a consolidated list for the single view
  const consolidatedTasks = getConsolidatedTasks();

  // When view mode changes, close any open rows
  useEffect(() => {
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
          <Text style={styles.selectionText}>{selectedTasks.length} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={cancelSelection} style={styles.selectionButton}>
              <MaterialIcons name="close" size={24} color="#777" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={deleteSelectedTasks}
              style={[styles.selectionButton, styles.deleteButton]}
              disabled={selectedTasks.length === 0}>
              <MaterialIcons name="delete" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {viewMode === 0 ? (
        <SwipeListView
          ref={listRef}
          useSectionList
          useAnimatedList={true}
          windowSize={11} // 5 screens before, current screen, 5 screens after
          maxToRenderPerBatch={15} // Slightly higher for smoother swipe interactions
          updateCellsBatchingPeriod={100} // Longer period for more stable updateses
          style={{ flex: 1, opacity: listOpacity }}
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
              animVal={initializeAnimations(item.id)}
              onToggleComplete={() => handleTaskPress(item.id)}
              onLongPress={() => handleLongPress(item.id)}
              selected={selectedTasks.includes(item.id)}
              selectionMode={selectionMode}
            />
          )}
          renderHiddenItem={({ item }) => (
            <TaskHiddenActions
              item={item}
              animVal={initializeAnimations(item.id)}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
            />
          )}
          rightOpenValue={-150}
          renderSectionHeader={({ section }) => <TaskSectionHeader section={section} />}
          disableRightSwipe={true}
        />
      ) : (
        <SwipeListView
          ref={listRef}
          useAnimatedList={true}
          style={{ flex: 1, opacity: listOpacity }}
          data={consolidatedTasks}
          windowSize={11} // 5 screens before, current screen, 5 screens after
          maxToRenderPerBatch={15} // Slightly higher for smoother swipe interactions
          updateCellsBatchingPeriod={100} // Longer period for more stable updates
          keyExtractor={(item) => item.id}
          // Preview settings for the consolidated list
          onRowOpen={(rowKey) => {
            setOpenRowKey(rowKey);
          }}
          onRowClose={() => {
            setOpenRowKey(null);
          }}
          renderItem={({ item }) => (
            <TaskItem
              item={item}
              animVal={initializeAnimations(item.id)}
              onToggleComplete={() => handleTaskPress(item.id)}
              onLongPress={() => handleLongPress(item.id)}
              selected={selectedTasks.includes(item.id)}
              selectionMode={selectionMode}
            />
          )}
          renderHiddenItem={({ item }) => (
            <TaskHiddenActions
              item={item}
              animVal={initializeAnimations(item.id)}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
            />
          )}
          rightOpenValue={-150}
          disableRightSwipe={true}
        />
      )}

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

      <Snackbar
        visible={snackbarVisible}
        wrapperStyle={styles.snackbar}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        action={{
          label: 'Undo',
          onPress: handleUndoDelete,
        }}>
        {snackbarMessage}
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
  rowFront: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
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
