import { View, StyleSheet } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

const GoalItem = ({ goal, onEdit, onDelete, onSchedule }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Card mode="contained" style={styles.goalCard}>
      <Card.Content>
        <View style={styles.goalItemContainer}>
          <View style={styles.goalItemContent}>
            <Text variant="titleMedium">{goal.title}</Text>
            <Text variant="bodyMedium">{goal.hoursPerWeek} hours per week</Text>
          </View>
          <View style={styles.goalItemActions}>
            <IconButton
              icon="calendar"
              size={20}
              onPress={() => onSchedule(goal.id)}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(goal)}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => onDelete(goal.id)}
              iconColor={theme.colors.error}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};
export default GoalItem;

const getStyles = (theme) =>
  StyleSheet.create({
    goalCard: {
      marginBottom: 12,
    },
    goalItemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    goalItemContent: {
      flex: 1,
    },
    goalItemActions: {
      flexDirection: 'row',
    },
  });
