import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import TaskItem from './TaskItem/TaskItem';
import EventItem from './EventItem';
import { TimelineIndicator, GhostSquare } from './TimelineIndicator';
import HourMarkers from './HourMarkers';
import styles from './styles';

const TimelineContent = ({
  scrollViewRef,
  timelineLayoutRef,
  handleTimelineLayout,
  tasks,
  events,
  eventLayoutMap,
  dragAnimationValues,
  layoutValues,
  onStateChange,
  scrollY,
  validZonesByDuration,
  onTapUnScheduled,
  onDismissTooltip,
}) => {
  const {
    previewVisible,
    previewPosition,
    previewHeight,
    ghostVisible,
    ghostPosition,
    ghostHeight,
    isDragging,
    isDraggingScheduled,
    isPreviewValid,
    isRemoveHovered,
    isCancelHovered,
    autoScrollActive,
  } = dragAnimationValues;

  const { timelineLayout, removeButtonLayout, cancelButtonLayout, timelineViewHeight } =
    layoutValues;

  const scheduledTasks = tasks.filter((task) => task.scheduled);

  return (
    <Animated.View
      ref={timelineLayoutRef}
      style={styles.timelineContainer}
      onLayout={handleTimelineLayout}>
      <Animated.ScrollView ref={scrollViewRef} scrollEventThrottle={16}>
        <View style={styles.timelineSideBar}>
          <HourMarkers />
        </View>
        <View style={styles.timelineContent}>
          {/* Fixed events - render before tasks so they appear behind tasks */}
          {events.map((event) => (
            <EventItem key={event.id} event={event} layout={eventLayoutMap.get(event.id)} />
          ))}

          {/* Preview component*/}
          <TimelineIndicator
            visible={previewVisible}
            position={previewPosition}
            height={previewHeight}
            isValid={isPreviewValid}
            style={{
              borderRadius: 8,
              borderWidth: 2,
            }}
          />

          {/* Ghost square component */}
          <GhostSquare visible={ghostVisible} position={ghostPosition} height={ghostHeight} />

          {scheduledTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
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
              ghostVisible={ghostVisible}
              ghostPosition={ghostPosition}
              ghostHeight={ghostHeight}
              isRemoveHovered={isRemoveHovered}
              isCancelHovered={isCancelHovered}
              autoScrollActive={autoScrollActive}
              scrollViewRef={scrollViewRef}
              timelineViewHeight={timelineViewHeight}
              validZones={validZonesByDuration[task.duration]}
              isPreviewValid={isPreviewValid}
              onTapUnScheduled={onTapUnScheduled}
              onDismissTooltip={onDismissTooltip}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </Animated.View>
  );
};

export default React.memo(TimelineContent);
