import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useTaskStore } from '../store/taskStore';
import TaskModal from '../components/TaskModal';
import { Snackbar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

// Create reusable animation styles
const createAnimatedStyles = (animValue, isHidden = false) => {
  // Shared transformations that are the same for visible and hidden items
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.2, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.8, 1.05, 1],
  });

  // Different opacity behavior for visible vs hidden items
  const opacity = animValue.interpolate({
    inputRange: isHidden
      ? [0, 0.9, 1] // Hidden items stay invisible longer
      : [0, 0.6, 1], // Visible items fade in earlier
    outputRange: isHidden
      ? [0, 0, 1] // Hidden items pop in at end
      : [0, 0.7, 1], // Visible items fade in gradually
  });

  return {
    transform: [{ translateY }, { scale }],
    opacity,
    marginBottom: 8,
    ...(isHidden ? { flex: 1 } : {}),
  };
};

const { height } = Dimensions.get('window');

export default function TasksScreen() {
  const { tasks, loadTasks, addTask, editTask, toggleCompleteTask, deleteTask } = useTaskStore();
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [error, setError] = useState(null);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const deletedTaskRef = useRef(null);

  // Animation references for tasks
  const animatedValues = useRef(new Map()).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  // Pre-initialize all items as invisible
  const initializeAnimations = (taskId) => {
    if (!animatedValues.has(taskId)) {
      // Start with completely hidden values
      const animVal = new Animated.Value(0);
      animatedValues.set(taskId, animVal);
      return animVal;
    }
    return animatedValues.get(taskId);
  };

  // Make sure all task items have animation values before render
  useEffect(() => {
    // Pre-initialize all tasks with animation values set to 0 (hidden)
    const allTasks = [...tasks.high, ...tasks.medium, ...tasks.low];
    allTasks.forEach((task) => {
      initializeAnimations(task.id);
    });
  }, [tasks]);

  useEffect(() => {
    const fetchTasks = async () => {
      await loadTasks();
      setTasksLoaded(true);

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
      // Clear out any old animation values - but don't do this here
      // as we've already pre-initialized the values
      // animatedValues.clear();

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
  }, [tasks, tasksLoaded]);

  const handleSaveTask = async () => {
    try {
      setError(null);
      if (editingTaskId) {
        await editTask(editingTaskId, taskTitle, taskPriority, taskDueDate);
      } else {
        await addTask(taskTitle, taskPriority, taskDueDate);
      }
      setModalVisible(false);
      resetTaskForm();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const taskPriority = tasks.high.find((t) => t.id === taskId)
        ? 'High'
        : tasks.medium.find((t) => t.id === taskId)
          ? 'Medium'
          : 'Low';
      const taskObj = tasks[taskPriority.toLowerCase()].find((t) => t.id === taskId);

      if (taskObj) {
        deletedTaskRef.current = {
          ...taskObj,
          priority: taskPriority,
        };
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        await deleteTask(taskId);

        setSnackbarMessage(`"${taskObj.title}" deleted`);
        setSnackbarVisible(true);
      }
    } catch (error) {
      setError(error.message);
      try {
        await deleteTask(taskId);
      } catch (retryError) {
        setError('Failed to delete task. Please try again.');
      }
    }
  };

  const handleUndoDelete = async () => {
    if (deletedTaskRef.current) {
      try {
        const { id, title, dueDate, completed, priority } = deletedTaskRef.current;
        await addTask(title, priority, new Date(dueDate), id, completed);
        deletedTaskRef.current = null;
        setSnackbarVisible(false);
      } catch (error) {
        setError('Failed to restore task. Please try again.');
      }
    }
  };

  const openAddModal = () => {
    resetTaskForm();
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskPriority(task.priority);
    setTaskDueDate(new Date(task.dueDate));
    setModalVisible(true);
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskPriority('Medium');
    setTaskDueDate(new Date());
  };

  const sections = [
    { title: 'High Priority', data: tasks.high },
    { title: 'Medium Priority', data: tasks.medium },
    { title: 'Low Priority', data: tasks.low },
  ];

  const renderTaskItem = ({ item }) => {
    // Get the animated value for this task or create a new one
    let animVal = initializeAnimations(item.id);

    // Use our reusable animation styles function
    const animatedStyles = createAnimatedStyles(animVal, false);

    return (
      <Animated.View style={animatedStyles}>
        <Pressable
          onPress={() => {
            toggleCompleteTask(item.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={[styles.taskItem, item.completed && styles.completedTask]}>
          <View>
            <Text style={[styles.taskText, item.completed && styles.strikethrough]}>
              {item.title} — {new Date(item.dueDate).toDateString()}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderHiddenItem = ({ item }) => {
    // Get the same animated value used for the visible item
    let animVal = initializeAnimations(item.id);

    // Use our reusable animation styles function with isHidden=true
    const animatedStyles = createAnimatedStyles(animVal, true);

    return (
      <Animated.View style={animatedStyles}>
        <View style={styles.rowBack}>
          <TouchableOpacity
            style={[styles.backLeftBtn]}
            onPress={() => {
              openEditModal(item);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}>
            <Text style={styles.backTextWhite}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backRightBtn, styles.backRightBtnRight]}
            onPress={() => handleDeleteTask(item.id)}>
            <Text style={styles.backTextWhite}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <Text style={styles.priorityHeader}>{section.title}</Text>
  );

  return (
    <View testID="tasks-screen" style={styles.container}>
      {error && <Text style={styles.errorMessage}>{error}</Text>}

      <SwipeListView
        useSectionList
        useAnimatedList={true}
        style={{ flex: 1, opacity: listOpacity }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        renderHiddenItem={renderHiddenItem}
        renderSectionHeader={renderSectionHeader}
        leftOpenValue={75}
        rightOpenValue={-75}
        stopLeftSwipe={100}
        stopRightSwipe={-100}
        swipeToOpenPercent={25}
        swipeToClosePercent={10}
        swipeRowStyle={styles.swipeRowStyle}
        closeOnRowPress={true}
        disableLeftSwipe={false}
        disableRightSwipe={false}
        onRowPress={(rowKey, rowMap) => {
          if (rowMap[rowKey]) {
            rowMap[rowKey].closeRow();
          }
          const taskId = rowKey;
          toggleCompleteTask(taskId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        // Just show the right swipe preview (reveals left action)
        previewRowKey={tasksLoaded ? sections[0]?.data[0]?.id : null}
        previewOpenValue={-75} // Negative = swipe right to see left buttons
        previewOpenDelay={1500} // Delay this until after animations complete
        previewDuration={1000}
        previewRepeat={false}
        friction={100}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks yet. Add one to get started!</Text>
          </View>
        }
      />

      <TouchableOpacity testID="fab-add-task" style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  priorityHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: '#eee',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  completedTask: {
    backgroundColor: '#d3d3d3',
  },
  taskText: {
    fontSize: 16,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  rowBack: {
    alignItems: 'stretch',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 13,
    overflow: 'hidden',
    height: 56, // Match the height of the visible task item
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    top: 0,
    width: 76,
    backgroundColor: 'red',
  },
  backLeftBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    top: 0,
    width: 76,
    backgroundColor: '#4CD964',
  },
  backTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  swipeRowStyle: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'blue',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
