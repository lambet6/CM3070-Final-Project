import { StyleSheet } from 'react-native';
import { CONSTANTS } from './CalendarConstants';

export const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: CONSTANTS.COLORS.background,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarContainer: {
    padding: 3,
    // backgroundColor: 'red',
    overflow: 'hidden',
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
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONSTANTS.COLORS.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONSTANTS.COLORS.primary,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: CONSTANTS.COLORS.buttonBackground,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: CONSTANTS.COLORS.primary,
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
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: CONSTANTS.COLORS.buttonBackground,
    alignSelf: 'center',
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
});
