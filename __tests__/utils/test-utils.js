import { render } from '@testing-library/react-native';

/**
 * Sets up a mock Date for testing date-dependent functionality
 * @param {Date} mockDate - The date to mock
 * @returns {Function} A cleanup function to restore the original Date
 */
export const setupMockDate = (mockDate) => {
  const RealDate = global.Date;

  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return new RealDate(mockDate);
      }
      return new RealDate(...args);
    }

    static now() {
      return new RealDate(mockDate).getTime();
    }
  }

  global.Date = MockDate;

  return () => {
    global.Date = RealDate;
  };
};

/**
 * Wraps a component with necessary providers for testing
 * @param {React.Component} ui - The component to render
 * @param {Object} options - Additional render options
 * @returns {Object} The render result
 */
export const renderWithProviders = (ui, options = {}) => {
  return render(ui, { ...options });
};
