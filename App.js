import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RootNavigator />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
