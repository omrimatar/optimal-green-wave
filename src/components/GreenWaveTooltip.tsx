
import React from 'react';

interface GreenWaveTooltipProps {
  content: React.ReactNode;
  position: {
    x: number;
    y: number;
  };
}

export const GreenWaveTooltip: React.FC<GreenWaveTooltipProps> = ({ content, position }) => {
  // Calculate position to ensure tooltip stays within viewport
  const adjustedX = Math.min(position.x, window.innerWidth - 200);
  const adjustedY = Math.min(position.y, window.innerHeight - 200);

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
