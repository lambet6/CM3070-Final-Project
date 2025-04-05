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
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
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
  },
  toggleButtonText: {
    color: CONSTANTS.COLORS.white,
    fontSize: 50,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 4, // Add some padding to ensure spacing
  },
  eventLine: {
    width: 20,
    height: 4,
    borderRadius: 2,
    // backgroundColor: '#ff00ff',
    // marginBottom: 2, // Space between event line and date
  },
  TaskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotContainer: {
    flexDirection: 'row',
    height: 4,
    // justifyContent: 'center',
    // alignItems: 'center',
    gap: 2, // adds small spacing between dots
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
