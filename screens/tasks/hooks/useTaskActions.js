import { useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';

export default function useTaskActions(tasks, addTask, editTask, deleteTask) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [error, setError] = useState(null);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const deletedTaskRef = useRef(null);

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
    snackbarVisible,
    setSnackbarVisible,
    snackbarMessage,
    handleSaveTask,
    handleDeleteTask,
    handleUndoDelete,
    openAddModal,
    openEditModal,
  };
}
