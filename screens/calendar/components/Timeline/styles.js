import { StyleSheet, Dimensions } from 'react-native';
import { HOUR_HEIGHT, QUARTER_HEIGHT, TIMELINE_OFFSET } from './utils/timelineHelpers';
import { TASK_ITEM_HEIGHT } from './utils/timelineHelpers';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  unscheduledArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'rgba(152, 16, 16, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  unscheduledTasksContainer: {
    height: TASK_ITEM_HEIGHT / 1.5,
    flexDirection: 'row',
    flexWrap: 'no wrap',
    gap: 10,
  },
  unscheduledTasksContainerExpanded: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  timelineContainer: {
    flex: 1,
  },
  timelineSideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TIMELINE_OFFSET,
    height: '100%',
    zIndex: 10,
  },
  timelineContent: {
    marginLeft: TIMELINE_OFFSET,
    position: 'relative',
    minHeight: 13 * HOUR_HEIGHT, // HOURS.length * HOUR_HEIGHT
  },
  hourContainer: {
    height: HOUR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hourText: {
    fontSize: 12,
    color: '#333',
  },
  hourLine: {
    position: 'absolute',
    right: 0,
    left: TIMELINE_OFFSET,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  quarterContainer: {
    position: 'absolute',
    left: 0,
    width: TIMELINE_OFFSET,
    height: QUARTER_HEIGHT,
    justifyContent: 'top',
    paddingHorizontal: 10,
  },
  quarterText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
    width: '100%',
    paddingRight: 35,
  },
  quarterLine: {
    position: 'absolute',
    right: 0,
    left: TIMELINE_OFFSET - 20,
    height: 1,
    backgroundColor: '#e8e8e8',
  },
  // Base task item shared styles
  taskItem: {
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  // Text styles
  taskTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  taskDuration: {
    fontSize: 14,
    color: '#555',
  },
  unscheduledTaskTitle: {
    fontWeight: '600',
    fontSize: 12,
  },
  unscheduledTaskDuration: {
    fontSize: 10,
    color: '#555',
  },
  scheduledTaskTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  scheduledTaskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    textAlign: 'center',
  },
  EventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  smallEventDetails: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  scheduledTaskTime: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  scheduledTaskDuration: {
    fontSize: 12,
    color: '#555',
  },
  // Action buttons styles
  actionButton: {
    width: 120,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgb(224, 133, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  expandButton: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
});

export default styles;
