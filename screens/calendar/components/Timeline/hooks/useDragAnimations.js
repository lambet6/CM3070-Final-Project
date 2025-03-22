import { useSharedValue } from 'react-native-reanimated';

export const useDragAnimations = () => {
  // Preview animation values
  const previewVisible = useSharedValue(false);
  const previewPosition = useSharedValue(0);
  const previewHeight = useSharedValue(0);
  const isPreviewValid = useSharedValue(true);

  // Ghost animation values
  const ghostVisible = useSharedValue(false);
  const ghostPosition = useSharedValue(0);
  const ghostHeight = useSharedValue(0);

  // Drag state values
  const isDragging = useSharedValue(false);
  const isDraggingScheduled = useSharedValue(false);
  const autoScrollActive = useSharedValue(false);

  // Button hover states
  const isRemoveHovered = useSharedValue(false);
  const isCancelHovered = useSharedValue(false);

  return {
    previewVisible,
    previewPosition,
    previewHeight,
    isPreviewValid,
    ghostVisible,
    ghostPosition,
    ghostHeight,
    isDragging,
    isDraggingScheduled,
    autoScrollActive,
    isRemoveHovered,
    isCancelHovered,
  };
};
