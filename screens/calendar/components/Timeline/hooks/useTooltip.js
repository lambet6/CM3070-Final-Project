import { useState, useCallback } from 'react';

export const useTooltip = () => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipMessage, setTooltipMessage] = useState('');

  const showTooltip = useCallback((position, message) => {
    setTooltipPosition(position);
    setTooltipMessage(message);
    setTooltipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  return {
    tooltipVisible,
    tooltipPosition,
    tooltipMessage,
    showTooltip,
    hideTooltip,
  };
};
