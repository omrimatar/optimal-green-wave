
import React from 'react';
import { type Intersection } from '@/types/optimization';

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

// Helper component to render all green phases for an intersection
interface IntersectionGreenPhaseBarProps {
  intersection: Intersection;
  xPosition: number;
  height: number;
  handleShowTooltip: (x: number, y: number, content: React.ReactNode) => void;
  handleHideTooltip: () => void;
}

export const IntersectionGreenPhaseBar: React.FC<IntersectionGreenPhaseBarProps> = ({
  intersection,
  xPosition,
  height,
  handleShowTooltip,
  handleHideTooltip
}) => {
  const barWidth = 30;
  const yScale = (value: number) => (value / intersection.cycleTime) * height;

  return (
    <>
      {intersection.greenPhases.map((phase, phaseIndex) => {
        const startTime = phase.startTime;
        const endTime = (phase.startTime + phase.duration) % intersection.cycleTime;
        
        const tooltipContent = (
          <div>
            <p>צומת: {intersection.id}</p>
            <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
            <p>זמן התחלה: {startTime.toFixed(0)} שניות</p>
            <p>משך: {phase.duration.toFixed(0)} שניות</p>
            <p>מהירות: {phase.direction === 'upstream' ? 
              intersection.upstreamSpeed || '?' : 
              intersection.downstreamSpeed || '?'} קמ"ש</p>
          </div>
        );

        return (
          <GreenPhaseBar
            key={`phase-${intersection.id}-${phaseIndex}`}
            x={xPosition}
            startTime={startTime}
            endTime={endTime}
            cycleTime={intersection.cycleTime}
            direction={phase.direction}
            barWidth={barWidth}
            yScale={yScale}
            chartHeight={height}
            onMouseEnter={(e) => handleShowTooltip(e.clientX, e.clientY, tooltipContent)}
            onMouseLeave={handleHideTooltip}
          />
        );
      })}
    </>
  );
};
