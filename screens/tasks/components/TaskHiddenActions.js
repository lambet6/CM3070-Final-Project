import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const TaskHiddenActions = ({ item, onEdit, onDelete }) => {
  return (
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
  );
};

const styles = StyleSheet.create({
  rowBack: {
    alignItems: 'stretch',
    backgroundColor: '#DDD',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 15,
    height: 64,
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
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  backTextWhite: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default TaskHiddenActions;
