import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import { useTaskStore } from '../../store/taskStore';
import { Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

// Custom hooks
import useTaskAnimations from './hooks/useTaskAnimations';
import useTaskActions from './hooks/useTaskActions';

// Components
import TaskModal from '../../components/TaskModal';
import TaskItem from './components/TaskItem';
import TaskHiddenActions from './components/TaskHiddenActions';
import TaskSectionHeader from './components/TaskSectionHeader';
import TaskFAB from './components/TaskFAB';

export default function TasksScreen() {
  const { tasks, loadTasks, addTask, editTask, toggleCompleteTask, deleteTask } = useTaskStore();
  const [tasksLoaded, setTasksLoaded] = useState(false);

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

  const sections = [
    { title: 'High Priority', data: tasks.high },
    { title: 'Medium Priority', data: tasks.medium },
    { title: 'Low Priority', data: tasks.low },
  ];

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      <SwipeListView
        useSectionList
        useAnimatedList={true}
        style={{ flex: 1, opacity: listOpacity }}
        sections={sections}
        keyExtractor={(item) => item.id}
        // Combine hidden & visible content in each row:
        renderItem={({ item }) => (
          <SwipeRow
            closeOnRowPress={true}
            onRowPress={() => {
              toggleCompleteTask(item.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            leftOpenValue={75}
            rightOpenValue={-75}
            swipeRowStyle={styles.swipeRowStyle}>
            {/* Hidden actions */}
            <TaskHiddenActions
              item={item}
              animVal={initializeAnimations(item.id)}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
            />
            {/* Visible content */}
            <TaskItem item={item} animVal={initializeAnimations(item.id)} />
          </SwipeRow>
        )}
        renderSectionHeader={({ section }) => <TaskSectionHeader section={section} />}
        stopLeftSwipe={100}
        stopRightSwipe={-100}
        swipeToOpenPercent={25}
        swipeToClosePercent={10}
        disableLeftSwipe={false}
        disableRightSwipe={false}
        previewRowKey={tasksLoaded ? sections[0]?.data[0]?.id : null}
        previewOpenValue={-75}
        previewOpenDelay={1500}
        previewDuration={1000}
        previewRepeat={false}
        friction={100}
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
  errorMessage: {
    color: 'red',
    padding: 10,
    marginBottom: 10,
  },
  snackbar: {
    alignSelf: 'center',
    width: '90%',
  },
  swipeRowStyle: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Optional: define rowFront if needed (TaskItem already applies its own styles)
});
