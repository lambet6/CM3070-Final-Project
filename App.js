import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskProvider } from './TaskProvider';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from './themes';
import { PreferencesContext } from './Preferences';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { enGB, registerTranslation } from 'react-native-paper-dates';

const customLightTheme = {
  ...MD3LightTheme,
  colors: lightTheme.colors,
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: darkTheme.colors,
};

registerTranslation('en-GB', enGB);

export default function App() {
  const [isThemeDark, setIsThemeDark] = useState(true);
  let theme = isThemeDark ? customDarkTheme : customLightTheme;

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(
      isThemeDark
        ? customDarkTheme.colors.secondaryContainer
        : customLightTheme.colors.secondaryContainer,
    );
  }, [isThemeDark]);

  const toggleTheme = useCallback(() => {
    setIsThemeDark(!isThemeDark);
    return;
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
          <PaperProvider theme={theme}>
            <SafeAreaView style={{ flex: 1 }}>
              <RootNavigator />
            </SafeAreaView>
            <StatusBar
              style={isThemeDark ? 'light' : 'dark'}
              backgroundColor={theme.colors.background}
            />
          </PaperProvider>
        </PreferencesContext.Provider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
