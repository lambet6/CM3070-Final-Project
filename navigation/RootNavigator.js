import React, { useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
import TasksScreen from '../screens/tasks/TaskScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import WellbeingScreen from '../screens/wellbeing/WellbeingScreen';
import BottomSheet from '@gorhom/bottom-sheet';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickTaskSheet } from '../components/QuickTaskSheet';
import { BottomSheetContext } from '../contexts/BottomSheetContext';

const Tab = createBottomTabNavigator();
// const Tab = createMaterialBottomTabNavigator();

export function RootNavigator({ theme }) {
  const bottomSheetRef = useRef(null);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Dummy screen component that does nothing except open the sheet
  const OpenSheetScreen = () => {
    return null; // This screen never actually renders anything
  };

  const handleCloseSheet = () => {
    bottomSheetRef.current?.close();
    setTaskToEdit(null); // Reset edit state when closed
  };

  const handleOpenSheet = (task = null) => {
    setTaskToEdit(task);
    bottomSheetRef.current?.expand();
  };

  return (
    <BottomSheetContext.Provider value={{ openSheet: handleOpenSheet }}>
      <NavigationContainer theme={theme}>
        <Tab.Navigator
          initialRouteName="Tasks"
          screenOptions={{
            headerShown: false,
          }}>
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
                  onPress={() => handleOpenSheet()}>
                  <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
              ),
            }}
          />

          <Tab.Screen name="Goals" component={GoalsScreen} />
          <Tab.Screen name="Wellbeing" component={WellbeingScreen} />
        </Tab.Navigator>

        {/* Global Bottom Sheet with Task Form */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          bottomInset={49}
          snapPoints={['65%']}
          keyboardShouldPersistTaps="always"
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture={true}
          enableDynamicSizing={false}
          enablePanDownToClose={true}
          handleStyle={{
            backgroundColor: theme.colors.surface,
          }}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.onSurfaceVariant,
          }}
          backgroundStyle={{
            backgroundColor: theme.colors.background,
          }}>
          <QuickTaskSheet onClose={handleCloseSheet} taskToEdit={taskToEdit} />
        </BottomSheet>
      </NavigationContainer>
    </BottomSheetContext.Provider>
  );
}
