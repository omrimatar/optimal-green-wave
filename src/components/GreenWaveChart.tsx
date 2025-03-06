import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
}

export const GreenWaveChart: React.FC<GreenWaveChartProps> = ({ 
  intersections,
  mode,
  speed
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: null
  });

  // Log the received intersection data for debugging
  useEffect(() => {
    console.log("GreenWaveChart received intersections:", intersections);
    console.log("GreenWaveChart mode:", mode);
    console.log("GreenWaveChart speed:", speed);
  }, [intersections, mode, speed]);

  // Find maximum distance and cycle time
  const maxDistance = Math.max(...intersections.map(i => i.distance));
  const maxCycleTime = Math.max(...intersections.map(i => i.cycleTime));
  
  // Log computed values
  useEffect(() => {
    console.log("Computed maxDistance:", maxDistance);
    console.log("Computed maxCycleTime:", maxCycleTime);
  }, [maxDistance, maxCycleTime]);

  // Calculate scales
  const xScale = (value: number) => (value / maxDistance) * (dimensions.width - 80);
  const yScale = (value: number) => (value / maxCycleTime) * (dimensions.height - 80);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        // Use parent width, but fixed height
        const width = chartRef.current.clientWidth;
        setDimensions({
          width,
          height: 500
        });
      }
    };

    // Set initial dimensions
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleShowTooltip = (x: number, y: number, content: React.ReactNode) => {
    setTooltipInfo({
      visible: true,
      x,
      y,
      content
    });
  };

  const handleHideTooltip = () => {
    setTooltipInfo(prev => ({ ...prev, visible: false }));
  };

  // Generate grid lines at fixed intervals
  const generateYGridLines = () => {
    const interval = 10; // 10 second intervals
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

  // Generate X grid lines based on intersection distances
  const generateXGridLines = () => {
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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>תרשים גל ירוק - {mode === 'manual' ? 'מצב ידני' : mode === 'calculate' ? 'אופטימיזציה' : 'מצב קיים'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" ref={chartRef}>
          <svg 
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible"
          >
            {/* Grid Lines */}
            {generateYGridLines()}
            {generateXGridLines()}
            
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

            {/* Green Phase Bars - Render these BEFORE the axis labels */}
            {intersections.map((intersection, i) => {
              // Get the offset for this intersection (0 if in display mode)
              const offset = mode === 'display' ? 0 : (intersection.offset || 0);
              
              console.log(`Rendering intersection ${i+1} (ID: ${intersection.id}):`);
              console.log(`  Distance: ${intersection.distance}m`);
              console.log(`  Cycle Time: ${intersection.cycleTime}s`);
              console.log(`  Offset: ${offset}s`);
              console.log(`  Green Phases:`, intersection.greenPhases);
              
              return intersection.greenPhases.map((phase, j) => {
                const x = 40 + xScale(intersection.distance);
                // Add slight left/right offset for aesthetics
                const xOffset = phase.direction === 'upstream' ? -10 : 10;
                
                // Calculate wrap-around if needed
                let startTime = (phase.startTime + offset) % intersection.cycleTime;
                let endTime = (startTime + phase.duration) % intersection.cycleTime;
                
                // If end time wraps around to 0, set it to the cycle time
                if (endTime === 0) endTime = intersection.cycleTime;
                
                // Handle the case where the phase wraps around the cycle
                const wrappedPhase = endTime < startTime;
                
                console.log(`  Phase ${j+1}:`);
                console.log(`    Direction: ${phase.direction}`);
                console.log(`    Original Start: ${phase.startTime}s`);
                console.log(`    Duration: ${phase.duration}s`);
                console.log(`    Adjusted Start: ${startTime}s`);
                console.log(`    Adjusted End: ${wrappedPhase ? intersection.cycleTime : endTime}s`);
                console.log(`    Wrapped: ${wrappedPhase}`);
                
                return (
                  <React.Fragment key={`phase-${i}-${j}`}>
                    <GreenPhaseBar
                      x={x + xOffset}
                      startTime={startTime}
                      endTime={wrappedPhase ? intersection.cycleTime : endTime}
                      cycleTime={intersection.cycleTime}
                      direction={phase.direction}
                      barWidth={15}
                      yScale={yScale}
                      chartHeight={dimensions.height - 40}
                      onMouseEnter={(e) => {
                        const content = (
                          <div>
                            <p>צומת: {intersection.id}</p>
                            <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
                            <p>התחלה: {Math.round(startTime)} שניות</p>
                            <p>סיום: {Math.round(wrappedPhase ? intersection.cycleTime : endTime)} שניות</p>
                            <p>היסט: {Math.round(offset)} שניות</p>
                          </div>
                        );
                        handleShowTooltip(e.clientX, e.clientY, content);
                      }}
                      onMouseLeave={handleHideTooltip}
                    />
                    
                    {/* If the phase wraps around, draw the second part */}
                    {wrappedPhase && (
                      <GreenPhaseBar
                        x={x + xOffset}
                        startTime={0}
                        endTime={endTime}
                        cycleTime={intersection.cycleTime}
                        direction={phase.direction}
                        barWidth={15}
                        yScale={yScale}
                        chartHeight={dimensions.height - 40}
                        onMouseEnter={(e) => {
                          const content = (
                            <div>
                              <p>צומת: {intersection.id}</p>
                              <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
                              <p>התחלה: 0 שניות (המשך)</p>
                              <p>סיום: {Math.round(endTime)} שניות</p>
                              <p>היסט: {Math.round(offset)} שניות</p>
                            </div>
                          );
                          handleShowTooltip(e.clientX, e.clientY, content);
                        }}
                        onMouseLeave={handleHideTooltip}
                      />
                    )}
                  </React.Fragment>
                );
              });
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

            {/* Move Y-axis ticks (labels) AFTER the bars so they render on top */}
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
                    y={y - 10} 
                    textAnchor="end" 
                    fontSize={12}
                  >
                    {Math.round(value)}
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

            {/* Colored bars for upstream/downstream at the top right (mini legend) */}
            <g transform={`translate(${dimensions.width - 90}, 15)`}>
              <rect x={0} y={0} width={20} height={10} fill="#A7F3D0" rx={2} />
              <text x={24} y={8} fontSize={10}>עם הזרם</text>
              <rect x={0} y={15} width={20} height={10} fill="#93C5FD" rx={2} />
              <text x={24} y={23} fontSize={10}>נגד הזרם</text>
            </g>
          </svg>
          
          {/* Tooltip */}
          {tooltipInfo.visible && (
            <GreenWaveTooltip
              x={tooltipInfo.x}
              y={tooltipInfo.y}
              content={tooltipInfo.content}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
