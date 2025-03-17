import React, { useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from '../screens/tasks/TaskScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import GoalsScreen from '../screens/GoalsScreen';
import WellbeingScreen from '../screens/WellbeingScreen';
import BottomSheet from '@gorhom/bottom-sheet';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickTaskSheet } from '../components/QuickTaskSheet';
import { BottomSheetContext } from '../contexts/BottomSheetContext';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
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
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Calendar">
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
          snapPoints={['60%']}
          keyboardShouldPersistTaps="always"
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture={true}
          enableDynamicSizing={false}
          enablePanDownToClose={true}>
          <QuickTaskSheet onClose={handleCloseSheet} taskToEdit={taskToEdit} />
        </BottomSheet>
      </NavigationContainer>
    </BottomSheetContext.Provider>
  );
}
