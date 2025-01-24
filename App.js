import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from './TasksScreen';


function CalendarScreen() {
  return (
    <View testID="calendar-screen" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Calendar Screen</Text>
    </View>
  );
}

function GoalsScreen() {
  return (
    <View testID="goals-screen" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Goals Screen</Text>
    </View>
  );
}

function WellbeingScreen() {
  return (
    <View testID="wellbeing-screen" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Wellbeing Screen</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();


export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Tasks" component={TasksScreen} />
          <Tab.Screen name="Calendar" component={CalendarScreen} />
          <Tab.Screen name="Goals" component={GoalsScreen} />
          <Tab.Screen name="Wellbeing" component={WellbeingScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" /> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
