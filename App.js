import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { TaskProvider } from './TaskProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <PaperProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <RootNavigator />
            <StatusBar style="dark" />
          </SafeAreaView>
        </PaperProvider>
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
