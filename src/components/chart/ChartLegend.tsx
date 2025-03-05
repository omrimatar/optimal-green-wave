
import React from 'react';

interface ChartLegendProps {
  width: number;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ width }) => {
  return (
    <g transform={`translate(${width - 150}, 50)`}>
      <rect width={140} height={70} fill="white" stroke="#ccc" rx={4} />
      <rect x={10} y={15} width={20} height={10} fill="#A7F3D0" rx={2} />
      <text x={40} y={23} fontSize={12}>עם הזרם (ירוק)</text>
      <rect x={10} y={40} width={20} height={10} fill="#93C5FD" rx={2} />
      <text x={40} y={48} fontSize={12}>נגד הזרם (כחול)</text>
    </g>
  );
};
