import { Easing } from 'react-native-reanimated';
export const CONSTANTS = {
  ANIMATION: {
    DURATION: 250,
    EASING: Easing.bezier(0.25, 0.1, 0.25, 1),
    SLIDE_DISTANCE: 100,
  },
  CALENDAR: {
    BORDER_RADIUS: 10,
    TODAY_BORDER_RADIUS: 15,
    SELECTED_BORDER_RADIUS: 8,
    DAY_HEIGHT: 48,
    ROW_SPACING: 0,
  },
  COLORS: {
    primary: '#585ABF',
    primaryLight: 'rgba(88, 90, 191, 0.1)',
    textFaded: 'rgba(180, 180, 180, 0.5)',
    white: '#FFFFFF',
    background: '#F8F9FC',
    buttonBackground: '#F0F1FA',
  },
};
