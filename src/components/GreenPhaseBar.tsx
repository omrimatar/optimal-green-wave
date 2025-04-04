
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
  onMouseEnter: (e: React.MouseEvent, additionalInfo?: Record<string, any>) => void;
  onMouseLeave: () => void;
  isHalfCycle?: boolean;
  phaseNumber?: number; // Added phaseNumber prop
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
  isHalfCycle,
  phaseNumber // Added phaseNumber prop
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

  const duration = Math.abs(endTime - startTime);
  const phaseInfo = {
    startTime: Math.round(startTime * 100) / 100,
    endTime: Math.round(endTime * 100) / 100,
    duration: Math.round(duration * 100) / 100,
    direction,
    isHalfCycle: isHalfCycle || false,
    height: Math.round(height * 100) / 100,
    y1: Math.round(y1 * 100) / 100,
    y2: Math.round(y2 * 100) / 100,
    phaseNumber // Include phaseNumber in the phaseInfo object
  };

  // Calculate center for phase number text
  const centerY = y2 + height/2;

  return (
    <>
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
        onMouseEnter={(e) => onMouseEnter(e, phaseInfo)}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      />
      {phaseNumber && (
        <text
          x={x}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="#000000"
          fontWeight="bold"
        >
          {phaseNumber}
        </text>
      )}
    </>
  );
};
