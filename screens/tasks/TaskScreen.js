import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useTaskStore } from '../../store/taskStore';
import { Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

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
  const { tasks, loadTasks, addTask, editTask, toggleCompleteTask, deleteTask } = useTaskStore();
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Reference to the swipe list to programmatically close rows
  const listRef = React.useRef();

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
  } = useTaskActions(tasks, addTask, editTask, deleteTask);

  useEffect(() => {
    setTasksLoaded(true);
  }, []);

  const handleTaskPress = (taskId) => {
    // First close any open rows
    if (listRef.current) {
      listRef.current.closeAllOpenRows();
    }

    // Then toggle task completion
    toggleCompleteTask(taskId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const sections = [
    { title: 'High Priority', data: tasks.high },
    { title: 'Medium Priority', data: tasks.medium },
    { title: 'Low Priority', data: tasks.low },
  ];

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      <SwipeListView
        ref={listRef}
        useSectionList
        useAnimatedList={true}
        style={{ flex: 1, opacity: listOpacity }}
        sections={sections}
        keyExtractor={(item) => item.id}
        // Preview settings
        previewRowKey={sections[0]?.data[0]?.id}
        previewOpenValue={-150}
        previewOpenDelay={1500}
        previewDuration={1000}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            animVal={initializeAnimations(item.id)}
            onToggleComplete={handleTaskPress}
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

      <TaskFAB onPress={openAddModal} />

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
});
