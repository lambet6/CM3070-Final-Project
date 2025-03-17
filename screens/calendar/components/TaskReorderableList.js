import React, { useState, memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import ReorderableList, {
  ReorderableListReorderEvent,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list';

// Task card component
const TaskCard = memo(({ id, title, priority, date }) => {
  const drag = useReorderableDrag();
  const priorityColors = {
    high: '#FF6B6B',
    medium: '#FFD166',
    low: '#06D6A0',
  };

  return (
    <Pressable
      style={[styles.taskCard, { borderLeftColor: priorityColors[priority] }]}
      onLongPress={drag}>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{title}</Text>
        {date && <Text style={styles.taskDate}>{date}</Text>}
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: priorityColors[priority] }]}>
        <Text style={styles.priorityText}>{priority}</Text>
      </View>
    </Pressable>
  );
});

TaskCard.displayName = 'TaskCard';

// ReorderableTaskList component
const TaskReorderableList = () => {
  // Sample tasks for testing
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Complete project proposal', priority: 'high', date: 'Today' },
    { id: '2', title: 'Review team submissions', priority: 'medium', date: 'Today' },
    { id: '3', title: 'Schedule client meeting', priority: 'high', date: 'Tomorrow' },
    { id: '4', title: 'Update weekly report', priority: 'medium', date: 'Tomorrow' },
    { id: '5', title: 'Research new technologies', priority: 'low', date: 'Mar 20' },
    { id: '6', title: 'Prepare presentation slides', priority: 'high', date: 'Mar 21' },
    { id: '7', title: 'Fix bugs in calendar view', priority: 'medium', date: 'Mar 22' },
    { id: '8', title: 'Review pull requests', priority: 'low', date: 'Mar 23' },
  ]);

  const handleReorder = useCallback(({ from, to }) => {
    setTasks((value) => reorderItems(value, from, to));
    console.log(`Moved task from position ${from} to ${to}`);
  }, []);

  const renderItem = useCallback(({ item }) => <TaskCard {...item} />, []);

  return (
    <View style={styles.container}>
      <Text style={styles.listTitle}>Upcoming Tasks</Text>
      <Text style={styles.listSubtitle}>Long press and drag to reorder</Text>
      <ReorderableList
        data={tasks}
        onReorder={handleReorder}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginHorizontal: 16,
    color: '#333',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
  },
  taskDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TaskReorderableList;
