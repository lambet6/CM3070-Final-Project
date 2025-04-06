import { StyleSheet } from 'react-native';
import { CONSTANTS } from './CalendarConstants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  calendar: {
    padding: 3,
    overflow: 'hidden',
  },
  loadingIndicator: {
    flexDirection: 'row',
    padding: 5,
  },
  loadingIndicatorText: {
    paddingHorizontal: 8,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  weekDaysRow: {
    marginBottom: 8,
  },
  daysContainer: {
    overflow: 'hidden',
  },
  animatedContainer: {
    width: '100%',
  },
  weekRow: {
    marginBottom: 4,
  },
  toggleButton: {
    alignSelf: 'center',
    width: 200,
    height: 30,
  },
  toggleButtonText: {
    color: CONSTANTS.COLORS.white,
    fontSize: 50,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 4,
  },
  eventLine: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  TaskDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
    borderWidth: 1,
  },
  dotContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 2,
  },
  dragList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
