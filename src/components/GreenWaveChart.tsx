import React, { useEffect, useRef, useState } from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import type { RunResult, DiagonalPoint } from '@/types/traffic';
import type { Intersection } from '@/types/optimization';

interface GreenWaveChartProps {
  distances: number[];
  results: RunResult | null;
  cycleTime: number;
  title?: string;
  metric?: string;
  intersections: Intersection[];
  speed?: number;
}

interface TooltipData {
  visible: boolean;
  content: string;
  position: { x: number; y: number };
}

const GreenWaveChart: React.FC<GreenWaveChartProps> = ({ 
  distances, 
  results, 
  cycleTime,
  title,
  metric,
  intersections,
  speed
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    content: '',
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (chartRef.current) {
      const width = chartRef.current.offsetWidth;
      const height = chartRef.current.offsetHeight;
      setDimensions({ width, height });
    }
  }, []);

  const xScale = (distance: number) => {
    const maxDistance = Math.max(...distances);
    return 40 + (distance / maxDistance) * (dimensions.width - 80);
  };

  const yScale = (time: number) => {
    return (time / cycleTime) * (dimensions.height - 80);
  };

  const handleMouseEnter = (event: React.MouseEvent, content: string) => {
    setTooltip({
      visible: true,
      content: content,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      content: '',
      position: { x: 0, y: 0 },
    });
  };

  // Calculate the coordinates and dimensions for each component
  const intersectionCount = distances.length;
  const spaceBetweenBars = canvasWidth / intersectionCount;

  if (!results || !distances) {
    return <div>No data available</div>;
  }

  // Extract information needed to draw the diagram
  const { offsets, diagonal_points, pairs_band_points } = results;

  // Create an array of 5-pixel band colors from green to red
  const green = { r: 0, g: 128, b: 0 };
  const red = { r: 255, g: 0, b: 0 };
  const yellow = { r: 255, g: 214, b: 0 };
  
  const getInterpolatedColor = (ratio: number) => {
    // Interpolate between green and red based on the provided ratio
    // Use yellow as an intermediate color
    let r, g, b;
    
    if (ratio <= 0.5) {
      // Interpolate between green and yellow
      const adjustedRatio = ratio * 2; // Rescale to [0, 1]
      r = Math.round(green.r + (yellow.r - green.r) * adjustedRatio);
      g = Math.round(green.g + (yellow.g - green.g) * adjustedRatio);
      b = Math.round(green.b + (yellow.b - green.b) * adjustedRatio);
    } else {
      // Interpolate between yellow and red
      const adjustedRatio = (ratio - 0.5) * 2; // Rescale to [0, 1]
      r = Math.round(yellow.r + (red.r - yellow.r) * adjustedRatio);
      g = Math.round(yellow.g + (red.g - yellow.g) * adjustedRatio);
      b = Math.round(yellow.b + (red.b - yellow.b) * adjustedRatio);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const renderIntersections = () => {
    return distances.map((distance, index) => {
      const id = intersections[index]?.id || index + 1;
      const x = xScale(distance);
      const offset = offsets ? offsets[index] || 0 : 0;
      
      console.log(`Rendering intersection ${index + 1} (ID: ${id}):`);
      console.log(`  Distance: ${distance}m`);
      console.log(`  Cycle Time: ${cycleTime}s`);
      console.log(`  Offset: ${offset}s`);
      console.log(`  Green Phases: ${JSON.stringify(intersections[index]?.greenPhases)}`);
      
      return (
        <g key={`intersection-${index}`} className="intersection-group">
          {/* Intersection vertical line */}
          <line
            x1={x}
            y1={40}
            x2={x}
            y2={dimensions.height - 40}
            stroke="#ddd"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          
          {/* Intersection label */}
          <text
            x={x}
            y={dimensions.height - 20}
            textAnchor="middle"
            className="text-sm fill-gray-700"
          >
            {id}
          </text>
          
          {/* Distance label */}
          <text
            x={x}
            y={dimensions.height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {distance}m
          </text>
          
          {/* Green phases */}
          {intersections[index]?.greenPhases.map((phase, phaseIndex) => {
            const direction = phase.direction;
            const startTime = phase.startTime;
            const duration = phase.duration;
            
            // Adjust startTime by the intersection's offset
            const adjustedStartTime = (startTime + offset) % cycleTime;
            const adjustedEndTime = (adjustedStartTime + duration) % cycleTime;
            const wrappedPhase = adjustedEndTime < adjustedStartTime;
            
            console.log(`  Phase ${phaseIndex + 1}:`);
            console.log(`    Direction: ${direction}`);
            console.log(`    Original Start: ${startTime}s`);
            console.log(`    Duration: ${duration}s`);
            console.log(`    Adjusted Start: ${adjustedStartTime}s`);
            console.log(`    Adjusted End: ${adjustedEndTime}s`);
            console.log(`    Wrapped: ${wrappedPhase}`);
            
            // If phase wraps around cycle time, we need to render two rectangles
            return (
              <React.Fragment key={`phase-${index}-${phaseIndex}`}>
                <GreenPhaseBar
                  xPosition={x}
                  startTime={adjustedStartTime}
                  duration={wrappedPhase ? cycleTime - adjustedStartTime : duration}
                  cycleTime={cycleTime}
                  direction={direction}
                  dimensions={dimensions}
                  yScale={yScale}
                />
                
                {wrappedPhase && (
                  <GreenPhaseBar
                    xPosition={x}
                    startTime={0}
                    duration={adjustedEndTime}
                    cycleTime={cycleTime}
                    direction={direction}
                    dimensions={dimensions}
                    yScale={yScale}
                  />
                )}
              </React.Fragment>
            );
          })}
        </g>
      );
    });
  };

  const renderGridLines = () => {
    const gridLines = [];
    const step = 15; // Grid line every 15 seconds
    
    for (let t = 0; t <= cycleTime; t += step) {
      const y = dimensions.height - 40 - yScale(t);
      
      gridLines.push(
        <line
          key={`grid-${t}`}
          x1={40}
          y1={y}
          x2={dimensions.width - 40}
          y2={y}
          stroke="#eee"
          strokeWidth={1}
        />
      );
      
      gridLines.push(
        <text
          key={`grid-text-${t}`}
          x={35}
          y={y + 5}
          textAnchor="end"
          className="text-xs fill-gray-500"
        >
          {t}s
        </text>
      );
    }
    
    return gridLines;
  };

  // Draw the diagonal green wave lines
  const renderDiagonalLines = () => {
    if (!diagonal_points || !pairs_band_points) return null;
    
    const upPoints = diagonal_points.up || [];
    const downPoints = diagonal_points.down || [];
    
    const lines: JSX.Element[] = [];
    const bandBoxes: JSX.Element[] = [];
    
    // Draw upstream diagonal lines
    for (let i = 0; i < upPoints.length - 1; i++) {
      const origin = upPoints[i];
      const dest = upPoints[i + 1];
      
      if (!origin || !dest) continue;
      
      const originX = xScale(distances[origin.junction - 1] || 0);
      const destX = xScale(distances[dest.junction - 1] || 0);
      
      const originLowY = dimensions.height - 40 - yScale(origin.low);
      const originTopY = dimensions.height - 40 - yScale(origin.top);
      const destLowY = dimensions.height - 40 - yScale(dest.low);
      const destTopY = dimensions.height - 40 - yScale(dest.top);
      
      // Check if the line needs to wrap around the cycle time
      const lowWrapsAround = dest.low < origin.low;
      const topWrapsAround = dest.top < origin.top;
      
      if (lowWrapsAround) {
        // Draw first part: from origin to cycle end
        const cycleEndY = dimensions.height - 40 - yScale(cycleTime);
        // Calculate slope for the first segment
        const slope = (destLowY - originLowY) / (destX - originX);
        // Calculate X where line crosses cycle end
        const xAtCycleEnd = originX + (cycleEndY - originLowY) / slope;
        
        lines.push(
          <line
            key={`up-low-part1-${i}`}
            x1={originX}
            y1={originLowY}
            x2={xAtCycleEnd}
            y2={cycleEndY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
        
        // Draw second part: from cycle start to destination
        const cycleStartY = dimensions.height - 40 - yScale(0);
        
        lines.push(
          <line
            key={`up-low-part2-${i}`}
            x1={xAtCycleEnd}
            y1={cycleStartY}
            x2={destX}
            y2={destLowY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      } else {
        // Draw direct line
        lines.push(
          <line
            key={`up-low-${i}`}
            x1={originX}
            y1={originLowY}
            x2={destX}
            y2={destLowY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      }
      
      // Draw top line with same logic
      if (topWrapsAround) {
        // Draw first part: from origin to cycle end
        const cycleEndY = dimensions.height - 40 - yScale(cycleTime);
        const slope = (destTopY - originTopY) / (destX - originX);
        const xAtCycleEnd = originX + (cycleEndY - originTopY) / slope;
        
        lines.push(
          <line
            key={`up-top-part1-${i}`}
            x1={originX}
            y1={originTopY}
            x2={xAtCycleEnd}
            y2={cycleEndY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
        
        // Draw second part: from cycle start to destination
        const cycleStartY = dimensions.height - 40 - yScale(0);
        
        lines.push(
          <line
            key={`up-top-part2-${i}`}
            x1={xAtCycleEnd}
            y1={cycleStartY}
            x2={destX}
            y2={destTopY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      } else {
        // Draw direct line
        lines.push(
          <line
            key={`up-top-${i}`}
            x1={originX}
            y1={originTopY}
            x2={destX}
            y2={destTopY}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      }
    }
    
    // Draw downstream diagonal lines
    for (let i = 0; i < downPoints.length - 1; i++) {
      const origin = downPoints[i];
      const dest = downPoints[i + 1];
      
      if (!origin || !dest) continue;
      
      const originX = xScale(distances[origin.junction - 1] || 0);
      const destX = xScale(distances[dest.junction - 1] || 0);
      
      const originLowY = dimensions.height - 40 - yScale(origin.low);
      const originTopY = dimensions.height - 40 - yScale(origin.top);
      const destLowY = dimensions.height - 40 - yScale(dest.low);
      const destTopY = dimensions.height - 40 - yScale(dest.top);
      
      // Check if the line needs to wrap around the cycle time
      const lowWrapsAround = dest.low < origin.low;
      const topWrapsAround = dest.top < origin.top;
      
      if (lowWrapsAround) {
        // Draw first part: from origin to cycle end
        const cycleEndY = dimensions.height - 40 - yScale(cycleTime);
        
        // Fix: Calculate correct slope for downstream
        // For downstream, we need to make sure the line has correct slope
        // and intersects with the cycle boundary at the right point
        const totalDistance = originX - destX; // X distance between points
        const totalTime = (cycleTime - origin.low) + dest.low; // Total time including wrap
        
        // Calculate proper slope (rise over run)
        const slope = totalTime / totalDistance;
        
        // Calculate where line intersects with cycle time
        const distanceToIntersection = (cycleTime - origin.low) / slope;
        const xAtCycleEnd = originX - distanceToIntersection;
        
        console.log(`Downstream low wrap calculation for points ${i}->${i+1}:`, {
          origin: { x: originX, y: originLowY, time: origin.low },
          dest: { x: destX, y: destLowY, time: dest.low },
          totalDistance,
          totalTime,
          slope,
          distanceToIntersection,
          xAtCycleEnd
        });
        
        // Draw line from origin to cycle boundary
        lines.push(
          <line
            key={`down-low-part1-${i}`}
            x1={originX}
            y1={originLowY}
            x2={xAtCycleEnd}
            y2={cycleEndY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
        
        // Draw second part: from cycle start (at same X) to destination
        const cycleStartY = dimensions.height - 40 - yScale(0);
        
        lines.push(
          <line
            key={`down-low-part2-${i}`}
            x1={xAtCycleEnd}
            y1={cycleStartY}
            x2={destX}
            y2={destLowY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      } else {
        // Draw direct line if no wrapping
        lines.push(
          <line
            key={`down-low-${i}`}
            x1={originX}
            y1={originLowY}
            x2={destX}
            y2={destLowY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      }
      
      // Same logic for top line
      if (topWrapsAround) {
        // Draw first part: from origin to cycle end
        const cycleEndY = dimensions.height - 40 - yScale(cycleTime);
        
        // Fix: Calculate correct slope for downstream
        const totalDistance = originX - destX;
        const totalTime = (cycleTime - origin.top) + dest.top;
        
        // Calculate proper slope
        const slope = totalTime / totalDistance;
        
        // Calculate where line intersects with cycle time
        const distanceToIntersection = (cycleTime - origin.top) / slope;
        const xAtCycleEnd = originX - distanceToIntersection;
        
        console.log(`Downstream top wrap calculation for points ${i}->${i+1}:`, {
          origin: { x: originX, y: originTopY, time: origin.top },
          dest: { x: destX, y: destTopY, time: dest.top },
          totalDistance,
          totalTime,
          slope,
          distanceToIntersection,
          xAtCycleEnd
        });
        
        // Draw line from origin to cycle boundary
        lines.push(
          <line
            key={`down-top-part1-${i}`}
            x1={originX}
            y1={originTopY}
            x2={xAtCycleEnd}
            y2={cycleEndY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
        
        // Draw second part: from cycle start to destination
        const cycleStartY = dimensions.height - 40 - yScale(0);
        
        lines.push(
          <line
            key={`down-top-part2-${i}`}
            x1={xAtCycleEnd}
            y1={cycleStartY}
            x2={destX}
            y2={destTopY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      } else {
        // Draw direct line if no wrapping
        lines.push(
          <line
            key={`down-top-${i}`}
            x1={originX}
            y1={originTopY}
            x2={destX}
            y2={destTopY}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      }
    }
    
    // Draw band boxes between each pair of intersections
    if (pairs_band_points) {
      pairs_band_points.forEach((pair, index) => {
        if (!pair || !results.local_up || !results.local_down) return;
        
        const fromIdx = pair.from_junction - 1;
        const toIdx = pair.to_junction - 1;
        
        const fromX = xScale(distances[fromIdx] || 0);
        const toX = xScale(distances[toIdx] || 0);
        
        // Create upstream bandwidth box (if there is bandwidth)
        const upBandwidth = results.local_up[index] || 0;
        if (upBandwidth > 0) {
          const { origin_low, origin_high, dest_low, dest_high } = pair.up;
          
          // Colors based on bandwidth quality
          const maxBW = 45; // Assuming a cycle time of 90 seconds, half would be max
          const colorRatio = 1 - Math.min(upBandwidth / maxBW, 1); // 0 = good (green), 1 = bad (red)
          const color = getInterpolatedColor(colorRatio);
          
          const originLowY = dimensions.height - 40 - yScale(origin_low);
          const originHighY = dimensions.height - 40 - yScale(origin_high);
          const destLowY = dimensions.height - 40 - yScale(dest_low);
          const destHighY = dimensions.height - 40 - yScale(dest_high);
          
          // Handle case where band wraps around cycle
          const wrapsAround = dest_low < origin_low || dest_high < origin_high;
          
          if (wrapsAround) {
            // TODO: Implement proper rendering for wrapped bands
            console.log(`Upstream band ${index} wraps around cycle`);
          } else {
            // Regular trapezoid
            const points = `${fromX},${originLowY} ${fromX},${originHighY} ${toX},${destHighY} ${toX},${destLowY}`;
            
            bandBoxes.push(
              <polygon
                key={`up-band-${index}`}
                points={points}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeWidth={1}
              />
            );
          }
        }
        
        // Create downstream bandwidth box
        const downBandwidth = results.local_down[index] || 0;
        if (downBandwidth > 0) {
          const { origin_low, origin_high, dest_low, dest_high } = pair.down;
          
          // Colors based on bandwidth quality
          const maxBW = 45; // Assuming a cycle time of 90 seconds, half would be max
          const colorRatio = 1 - Math.min(downBandwidth / maxBW, 1); // 0 = good (green), 1 = bad (red)
          const color = getInterpolatedColor(colorRatio);
          
          const originLowY = dimensions.height - 40 - yScale(origin_low);
          const originHighY = dimensions.height - 40 - yScale(origin_high);
          const destLowY = dimensions.height - 40 - yScale(dest_low);
          const destHighY = dimensions.height - 40 - yScale(dest_high);
          
          // Handle case where band wraps around cycle
          const wrapsAround = dest_low < origin_low || dest_high < origin_high;
          
          if (wrapsAround) {
            // Log the wrap around case for debugging
            console.log(`Downstream band ${index} wraps around cycle:`, {
              origin_low, origin_high, dest_low, dest_high,
              bandwidth: downBandwidth
            });
            
            // For now, we'll skip rendering these until we implement proper handling
            // TODO: Add proper rendering for wrapped bands
          } else {
            // Regular trapezoid for non-wrapped bands
            const points = `${fromX},${originLowY} ${fromX},${originHighY} ${toX},${destHighY} ${toX},${destLowY}`;
            
            bandBoxes.push(
              <polygon
                key={`down-band-${index}`}
                points={points}
                fill={color}
                fillOpacity={0.3}
                stroke={color}
                strokeWidth={1}
              />
            );
          }
        }
      });
    }
    
    // Return all elements
    return (
      <>
        {bandBoxes}
        {lines}
      </>
    );
  };

  const handleTooltipEnter = (event: React.MouseEvent, content: string) => {
    setTooltip({
      visible: true,
      content: content,
      position: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  const handleTooltipLeave = () => {
    setTooltip({
      visible: false,
      content: '',
      position: {
        x: 0,
        y: 0,
      },
    });
  };

  const canvasWidth = dimensions.width - 80;

  return (
    <>
      <CardHeader>
        <CardTitle>{title || 'Green Wave Diagram'}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div ref={chartRef} className="w-full h-[600px]">
          <svg
            width={dimensions.width}
            height={dimensions.height}
            className="green-wave-chart"
          >
            {/* Background */}
            <rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill="#f9fafb"
              rx={4}
            />
            
            {/* Grid lines */}
            {renderGridLines()}
            
            {/* Cycle time boundary line */}
            <line
              x1={40}
              y1={dimensions.height - 40 - yScale(cycleTime)}
              x2={dimensions.width - 40}
              y2={dimensions.height - 40 - yScale(cycleTime)}
              stroke="#000"
              strokeWidth={1}
            />
            
            {/* Diagrams */}
            {renderDiagonalLines()}
            {renderIntersections()}
            
            {/* Legends */}
            <g transform={`translate(50, 60)`}>
              <line
                x1={0}
                y1={0}
                x2={20}
                y2={0}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text x={25} y={5} className="text-xs fill-gray-700">
                Upstream Diagonal
              </text>
              
              <line
                x1={0}
                y1={20}
                x2={20}
                y2={20}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text x={25} y={25} className="text-xs fill-gray-700">
                Downstream Diagonal
              </text>
            </g>
            
            {/* Speed info */}
            {speed && (
              <text
                x={dimensions.width - 150}
                y={60}
                className="text-sm fill-gray-700 font-medium"
              >
                Design Speed: {speed} km/h
              </text>
            )}
          </svg>
        </div>
        
        {tooltip.visible && (
          <GreenWaveTooltip
            content={tooltip.content}
            position={tooltip.position}
          />
        )}
      </CardContent>
    </>
  );
};

export default GreenWaveChart;
