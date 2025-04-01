import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  withDelay,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, Icon } from 'react-native-paper';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  duration: 1200,
  overshootClamping: true,
  dampingRatio: 0.8,
};

const OFFSET = 60;

const FabButton = ({ isExpanded, index, iconName, onPress }) => {
  const theme = useTheme();

  const animatedStyles = useAnimatedStyle(() => {
    const moveValue = isExpanded.value ? OFFSET * index : 0;
    const translateValue = withSpring(-moveValue, SPRING_CONFIG);
    const delay = index * 100;
    const scaleValue = isExpanded.value ? 1 : 0;

    return {
      transform: [
        { translateY: translateValue },
        {
          scale: withDelay(delay, withTiming(scaleValue)),
        },
      ],
    };
  });

  return (
    <AnimatedPressable
      style={[
        animatedStyles,
        styles.shadow,
        styles.button,
        { backgroundColor: theme.colors.secondaryContainer },
      ]}
      onPress={() => onPress(index)}>
      <Icon source={iconName} size={22} color={theme.colors.onSecondaryContainer} />
    </AnimatedPressable>
  );
};

export default function FloatingActionButton() {
  const theme = useTheme();
  const isExpanded = useSharedValue(false);

  const handlePress = () => {
    console.log('Main FAB pressed');
    isExpanded.value = !isExpanded.value;
  };

  const handleButtonPress = (index) => {
    console.log(`Button ${index} pressed`);
    // Each button logs which action was pressed
    switch (index) {
      case 1:
        console.log('Create new event');
        break;
      case 2:
        console.log('Create new task');
        break;
      case 3:
        console.log('Create new reminder');
        break;
    }
    isExpanded.value = false;
  };

  const plusIconStyle = useAnimatedStyle(() => {
    const moveValue = interpolate(Number(isExpanded.value), [0, 1], [0, 2]);
    const translateValue = withTiming(moveValue);
    const rotateValue = isExpanded.value ? '45deg' : '0deg';

    return {
      transform: [{ translateX: translateValue }, { rotate: withTiming(rotateValue) }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          onPress={handlePress}
          style={[styles.shadow, styles.mainButton, { backgroundColor: theme.colors.primary }]}>
          <Animated.View style={[plusIconStyle, styles.mainButtonContent]}>
            <Icon source="creation" size={24} color={theme.colors.onPrimary} />
          </Animated.View>
        </AnimatedPressable>

        <FabButton
          isExpanded={isExpanded}
          index={1}
          iconName="calendar-star" // Auto schedule
          onPress={handleButtonPress}
        />

        <FabButton
          isExpanded={isExpanded}
          index={2}
          iconName="delete-clock-outline" // Clear timeline
          onPress={handleButtonPress}
        />

        <FabButton
          isExpanded={isExpanded}
          index={3}
          iconName="bell-outline" // Reminders
          onPress={handleButtonPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  },
  buttonContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mainButton: {
    zIndex: 1,
    height: 60,
    width: 60,
    borderRadius: 30,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  //   mainButtonContent: {
  //     fontSize: 24,
  //     color: '#ffffff',
  //   },
  button: {
    width: 45,
    height: 45,
    position: 'absolute',
    borderRadius: 25,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -2,
  },
  content: {
    fontWeight: '500',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
