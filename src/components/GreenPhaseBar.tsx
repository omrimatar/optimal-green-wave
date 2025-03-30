
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
  isHalfCycle?: boolean;
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
  onMouseLeave,
  isHalfCycle
}) => {
  // Calculate Y positions (inverted because SVG Y grows downward)
  const y1 = chartHeight - yScale(startTime);
  const y2 = chartHeight - yScale(endTime);
  const height = Math.abs(y2 - y1);

  // Set colors based on direction and whether it's a half-cycle phase
  const color = direction === 'upstream' 
    ? isHalfCycle ? '#C7F9E2' : '#A7F3D0'  // Lighter green for half-cycle
    : isHalfCycle ? '#BDD7FC' : '#93C5FD'; // Lighter blue for half-cycle
    
  const strokeColor = direction === 'upstream' 
    ? isHalfCycle ? '#34D399' : '#10B981'  // Lighter border for half-cycle
    : isHalfCycle ? '#60A5FA' : '#3B82F6'; // Lighter border for half-cycle

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
