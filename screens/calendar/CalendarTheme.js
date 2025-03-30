// CalendarTheme.js - Optimized version
import { CONSTANTS } from './CalendarConstants';
import { StyleSheet } from 'react-native';

// Structure only (colors will be applied from theme)
const staticStyles = StyleSheet.create({
  baseContainer: {
    borderRadius: CONSTANTS.CALENDAR.BORDER_RADIUS,
  },
  selectedContainer: {
    borderRadius: CONSTANTS.CALENDAR.SELECTED_BORDER_RADIUS,
  },
  selectedContent: {
    fontWeight: 'bold',
  },
  todayContainer: {
    borderWidth: 1,
    borderRadius: CONSTANTS.CALENDAR.TODAY_BORDER_RADIUS,
  },
  todayContent: {
    fontWeight: 'bold',
  },
  todayPressedContent: {
    fontWeight: 'bold',
  },
  activeContainer: {},
  activeContent: {
    fontWeight: 'bold',
  },
  activePressedContent: {
    fontWeight: 'bold',
  },
  fadedContent: {},
});

export function createCalendarTheme(selectedDate, todayId, theme) {
  // Get all needed colors from theme or fall back to constants
  const primaryColor = theme?.colors?.primary || CONSTANTS.COLORS.primary;
  const primaryLightColor = theme?.colors?.primaryContainer || CONSTANTS.COLORS.primaryLight;
  const whiteColor = theme?.colors?.onPrimary || CONSTANTS.COLORS.white;
  const fadedColor = theme?.colors?.outline || CONSTANTS.COLORS.textFaded;

  // Create theme-aware styles
  const styles = {
    baseContainer: {
      ...staticStyles.baseContainer,
    },
    selectedContainer: {
      ...staticStyles.selectedContainer,
      backgroundColor: primaryColor,
    },
    selectedContent: {
      ...staticStyles.selectedContent,
      color: whiteColor,
    },
    todayContainer: {
      ...staticStyles.todayContainer,
      borderColor: primaryColor,
      backgroundColor: primaryLightColor,
    },
    todayContent: {
      ...staticStyles.todayContent,
      color: primaryColor,
    },
    todayPressedContent: {
      ...staticStyles.todayPressedContent,
      color: whiteColor,
    },
    activeContainer: {
      ...staticStyles.activeContainer,
      backgroundColor: primaryLightColor,
    },
    activeContent: {
      ...staticStyles.activeContent,
      color: primaryColor,
    },
    activePressedContent: {
      ...staticStyles.activePressedContent,
      color: whiteColor,
    },
    fadedContent: {
      ...staticStyles.fadedContent,
      color: fadedColor,
    },
  };

  return {
    itemDay: {
      // Base style for all days
      base: (params) => {
        const { id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: styles.selectedContainer,
            content: styles.selectedContent,
          };
        }

        return {
          container: styles.baseContainer,
        };
      },

      // Style for the active days in the week range
      active: (params) => {
        const { isEndOfRange, isStartOfRange, id, isPressed } = params;
        const isSelected = id === selectedDate;
        const isToday = id === todayId;

        if (isSelected) {
          return {
            container: styles.selectedContainer,
            content: styles.selectedContent,
          };
        }

        if (isToday) {
          return {
            container: {
              ...styles.todayContainer,
              borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
              borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
              borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
              borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 4,
            },
            content: isPressed ? styles.todayPressedContent : styles.todayContent,
          };
        }

        return {
          container: {
            ...styles.activeContainer,
            borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
          },
          content: isPressed ? styles.activePressedContent : styles.activeContent,
        };
      },

      today: (params) => {
        const { isPressed, id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: styles.selectedContainer,
            content: styles.selectedContent,
          };
        }

        return {
          container: {
            ...styles.todayContainer,
            backgroundColor: isPressed ? primaryColor : 'transparent',
          },
          content: isPressed ? styles.todayPressedContent : styles.todayContent,
        };
      },

      idle: (params) => {
        const { isDifferentMonth, id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: styles.selectedContainer,
            content: styles.selectedContent,
          };
        }

        return {
          content: isDifferentMonth ? styles.fadedContent : undefined,
        };
      },
    },
  };
}
