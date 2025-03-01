import React from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAnimatedStyles } from '../../../utilities/animation-utils';

const TaskHiddenActions = ({ item, animVal, onEdit, onDelete }) => {
  const animatedStyles = createAnimatedStyles(animVal, true);

  return (
    <Animated.View style={animatedStyles}>
      <View style={styles.rowBack}>
        {/* Empty view on the left side */}
        <View />

        {/* Both buttons on the right side */}
        <View style={styles.rightButtonContainer}>
          <TouchableOpacity
            style={[styles.backRightBtn, styles.editButton]}
            onPress={() => {
              onEdit(item);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}>
            <Text style={styles.backTextWhite}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backRightBtn, styles.deleteButton]}
            onPress={() => onDelete(item.id)}>
            <Text style={styles.backTextWhite}>Delete</Text>
          </TouchableOpacity>
        </View>
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
  rightButtonContainer: {
    flexDirection: 'row',
    width: 150, // Match the rightOpenValue
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    top: 0,
    width: 75,
  },
  editButton: {
    backgroundColor: '#4CD964', // Keep the same green color
  },
  deleteButton: {
    backgroundColor: 'red', // Keep the same red color
  },
  backTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default TaskHiddenActions;
