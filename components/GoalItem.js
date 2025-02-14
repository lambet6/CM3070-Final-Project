import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

export default function GoalItem({ item, updateGoal, deleteGoal }) {
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localHours, setLocalHours] = useState(item.hoursPerWeek);

  // Track whether the user has either field in focus
  const [titleFocused, setTitleFocused] = useState(true);
  const [hoursFocused, setHoursFocused] = useState(false);

  const handleUpdate = () => {
    const finalTitle = localTitle.trim();
    updateGoal(item.id, finalTitle, localHours);
    setLocalTitle(finalTitle);
  };

  // Whenever titleFocused or hoursFocused changes, check if both are false
  useEffect(() => {
    if (!titleFocused && !hoursFocused) {
      handleUpdate();
    }
  }, [titleFocused, hoursFocused]);

  const handleTitle = () => {
    if (localTitle == 'New Goal') {
        setLocalTitle('')
    }
  }

  return (
    <View style={styles.goalItem}>
      <TextInput
        autoFocus={localTitle=='New Goal'}
        style={styles.goalText}
        placeholder="Enter goal"
        value={localTitle}
        onChangeText={setLocalTitle}
        onFocus={() => {
            setTitleFocused(true)
            handleTitle();
        }}
        onBlur={() => {
          setTitleFocused(false);
        }}
      />
      <TextInput
        style={styles.hoursInput}
        placeholder="0"
        keyboardType="numeric"
        value={String(localHours)}
        onChangeText={(text) => setLocalHours(parseInt(text) || 0)}
        onFocus={() => setHoursFocused(true)}
        onBlur={() => {
          setHoursFocused(false);
        }}
      />
      <Pressable onPress={() => deleteGoal(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>❌</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    paddingHorizontal: 4
  },
  hoursInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    borderBottomWidth: 1
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8
  }
});
