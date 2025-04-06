import { useState } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Custom hook to manage selection mode for tasks
 *
 * @param {Function} onDeleteMultiple - Callback to handle multiple item deletion
 * @returns {Object} Selection mode state and handlers
 */
export default function useSelectionMode(onDeleteMultiple) {
  // State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  /**
   * Activates selection mode on long press
   *
   * @param {string} itemId - ID of the long-pressed item
   */
  const handleLongPress = (itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedItems([itemId]);
  };

  /**
   * Toggles selection status of an item
   *
   * @param {string} itemId - ID of the item to toggle
   */
  const handleSelectionToggle = (itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  /**
   * Exits selection mode and clears selections
   */
  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems([]);
  };

  /**
   * Deletes all selected items and exits selection mode
   */
  const deleteSelectedItems = () => {
    if (selectedItems.length > 0) {
      onDeleteMultiple(selectedItems);
      setSelectionMode(false);
      setSelectedItems([]);
    }
  };

  return {
    selectionMode,
    selectedItems,
    handleLongPress,
    handleSelectionToggle,
    cancelSelection,
    deleteSelectedItems,
  };
}
