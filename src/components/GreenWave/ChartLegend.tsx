
import React from 'react';

interface ChartLegendProps {
  x: number;
  y: number;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ x, y }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={20} height={10} fill="#A7F3D0" rx={2} />
      <text x={24} y={8} fontSize={10}>עם הזרם</text>
      <rect x={0} y={15} width={20} height={10} fill="#93C5FD" rx={2} />
      <text x={24} y={23} fontSize={10}>נגד הזרם</text>
    </g>
  );
};
