import { View, StyleSheet } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

/**
 * GoalItem component - Displays a single goal with actions
 *
 * @param {Object} goal - The goal object to display
 * @param {Function} onEdit - Callback when edit button is pressed
 * @param {Function} onDelete - Callback when delete button is pressed
 * @param {Function} onSchedule - Callback when schedule button is pressed
 */
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
              iconColor={theme.colors.secondary}
            />
            <IconButton
              icon="trash-can-outline"
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

/**
 * Create component styles based on theme
 */
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

export default GoalItem;
