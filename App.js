import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskProvider } from './TaskProvider';
import { MD3LightTheme as DefaultTheme, PaperProvider } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'tomato',
    secondary: 'yellow',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <PaperProvider theme={theme}>
          <SafeAreaView style={{ flex: 1 }}>
            <RootNavigator />
            <StatusBar style="dark" />
          </SafeAreaView>
        </PaperProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
