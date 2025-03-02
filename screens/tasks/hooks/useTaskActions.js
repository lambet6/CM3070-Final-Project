import { useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';

export default function useTaskActions(tasks, addTask, editTask, deleteTasks) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [error, setError] = useState(null);

  // Replace individual snackbar states with a unified state object
  const [snackbarState, setSnackbarState] = useState({
    visible: false,
    message: '',
    action: null,
  });

  const deletedTasksRef = useRef([]);

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
        deletedTasksRef.current = [
          {
            ...taskObj,
            priority: taskPriority,
          },
        ];
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        await deleteTasks([taskId]);

        // Use the unified snackbar state
        setSnackbarState({
          visible: true,
          message: `"${taskObj.title}" deleted`,
          action: {
            label: 'Undo',
            onPress: handleUndoDelete,
          },
        });
      }
    } catch (error) {
      setError(error.message);
      try {
        await deleteTasks([taskId]);
      } catch (retryError) {
        setError('Failed to delete task. Please try again.');
      }
    }
  };

  const handleDeleteMultipleTasks = async (taskIds) => {
    try {
      if (taskIds.length === 1) {
        return handleDeleteTask(taskIds[0]);
      }

      const tasksToDelete = [];

      taskIds.forEach((id) => {
        let taskObj = null;
        let taskPriority = null;

        if (tasks.high.some((t) => t.id === id)) {
          taskObj = tasks.high.find((t) => t.id === id);
          taskPriority = 'High';
        } else if (tasks.medium.some((t) => t.id === id)) {
          taskObj = tasks.medium.find((t) => t.id === id);
          taskPriority = 'Medium';
        } else if (tasks.low.some((t) => t.id === id)) {
          taskObj = tasks.low.find((t) => t.id === id);
          taskPriority = 'Low';
        }

        if (taskObj) {
          tasksToDelete.push({
            ...taskObj,
            priority: taskPriority,
          });
        }
      });

      deletedTasksRef.current = tasksToDelete;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteTasks(taskIds);

      // Use the unified snackbar state
      setSnackbarState({
        visible: true,
        message: `${taskIds.length} tasks deleted`,
        action: {
          label: 'Undo',
          onPress: handleUndoDelete,
        },
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUndoDelete = async () => {
    if (deletedTasksRef.current.length > 0) {
      try {
        for (const task of deletedTasksRef.current) {
          const { title, dueDate, priority } = task;
          await addTask(title, priority, new Date(dueDate));
        }

        deletedTasksRef.current = [];
        setSnackbarState((prev) => ({ ...prev, visible: false }));
      } catch (error) {
        setError('Failed to restore task(s). Please try again.');
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

  return {
    isModalVisible,
    setModalVisible,
    taskTitle,
    setTaskTitle,
    taskPriority,
    setTaskPriority,
    taskDueDate,
    setTaskDueDate,
    editingTaskId,
    error,
    snackbarState,
    setSnackbarState,
    handleSaveTask,
    handleDeleteTask,
    handleDeleteMultipleTasks,
    handleUndoDelete,
    openAddModal,
    openEditModal,
  };
}
