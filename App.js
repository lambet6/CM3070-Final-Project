import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskProvider } from './TaskProvider';
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { lightTheme, darkTheme } from './themes';
import { PreferencesContext } from './Preferences';
import { useCallback, useMemo, useState } from 'react';

import { enGB, registerTranslation } from 'react-native-paper-dates';
registerTranslation('en-GB', enGB);

const customTheme = {
  ...MD3LightTheme,
  colors: lightTheme.colors,
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: darkTheme.colors,
};

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
  },
  // fonts: {
  //   ...NavigationDefaultTheme.fonts,
  //   // Define all expected variants, falling back to 'regular' or another existing variant
  //   displayLarge: NavigationDefaultTheme.fonts.regular,
  //   displayMedium: NavigationDefaultTheme.fonts.regular,
  //   displaySmall: NavigationDefaultTheme.fonts.regular,
  //   headlineLarge: NavigationDefaultTheme.fonts.regular,
  //   headlineMedium: NavigationDefaultTheme.fonts.regular,
  //   headlineSmall: NavigationDefaultTheme.fonts.regular,
  //   titleLarge: NavigationDefaultTheme.fonts.regular,
  //   titleMedium: NavigationDefaultTheme.fonts.medium, // Example using medium for title variants
  //   titleSmall: NavigationDefaultTheme.fonts.medium,
  //   labelLarge: NavigationDefaultTheme.fonts.medium,
  //   labelMedium: NavigationDefaultTheme.fonts.medium,
  //   labelSmall: NavigationDefaultTheme.fonts.medium,
  //   bodyLarge: NavigationDefaultTheme.fonts.regular,
  //   bodyMedium: NavigationDefaultTheme.fonts.regular,
  //   bodySmall: NavigationDefaultTheme.fonts.regular,
  // },
};
const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
  },
};

export default function App() {
  const [isThemeDark, setIsThemeDark] = useState(false);
  let theme = isThemeDark ? CombinedDarkTheme : CombinedDefaultTheme;

  const toggleTheme = useCallback(() => {
    return setIsThemeDark(!isThemeDark);
  }, [isThemeDark]);

  const preferences = useMemo(
    () => ({
      toggleTheme,
      isThemeDark,
    }),
    [toggleTheme, isThemeDark],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <PreferencesContext.Provider value={preferences}>
          <PaperProvider theme={customTheme}>
            <SafeAreaView style={{ flex: 1 }}>
              <RootNavigator theme={customTheme} />
              <StatusBar style="dark" />
            </SafeAreaView>
          </PaperProvider>
        </PreferencesContext.Provider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
