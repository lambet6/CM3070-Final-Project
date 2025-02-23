/*global jest*/
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// Mock LineChart
jest.mock('react-native-chart-kit', () => ({
  LineChart: () => 'LineChart',
}));
