import React, { useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, Text, Icon } from 'react-native-paper';

const createPriorityColors = (theme) => ({
  High: theme.colors.red,
  Medium: theme.colors.yellow,
  Low: theme.colors.green,
});

const dateCache = new Map();

const formatDate = (dateString) => {
  if (dateCache.has(dateString)) {
    return dateCache.get(dateString);
  }

  const date = new Date(dateString);
  const formatted = date.toLocaleDateString();
  dateCache.set(dateString, formatted);
  return formatted;
};

// Create style factory for theme-dependent styles
const createStyles = (theme) =>
  StyleSheet.create({
    swipeable: {
      flex: 1,
      marginBottom: 8,
      borderRadius: 15,
      backgroundColor: theme.colors.secondaryContainer,
      justifyContent: 'center',
      height: 64,
      overflow: 'hidden',
    },
    taskItemContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    taskContent: {
      flex: 1,
      paddingHorizontal: 16,
    },
    taskTitle: {
      color: theme.colors.onSecondaryContainer,
    },
    completedTask: {
      textDecorationLine: 'line-through',
      color: '#888888',
    },
    taskDueDate: {
      color: theme.colors.outline,
      marginTop: 3,
    },
    rightButtonContainer: {
      flexDirection: 'row',
    },
    editButton: {
      backgroundColor: theme.colors.primary,
      width: 75,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButton: {
      width: 75,
      backgroundColor: theme.colors.error,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backTextWhite: {
      color: '#FFF',
      fontWeight: 'bold',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginLeft: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: theme.colors.primary,
    },
    checkmark: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    priorityIndicator: {
      width: 10,
      margin: 0,
      padding: 0,
      height: 40,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

// Optimized RightAction component with proper memoization
const RightAction = React.memo(({ prog, drag, onEdit, onDelete, swipeableRef }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Optimize animation worklet with empty dependency array
  const styleAnimation = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: drag.value + 150 }],
    };
  }, []);

  // Use callbacks for event handlers to reduce closures
  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  }, [onDelete]);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeableRef.current?.close();
    onEdit();
  }, [onEdit, swipeableRef]);

  // Memoize gesture objects to prevent recreating them on render
  const tapDelete = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          runOnJS(handleDelete)();
        }),
    [handleDelete],
  );

  const tapEdit = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          runOnJS(handleEdit)();
        }),
    [handleEdit],
  );

  return (
    <Reanimated.View style={[styleAnimation, styles.rightButtonContainer]}>
      <GestureDetector gesture={tapEdit}>
        <View style={styles.editButton}>
          <Icon size={22} source="pencil" color={theme.colors.onPrimary} />
        </View>
      </GestureDetector>
      <GestureDetector gesture={tapDelete}>
        <View style={styles.deleteButton}>
          <Icon size={22} source="trash-can-outline" color={theme.colors.onError} />
        </View>
      </GestureDetector>
    </Reanimated.View>
  );
});
RightAction.displayName = 'RightAction';

const SwipeableTaskItem = ({
  task,
  onEdit,
  onDelete,
  onTap,
  onLongPress,
  selected = false,
  selectionMode = false,
}) => {
  const swipeableRef = useRef(null);
  const theme = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);
  const PRIORITY_COLORS = useMemo(() => createPriorityColors(theme), [theme]);

  // Callbacks for event handlers
  const handleTap = useCallback(() => {
    onTap(task);
  }, [onTap, task]);

  const handleLongPress = useCallback(() => {
    onLongPress(task);
  }, [onLongPress, task]);

  // Memoize gesture objects
  const tap = useMemo(() => Gesture.Tap().runOnJS(true).onStart(handleTap), [handleTap]);

  const longPress = useMemo(
    () => Gesture.LongPress().runOnJS(true).onStart(handleLongPress),
    [handleLongPress],
  );

  // Combine gestures only when dependencies change
  const taskGestures = useMemo(() => Gesture.Exclusive(longPress, tap), [longPress, tap]);

  // Memoize derived values
  const priorityColor = useMemo(
    () => (selected ? '#e6f2ff' : PRIORITY_COLORS[task.priority]),
    [PRIORITY_COLORS, selected, task.priority],
  );

  const formattedDate = useMemo(() => formatDate(task.dueDate), [task.dueDate]);

  // Memoize checkbox rendering
  const checkboxElement = useMemo(() => {
    if (!selectionMode) return null;
    return (
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && (
          <Icon
            size={14}
            color={theme.colors.onPrimary}
            source="check-bold"
            style={styles.checkmark}
          />
        )}
      </View>
    );
  }, [selectionMode, selected, theme.colors.onPrimary, styles]);

  // Memoize priority indicator rendering
  const priorityIndicator = useMemo(
    () => (
      <View
        style={[
          styles.priorityIndicator,
          {
            backgroundColor: task.completed ? theme.colors.outline : priorityColor,
            height: task.priority === 'Low' ? '30%' : task.priority === 'Medium' ? '60%' : '100%',
          },
        ]}></View>
    ),
    [styles.priorityIndicator, task.completed, task.priority, theme.colors.outline, priorityColor],
  );

  // Memoize task content rendering
  const taskContent = useMemo(
    () => (
      <View style={styles.taskContent}>
        <Text
          variant="titleMedium"
          style={[styles.taskTitle, task.completed && styles.completedTask]}
          numberOfLines={1}>
          {task.title}
        </Text>
        <Text variant="bodySmall" style={styles.taskDueDate}>
          {formattedDate}
        </Text>
      </View>
    ),
    [task.title, task.completed, formattedDate, styles],
  );

  // Memoize edit/delete callbacks
  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      containerStyle={styles.swipeable}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      childrenContainerStyle={styles.taskItemContainer}
      enabled={!selectionMode}
      renderRightActions={(prog, drag) => (
        <RightAction
          prog={prog}
          drag={drag}
          onEdit={handleEdit}
          onDelete={handleDelete}
          swipeableRef={swipeableRef}
        />
      )}>
      <GestureDetector gesture={taskGestures}>
        <View collapsable={false} style={styles.contentContainer}>
          {priorityIndicator}
          {taskContent}
          {checkboxElement}
        </View>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
};

// Export with memo for optimal re-renders
export default React.memo(SwipeableTaskItem);
