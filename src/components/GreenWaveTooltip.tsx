
import React from 'react';

interface GreenWaveTooltipProps {
  x: number;
  y: number;
  content: React.ReactNode;
}

export const GreenWaveTooltip: React.FC<GreenWaveTooltipProps> = ({ x, y, content }) => {
  // Calculate position to ensure tooltip stays within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      className="absolute z-50 p-3 bg-white border border-gray-200 rounded-md shadow-lg"
      style={{
        left: adjustedX + 10,
        top: adjustedY + 10,
        minWidth: '150px',
        maxWidth: '250px',
        direction: 'rtl'
      }}
    >
      {content}
    </div>
  );
};
