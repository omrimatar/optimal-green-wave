
import React from 'react';

interface ChartAxisProps {
  dimensions: { width: number; height: number };
  maxDistance: number;
  maxCycleTime: number;
  intersections: { id: number; distance: number }[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export const ChartAxis: React.FC<ChartAxisProps> = ({
  dimensions,
  maxDistance,
  maxCycleTime,
  intersections,
  xScale,
  yScale
}) => {
  return (
    <>
      {/* Y-axis (Time) */}
      <line 
        x1={40} 
        y1={40} 
        x2={40} 
        y2={dimensions.height - 40} 
        stroke="black" 
        strokeWidth={1} 
      />
      {/* X-axis (Distance) */}
      <line 
        x1={40} 
        y1={dimensions.height - 40} 
        x2={dimensions.width - 40} 
        y2={dimensions.height - 40} 
        stroke="black" 
        strokeWidth={1} 
      />

      {/* Y-axis ticks */}
      {Array.from({ length: 5 }).map((_, i) => {
        const value = (maxCycleTime / 4) * i;
        const y = dimensions.height - 40 - yScale(value);
        return (
          <g key={`y-tick-${i}`}>
            <line 
              x1={35} 
              y1={y} 
              x2={40} 
              y2={y} 
              stroke="black" 
              strokeWidth={1} 
            />
            <text 
              x={30} 
              y={y + 4} 
              textAnchor="end" 
              fontSize={12}
            >
              {Math.round(value)}
            </text>
          </g>
        );
      })}

      {/* X-axis ticks */}
      {intersections.map((intersection, i) => {
        const x = 40 + xScale(intersection.distance);
        return (
          <g key={`x-tick-${i}`}>
            <line 
              x1={x} 
              y1={dimensions.height - 40} 
              x2={x} 
              y2={dimensions.height - 35} 
              stroke="black" 
              strokeWidth={1} 
            />
            <text 
              x={x} 
              y={dimensions.height - 20} 
              textAnchor="middle" 
              fontSize={12}
            >
              {intersection.distance}m
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text 
        x={dimensions.width / 2} 
        y={dimensions.height - 5} 
        textAnchor="middle" 
        fontSize={14}
      >
        מרחק (מטר)
      </text>
      <text 
        x={15} 
        y={dimensions.height / 2} 
        textAnchor="middle" 
        fontSize={14}
        transform={`rotate(-90 15 ${dimensions.height / 2})`}
      >
        זמן (שניות)
      </text>
    </>
  );
};
