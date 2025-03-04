import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from '../screens/tasks/TaskScreen';
import CalendarScreen from '../screens/CalendarScreen';
import GoalsScreen from '../screens/GoalsScreen';
import WellbeingScreen from '../screens/WellbeingScreen';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const bottomSheetRef = useRef(null);

  // Dummy screen component that does nothing except open the sheet
  const OpenSheetScreen = () => {
    return null; // This screen never actually renders anything
  };

  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="Wellbeing">
        <Tab.Screen name="Tasks" component={TasksScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />

        {/* Dummy Tab Button in the middle */}
        <Tab.Screen
          name="OpenSheet"
          component={OpenSheetScreen}
          options={{
            tabBarButton: ({ accessibilityState }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  padding: 10,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
                onPress={() => bottomSheetRef.current?.expand()}>
                <Ionicons name="add" size={30} color="white" />
              </TouchableOpacity>
            ),
          }}
        />

        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Wellbeing" component={WellbeingScreen} />
      </Tab.Navigator>

      {/* Global Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        bottomInset={49}
        snapPoints={['25%']}
        enablePanDownToClose={true}
        backgroundComponent={null}>
        <BottomSheetView
          style={{ flex: 1, backgroundColor: 'blue', padding: 20 }}></BottomSheetView>
      </BottomSheet>
    </NavigationContainer>
  );
}
