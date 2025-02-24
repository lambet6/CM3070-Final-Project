import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useGoalsStore } from '../store/goalsStore';
import GoalItem from '../components/GoalItem';

export default function GoalsScreen() {
  const { goals, error, isLoading, loadGoals, addNewGoal, updateGoal, deleteGoal } =
    useGoalsStore();

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View testID="goals-screen" style={styles.container}>
        <Text style={styles.header}>Make time for your long-term goals, hobbies, and passions</Text>
        <Text style={styles.subHeader}>
          Choose up to 7 things important to you and how many hours per week you would like to spend
          on them
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {isLoading && <Text style={styles.loadingText}>Loading goals...</Text>}
        <View style={styles.tableHeader}>
          <Text style={styles.columnHeader}>Goal</Text>
          <Text style={styles.columnHeader}>Hours per week</Text>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <FlatList
            data={[...goals, ...(goals.length < 7 ? [{ id: 'add' }] : [])]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              item.id === 'add' ? (
                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    // Here you might prompt the user to enter details.
                    addNewGoal('New Goal', 0);
                  }}>
                  <Text style={styles.addButtonText}>➕ Add Goal</Text>
                </Pressable>
              ) : (
                <GoalItem item={item} updateGoal={updateGoal} deleteGoal={deleteGoal} />
              )
            }
          />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  columnHeader: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 5,
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 5,
  },
});
