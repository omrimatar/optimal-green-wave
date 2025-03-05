
import React from 'react';

interface GreenPhaseBarProps {
  x: number;
  startTime: number;
  endTime: number;
  cycleTime: number;
  direction: 'upstream' | 'downstream';
  barWidth: number;
  yScale: (value: number) => number;
  chartHeight: number;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export const GreenPhaseBar: React.FC<GreenPhaseBarProps> = ({
  x,
  startTime,
  endTime,
  cycleTime,
  direction,
  barWidth,
  yScale,
  chartHeight,
  onMouseEnter,
  onMouseLeave
}) => {
  // Calculate Y positions (inverted because SVG Y grows downward)
  const y1 = chartHeight - yScale(startTime);
  const y2 = chartHeight - yScale(endTime);
  const height = Math.abs(y2 - y1);

  // Set colors based on direction
  const color = direction === 'upstream' ? '#A7F3D0' : '#93C5FD'; // Light green / Light blue
  const strokeColor = direction === 'upstream' ? '#10B981' : '#3B82F6'; // Darker border for contrast

  return (
    <rect
      x={x - barWidth / 2}
      y={y2}
      width={barWidth}
      height={height}
      fill={color}
      stroke={strokeColor}
      strokeWidth={1}
      rx={3}
      ry={3}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    />
  );
};
