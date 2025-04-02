
import React from 'react';

interface GreenWaveTooltipProps {
  x: number;
  y: number;
  content: React.ReactNode;
  isMobile?: boolean;
}

export const GreenWaveTooltip: React.FC<GreenWaveTooltipProps> = ({ x, y, content, isMobile = false }) => {
  // Calculate position to ensure tooltip stays within viewport
  const adjustedX = Math.min(x, window.innerWidth - (isMobile ? 150 : 200));
  const adjustedY = Math.min(y, window.innerHeight - (isMobile ? 150 : 200));

  return (
    <div
      className="absolute z-50 p-3 bg-white border border-gray-200 rounded-md shadow-lg"
      style={{
        left: adjustedX + 10,
        top: adjustedY + 10,
        minWidth: isMobile ? '120px' : '150px',
        maxWidth: isMobile ? '200px' : '250px',
        direction: 'rtl',
        fontSize: isMobile ? '0.85rem' : '1rem',
        color: '#333',
        lineHeight: '1.4'
      }}
    >
      {content}
    </div>
  );
};
