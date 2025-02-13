import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from './screens/TaskScreen';
import CalendarScreen from './screens/CalendarScreen';
import GoalsScreen from './screens/GoalsScreen';

const Tab = createBottomTabNavigator();

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
