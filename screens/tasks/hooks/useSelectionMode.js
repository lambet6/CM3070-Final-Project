import { useState } from 'react';
import * as Haptics from 'expo-haptics';

export default function useSelectionMode(onDeleteMultiple) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleLongPress = (itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    setSelectedItems([itemId]);
  };

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

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems([]);
  };

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
