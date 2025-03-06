
import { type Intersection } from "@/types/optimization";

export const calculateScales = (
  maxDistance: number,
  maxCycleTime: number, 
  dimensions: { width: number, height: number }
) => {
  const xScale = (value: number) => (value / maxDistance) * (dimensions.width - 80);
  const yScale = (value: number) => (value / maxCycleTime) * (dimensions.height - 80);
  
  return { xScale, yScale };
};

export const generateYGridLines = (
  maxCycleTime: number,
  dimensions: { width: number, height: number },
  yScale: (value: number) => number
) => {
  const interval = 10;
  const lines = [];
  for (let t = 0; t <= maxCycleTime; t += interval) {
    const y = dimensions.height - 40 - yScale(t);
    lines.push(
      <line 
        key={`y-grid-${t}`}
        x1={40} 
        y1={y} 
        x2={dimensions.width - 40} 
        y2={y} 
        stroke="#e5e7eb" 
        strokeWidth={1}
        strokeDasharray="4 4"
      />
    );
  }
  return lines;
};

export const generateXGridLines = (
  intersections: Intersection[],
  dimensions: { width: number, height: number },
  xScale: (value: number) => number
) => {
  if (intersections.length <= 1) return null;
  
  const lines = [];
  for (let i = 0; i < intersections.length; i++) {
    const x = 40 + xScale(intersections[i].distance);
    lines.push(
      <line 
        key={`x-grid-${i}`}
        x1={x} 
        y1={40} 
        x2={x} 
        y2={dimensions.height - 40} 
        stroke="#e5e7eb" 
        strokeWidth={1}
        strokeDasharray="4 4"
      />
    );
  }
  return lines;
};

export const generateYAxisTicks = (
  maxCycleTime: number,
  dimensions: { width: number, height: number },
  yScale: (value: number) => number
) => {
  return Array.from({ length: 5 }).map((_, i) => {
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
          y={y - 10} 
          textAnchor="end" 
          fontSize={12}
        >
          {Math.round(value)}
        </text>
      </g>
    );
  });
};

export const generateXAxisTicks = (
  intersections: Intersection[],
  dimensions: { width: number, height: number },
  xScale: (value: number) => number
) => {
  return intersections.map((intersection, i) => {
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
  });
};
