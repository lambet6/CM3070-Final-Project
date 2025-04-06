import React, { useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
import { TouchableOpacity } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import TasksScreen from '../screens/tasks/TaskScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import GoalsScreen from '../screens/goals/GoalsScreen';
import WellbeingScreen from '../screens/wellbeing/WellbeingScreen';
import BottomSheet from '@gorhom/bottom-sheet';
import { QuickTaskSheet } from '../components/QuickTaskSheet';
import { BottomSheetContext } from '../contexts/BottomSheetContext';

const Tab = createMaterialBottomTabNavigator();

// A dummy screen that renders nothing
const OpenSheetScreen = () => null;

export function RootNavigator() {
  const theme = useTheme();
  const bottomSheetRef = useRef(null);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const handleCloseSheet = () => {
    bottomSheetRef.current?.close();
    setTaskToEdit(null);
  };

  const handleOpenSheet = (task = null) => {
    setTaskToEdit(task);
    bottomSheetRef.current?.expand();
  };

  return (
    <BottomSheetContext.Provider value={{ openSheet: handleOpenSheet }}>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Tasks" shifting={true}>
          <Tab.Screen
            name="Tasks"
            component={TasksScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon source="list-status" size={24} color={color} />,
            }}
          />
          <Tab.Screen
            name="Schedule"
            component={CalendarScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon source="calendar" size={24} color={color} />,
            }}
          />

          {/* Dummy tab for the open sheet action */}
          <Tab.Screen
            name="OpenSheet"
            component={OpenSheetScreen}
            options={{
              tabBarIcon: () => <Icon source="plus-box" size={30} color={theme.colors.primary} />,
              tabBarLabel: '',
            }}
            listeners={{
              tabPress: (e) => {
                // Prevent navigation to this screen.
                e.preventDefault();
                handleOpenSheet();
              },
            }}
          />

          <Tab.Screen
            name="Goals"
            component={GoalsScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon source="bullseye-arrow" size={24} color={color} />,
            }}
          />
          <Tab.Screen
            name="Wellbeing"
            component={WellbeingScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon source="heart-outline" size={24} color={color} />,
            }}
          />
        </Tab.Navigator>

        {/* Global Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
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
