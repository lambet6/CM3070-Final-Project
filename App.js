import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{ flex: 1 }}>
        <RootNavigator />
        <StatusBar style="dark" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
