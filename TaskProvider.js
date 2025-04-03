import { useEffect } from 'react';
import { useTaskManager } from './hooks/useTaskManager';

export function TaskProvider({ children }) {
  const taskManager = useTaskManager();

  useEffect(() => {
    taskManager.loadTasks().catch((error) => console.error('Error initializing tasks:', error));
    taskManager.checkDayChangeAndCleanup();
  }, [taskManager]);

  return children;
}
