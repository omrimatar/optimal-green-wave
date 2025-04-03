
import React, { useEffect, useRef, useState } from 'react';

interface GreenWaveTooltipProps {
  x: number;
  y: number;
  content: React.ReactNode;
  isMobile?: boolean;
}

export const GreenWaveTooltip: React.FC<GreenWaveTooltipProps> = ({ x, y, content, isMobile = false }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x + 10, top: y + 10 });

  useEffect(() => {
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if tooltip would extend beyond edges
      const rightOverflow = (x + tooltipRect.width + 20) > viewportWidth;
      const bottomOverflow = (y + tooltipRect.height + 20) > viewportHeight;
      
      // Prioritize showing tooltip to the left of cursor when near the right edge
      let newLeft = Math.max(10, x - tooltipRect.width - 10); // Default to left of cursor
      
      // Only position to the right if there's plenty of room
      if (!rightOverflow && x < viewportWidth / 2) {
        newLeft = x + 10;
      }
      
      let newTop = bottomOverflow ? 
        Math.max(10, y - tooltipRect.height - 10) : // Position above cursor
        y + 10; // Position below cursor
      
      // Update position
      setPosition({ left: newLeft, top: newTop });
    }
  }, [x, y]);

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 p-3 bg-white border border-gray-200 rounded-md shadow-lg"
      style={{
        left: position.left,
        top: position.top,
        minWidth: isMobile ? '120px' : '150px',
        maxWidth: isMobile ? '200px' : '300px', // Increased max width for better readability
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
