import React, { useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, Text, Icon } from 'react-native-paper';

// Memoized RightAction component to prevent unnecessary recreations
const RightAction = React.memo(({ prog, drag, onEdit, onDelete, swipeableRef }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  // Create animated style using worklet for better performance
  const styleAnimation = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: drag.value + 150 }],
    };
  });

  // Memoize gestures to avoid recreating them on each render
  const tapDelete = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }),
    [onDelete],
  );

  const tapEdit = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          swipeableRef.current?.close();
          onEdit();
        }),
    [onEdit, swipeableRef],
  );

  return (
    <Reanimated.View style={[styleAnimation, styles.rightButtonContainer]}>
      <GestureDetector gesture={tapEdit}>
        <View style={styles.editButton}>
          <Icon size={22} source="pencil" color={theme.colors.onTertiary} />
          {/* <Text style={styles.backTextWhite}>Edit</Text> */}
        </View>
      </GestureDetector>
      <GestureDetector gesture={tapDelete}>
        <View style={styles.deleteButton}>
          <Icon size={22} source="trash-can-outline" color={theme.colors.onError} />
          {/* <Text style={styles.backTextWhite}>Delete</Text> */}
        </View>
      </GestureDetector>
    </Reanimated.View>
  );
});
RightAction.displayName = 'RightAction';

// Format date function moved outside component to avoid recreation
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Mapping priority to colors
const PRIORITY_COLORS = {
  High: '#FF5252', // Red for high priority
  Medium: '#FFD740', // Yellow for medium priority
  Low: '#4CAF50', // Green for low priority
};
const PRIORITY_ICONS = {
  High: 'alert-circle',
  Medium: 'alert-rhombus',
  Low: 'alert-circle-outline',
};

// Get dots based on priority
const getPriorityDots = (priority) => {
  switch (priority) {
    case 'High':
      return [1, 2, 3];
    case 'Medium':
      return [1, 2];
    case 'Low':
    default:
      return [1];
  }
};

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
  const styles = getStyles(theme);

  // Memoize gestures to prevent recreation on each render
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onStart(() => {
          onTap(task);
        }),
    [onTap, task],
  );

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .runOnJS(true)
        .onStart(() => {
          onLongPress(task);
        }),
    [onLongPress, task],
  );

  const taskGestures = useMemo(() => Gesture.Exclusive(longPress, tap), [longPress, tap]);

  // Get background color based on priority and selection state
  const getBackgroundColor = useCallback(() => {
    if (selected) return '#e6f2ff'; // Light blue when selected
    return PRIORITY_COLORS[task.priority] || '#f5f5f5';
  }, [selected, task.priority]);

  // Pre-compute values used in the render
  const backgroundColor = getBackgroundColor();
  const formattedDate = formatDate(task.dueDate);
  const priorityDots = getPriorityDots(task.priority);

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
          onEdit={onEdit}
          onDelete={onDelete}
          swipeableRef={swipeableRef}
        />
      )}>
      <GestureDetector gesture={taskGestures}>
        <View collapsable={false} style={styles.contentContainer}>
          <View style={[styles.priorityIndicator, { backgroundColor }]}>
            {priorityDots.map((dot, index) => (
              <Icon
                key={index}
                style={styles.priorityDot}
                source="circle-medium"
                size={12}
                color={'white'}
              />
            ))}
          </View>
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

          {selectionMode && (
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          )}
        </View>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
};
const getStyles = (theme) =>
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
      backgroundColor: theme.colors.tertiary,
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
      borderColor: '#007AFF',
      marginLeft: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: '#007AFF',
    },
    checkmark: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
    priorityIndicator: {
      width: 16,
      margin: 0,
      padding: 0,
      height: 40,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    priorityDot: {
      // margin: -4,
      padding: 0,
    },
  });

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SwipeableTaskItem);
