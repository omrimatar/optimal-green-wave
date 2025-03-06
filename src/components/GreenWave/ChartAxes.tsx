
import React from 'react';

interface ChartAxesProps {
  dimensions: { width: number, height: number };
}

export const ChartAxes: React.FC<ChartAxesProps> = ({ dimensions }) => {
  return (
    <>
      {/* Y-axis */}
      <line 
        x1={40} 
        y1={40} 
        x2={40} 
        y2={dimensions.height - 40} 
        stroke="black" 
        strokeWidth={1} 
      />
      
      {/* X-axis */}
      <line 
        x1={40} 
        y1={dimensions.height - 40} 
        x2={dimensions.width - 40} 
        y2={dimensions.height - 40} 
        stroke="black" 
        strokeWidth={1} 
      />
      
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
