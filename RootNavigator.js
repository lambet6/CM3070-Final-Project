import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from './TasksScreen';

const Tab = createBottomTabNavigator();

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

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName='Tasks'>
        <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarButtonTestID: 'tasks-tab' }} />
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ tabBarButtonTestID: 'calendar-tab' }} />
        <Tab.Screen name="Goals" component={GoalsScreen} options={{ tabBarButtonTestID: 'goals-tab' }} />
        <Tab.Screen name="Wellbeing" component={WellbeingScreen} options={{ tabBarButtonTestID: 'wellbeing-tab' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
