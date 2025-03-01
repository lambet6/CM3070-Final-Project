import React from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAnimatedStyles } from '../../../utilities/animation-utils';

const TaskHiddenActions = ({ item, animVal, onEdit, onDelete }) => {
  const animatedStyles = createAnimatedStyles(animVal, true);

  return (
    <Animated.View style={animatedStyles}>
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backLeftBtn]}
          onPress={() => {
            onEdit(item);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}>
          <Text style={styles.backTextWhite}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.backRightBtn]} onPress={() => onDelete(item.id)}>
          <Text style={styles.backTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rowBack: {
    alignItems: 'stretch',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 13,
    overflow: 'hidden',
    height: 56,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    top: 0,
    width: 76,
    backgroundColor: 'red',
  },
  backLeftBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    top: 0,
    width: 76,
    backgroundColor: '#4CD964',
  },
  backTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default TaskHiddenActions;
