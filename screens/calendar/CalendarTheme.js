// CalendarTheme.js - Optimized version
import { CONSTANTS } from './CalendarConstants';
import { StyleSheet } from 'react-native';

// Pre-create static styles
const staticStyles = StyleSheet.create({
  baseContainer: {
    borderRadius: CONSTANTS.CALENDAR.BORDER_RADIUS,
  },
  selectedContainer: {
    borderRadius: CONSTANTS.CALENDAR.SELECTED_BORDER_RADIUS,
    backgroundColor: CONSTANTS.COLORS.primary,
  },
  selectedContent: {
    color: CONSTANTS.COLORS.white,
    fontWeight: 'bold',
  },
  todayContainer: {
    borderColor: CONSTANTS.COLORS.primary,
    borderWidth: 1,
    borderRadius: CONSTANTS.CALENDAR.TODAY_BORDER_RADIUS,
    backgroundColor: CONSTANTS.COLORS.primaryLight,
  },
  todayContent: {
    color: CONSTANTS.COLORS.primary,
    fontWeight: 'bold',
  },
  todayPressedContent: {
    color: CONSTANTS.COLORS.white,
    fontWeight: 'bold',
  },
  activeContainer: {
    backgroundColor: CONSTANTS.COLORS.primaryLight,
  },
  activeContent: {
    color: CONSTANTS.COLORS.primary,
    fontWeight: 'bold',
  },
  activePressedContent: {
    color: CONSTANTS.COLORS.white,
    fontWeight: 'bold',
  },
  fadedContent: {
    color: CONSTANTS.COLORS.textFaded,
  },
});

export function createCalendarTheme(selectedDate, todayId) {
  return {
    itemDay: {
      // Base style for all days
      base: (params) => {
        const { id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: staticStyles.selectedContainer,
            content: staticStyles.selectedContent,
          };
        }

        return {
          container: staticStyles.baseContainer,
        };
      },

      // Style for the active days in the week range
      active: (params) => {
        const { isEndOfRange, isStartOfRange, id, isPressed } = params;
        const isSelected = id === selectedDate;
        const isToday = id === todayId;

        if (isSelected) {
          return {
            container: staticStyles.selectedContainer,
            content: staticStyles.selectedContent,
          };
        }

        if (isToday) {
          return {
            container: {
              ...staticStyles.todayContainer,
              borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
              borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
              borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
              borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
            },
            content: isPressed ? staticStyles.todayPressedContent : staticStyles.todayContent,
          };
        }

        return {
          container: {
            ...staticStyles.activeContainer,
            borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
          },
          content: isPressed ? staticStyles.activePressedContent : staticStyles.activeContent,
        };
      },

      today: (params) => {
        const { isPressed, id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: staticStyles.selectedContainer,
            content: staticStyles.selectedContent,
          };
        }

        return {
          container: {
            ...staticStyles.todayContainer,
            backgroundColor: isPressed ? CONSTANTS.COLORS.primary : 'transparent',
          },
          content: isPressed ? staticStyles.todayPressedContent : staticStyles.todayContent,
        };
      },

      idle: (params) => {
        const { isDifferentMonth, id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: staticStyles.selectedContainer,
            content: staticStyles.selectedContent,
          };
        }

        return {
          content: isDifferentMonth ? staticStyles.fadedContent : undefined,
        };
      },
    },
  };
}
