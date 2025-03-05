
import { useState } from 'react';

interface TooltipInfo {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
}

export function useTooltip() {
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo>({
    visible: false,
    x: 0,
    y: 0,
    content: null
  });

  const handleShowTooltip = (x: number, y: number, content: React.ReactNode) => {
    setTooltipInfo({
      visible: true,
      x,
      y,
      content
    });
  };

  const handleHideTooltip = () => {
    setTooltipInfo(prev => ({ ...prev, visible: false }));
  };

  return {
    tooltipInfo,
    handleShowTooltip,
    handleHideTooltip
  };
}
