import { CONSTANTS } from './CalendarConstants';

export function createCalendarTheme(selectedDate, todayId) {
  return {
    itemDay: {
      // Base style for all days
      base: () => ({
        container: {
          borderRadius: CONSTANTS.CALENDAR.BORDER_RADIUS,
        },
      }),

      // Style for the active days in the week range
      active: (params) => {
        const { isEndOfRange, isStartOfRange, id, isPressed } = params;
        const isSelected = id === selectedDate;
        const isToday = id === todayId;

        if (isSelected) {
          return {
            container: {
              borderRadius: CONSTANTS.CALENDAR.SELECTED_BORDER_RADIUS,
              backgroundColor: CONSTANTS.COLORS.primary,
            },
            content: {
              color: CONSTANTS.COLORS.white,
              fontWeight: 'bold',
            },
          };
        }

        if (isToday) {
          return {
            container: {
              borderColor: CONSTANTS.COLORS.primary,
              borderWidth: 1,
              backgroundColor: CONSTANTS.COLORS.primaryLight,
              borderRadius: CONSTANTS.CALENDAR.TODAY_BORDER_RADIUS,
              borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
              borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
              borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
              borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            },
            content: {
              color: isPressed ? CONSTANTS.COLORS.white : CONSTANTS.COLORS.primary,
              fontWeight: 'bold',
            },
          };
        }

        return {
          container: {
            backgroundColor: CONSTANTS.COLORS.primaryLight,
            borderTopLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomLeftRadius: isStartOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderTopRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
            borderBottomRightRadius: isEndOfRange ? CONSTANTS.CALENDAR.BORDER_RADIUS : 0,
          },
          content: {
            color: isPressed ? CONSTANTS.COLORS.white : CONSTANTS.COLORS.primary,
            fontWeight: 'bold',
          },
        };
      },

      today: (params) => {
        const { isPressed } = params;
        return {
          container: {
            borderColor: CONSTANTS.COLORS.primary,
            borderWidth: 1,
            borderRadius: CONSTANTS.CALENDAR.TODAY_BORDER_RADIUS,
            backgroundColor: isPressed ? CONSTANTS.COLORS.primary : 'transparent',
          },
          content: {
            color: isPressed ? CONSTANTS.COLORS.white : CONSTANTS.COLORS.primary,
            fontWeight: 'bold',
          },
        };
      },

      idle: (params) => {
        const { isDifferentMonth, id } = params;
        const isSelected = id === selectedDate;

        if (isSelected) {
          return {
            container: {
              backgroundColor: CONSTANTS.COLORS.primary,
              borderRadius: CONSTANTS.CALENDAR.BORDER_RADIUS,
            },
            content: {
              color: CONSTANTS.COLORS.white,
              fontWeight: 'bold',
            },
          };
        }

        return {
          content: isDifferentMonth
            ? {
                color: CONSTANTS.COLORS.textFaded,
              }
            : undefined,
        };
      },
    },
  };
}
