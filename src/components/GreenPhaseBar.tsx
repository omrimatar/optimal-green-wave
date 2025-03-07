
import React from 'react';

interface GreenPhaseBarProps {
  xPosition: number;
  startTime: number;
  duration: number;
  cycleTime: number;
  direction: 'upstream' | 'downstream';
  dimensions: {
    width: number;
    height: number;
  };
  yScale: (value: number) => number;
}

export const GreenPhaseBar: React.FC<GreenPhaseBarProps> = ({
  xPosition,
  startTime,
  duration,
  cycleTime,
  direction,
  dimensions,
  yScale
}) => {
  const barWidth = 20; // Width of the phase bar
  
  // Calculate Y positions (inverted because SVG Y grows downward)
  const startY = dimensions.height - 40 - yScale(startTime);
  const endTime = (startTime + duration) % cycleTime;
  const endY = dimensions.height - 40 - yScale(endTime);
  
  // Handle case where the phase wraps around the cycle time
  const height = startTime + duration <= cycleTime
    ? yScale(duration)
    : yScale(duration - (startTime + duration - cycleTime));

  // Set colors based on direction
  const color = direction === 'upstream' ? '#A7F3D0' : '#93C5FD'; // Light green / Light blue
  const strokeColor = direction === 'upstream' ? '#10B981' : '#3B82F6'; // Darker border for contrast

  return (
    <rect
      x={xPosition - barWidth / 2}
      y={Math.min(startY, endY)}
      width={barWidth}
      height={height}
      fill={color}
      stroke={strokeColor}
      strokeWidth={1}
      rx={3}
      ry={3}
      style={{ cursor: 'pointer' }}
    />
  );
};
