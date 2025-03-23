import React from 'react';
import { View, Text } from 'react-native';
import { BaseButton } from 'react-native-gesture-handler';
import TaskItem from './TaskItem/TaskItem';
import styles from '../styles';

const UnscheduledTasksSection = ({
  tasks,
  isTasksExpanded,
  setIsTasksExpanded,
  onStateChange,
  scrollY,
  timelineLayout,
  dragAnimationValues,
  layoutValues,
  validZonesByDuration,
  onTapUnScheduled,
  onDismissTooltip,
  scrollViewRef,
}) => {
  const {
    previewVisible,
    previewPosition,
    previewHeight,
    isDragging,
    isDraggingScheduled,
    isPreviewValid,
    isRemoveHovered,
    isCancelHovered,
    autoScrollActive,
  } = dragAnimationValues;

  const { removeButtonLayout, cancelButtonLayout, timelineViewHeight } = layoutValues;

  return (
    <View style={styles.unscheduledArea}>
      <Text style={styles.sectionTitle}>Tasks</Text>
      <View
        style={
          isTasksExpanded
            ? styles.unscheduledTasksContainerExpanded
            : styles.unscheduledTasksContainer
        }>
        {tasks
          .filter((task) => !task.scheduled)
          .map((task, idx) => {
            const hasValidZones = validZonesByDuration[task.duration]?.length > 0;
            return (
              <TaskItem
                key={task.id}
                task={task}
                index={idx}
                onStateChange={onStateChange}
                scrollY={scrollY}
                timelineLayout={timelineLayout}
                previewVisible={previewVisible}
                previewPosition={previewPosition}
                previewHeight={previewHeight}
                isDragging={isDragging}
                isDraggingScheduled={isDraggingScheduled}
                removeButtonLayout={removeButtonLayout}
                cancelButtonLayout={cancelButtonLayout}
                isRemoveHovered={isRemoveHovered}
                isCancelHovered={isCancelHovered}
                autoScrollActive={autoScrollActive}
                scrollViewRef={scrollViewRef}
                timelineViewHeight={timelineViewHeight}
                validZones={validZonesByDuration[task.duration]}
                isPreviewValid={isPreviewValid}
                isSchedulable={hasValidZones}
                onTapUnScheduled={onTapUnScheduled}
                onDismissTooltip={onDismissTooltip}
              />
            );
          })}
      </View>
      <BaseButton
        style={styles.expandButton}
        onPress={() => {
          setIsTasksExpanded(!isTasksExpanded);
          onDismissTooltip();
        }}>
        <Text style={styles.expandButtonText}>{isTasksExpanded ? '∧' : '∨'}</Text>
      </BaseButton>
    </View>
  );
};

export default React.memo(UnscheduledTasksSection);
