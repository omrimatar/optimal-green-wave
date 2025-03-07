
import React, { useEffect, useRef, useState } from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";
import { type PairBandPoint } from "@/types/traffic";

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
  pairBandPoints?: PairBandPoint[];
  calculationPerformed?: boolean;
}

export const GreenWaveChart: React.FC<GreenWaveChartProps> = ({ 
  intersections,
  mode,
  speed,
  pairBandPoints,
  calculationPerformed = false
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
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

  useEffect(() => {
    console.log("GreenWaveChart received intersections:", intersections);
    console.log("GreenWaveChart mode:", mode);
    console.log("GreenWaveChart speed:", speed);
    console.log("GreenWaveChart pairBandPoints:", pairBandPoints);
  }, [intersections, mode, speed, pairBandPoints]);

  const maxDistance = Math.max(...intersections.map(i => i.distance));
  const maxCycleTime = Math.max(...intersections.map(i => i.cycleTime));
  
  useEffect(() => {
    console.log("Computed maxDistance:", maxDistance);
    console.log("Computed maxCycleTime:", maxCycleTime);
  }, [maxDistance, maxCycleTime]);

  const xScale = (value: number) => (value / maxDistance) * (dimensions.width - 120);
  const yScale = (value: number) => (value / maxCycleTime) * (dimensions.height - 80);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const width = chartRef.current.clientWidth;
        const height = Math.min(600, Math.max(500, width * 0.5)); // Responsive height, but not too tall
        setDimensions({
          width: width,
          height: height
        });
      }
    };

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

  const generateYGridLines = () => {
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

  const renderDiagonalLines = () => {
    if (!calculationPerformed || !pairBandPoints || pairBandPoints.length === 0) {
      return null;
    }

    return pairBandPoints.map((pair, index) => {
      const originIdx = intersections.findIndex(i => i.id === pair.from_junction);
      const destIdx = intersections.findIndex(i => i.id === pair.to_junction);

      if (originIdx < 0 || destIdx < 0) {
        console.warn(`Could not find intersections for pair: ${pair.from_junction} -> ${pair.to_junction}`);
        return null;
      }

      const originX = 40 + xScale(intersections[originIdx].distance);
      const destX = 40 + xScale(intersections[destIdx].distance);
      const lines = [];

      const handleBoundaryCrossing = (
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number, 
        direction: 'up' | 'down', 
        lineType: 'low' | 'high', 
        description: string
      ) => {
        const chartTopY = 40; // Top boundary Y coordinate
        const chartBottomY = dimensions.height - 40; // Bottom boundary Y coordinate
        
        const slope = direction === 'up' ? 
          (y2 - y1) / (x2 - x1) : // Upstream: positive slope
          (y1 - y2) / (x1 - x2);  // Downstream: positive slope but reversed direction
        
        const actualSlope = direction === 'up' ? slope : -slope;
        
        console.log(`Line ${direction} ${lineType}: Slope = ${actualSlope}`);
        
        if ((y1 < chartTopY && y2 > chartTopY) || (y1 > chartTopY && y2 < chartTopY)) {
          let xAtTop;
          
          if (direction === 'up') {
            xAtTop = x1 + (chartTopY - y1) / slope;
          } else {
            xAtTop = x1 - (chartTopY - y1) / slope;
          }
          
          lines.push(
            <line
              key={`${direction}-${lineType}-top1-${index}`}
              x1={x1}
              y1={y1}
              x2={xAtTop}
              y2={chartTopY}
              stroke={direction === 'up' ? "#4ADE80" : "#60A5FA"}
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: {direction === 'up' ? 'עם הזרם' : 'נגד הזרם'}</p>
                    <p>{direction === 'up' ? `מצומת ${pair.from_junction} לצומת ${pair.to_junction}` : 
                          `מצומת ${pair.to_junction} לצומת ${pair.from_junction}`}</p>
                    <p>נקודה {lineType === 'low' ? 'תחתונה' : 'עליונה'} - חלק 1 ({description})</p>
                    <p>שיפוע: {Math.abs(actualSlope).toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          lines.push(
            <line
              key={`${direction}-${lineType}-top2-${index}`}
              x1={xAtTop}
              y1={chartBottomY}
              x2={x2}
              y2={y2}
              stroke={direction === 'up' ? "#4ADE80" : "#60A5FA"}
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: {direction === 'up' ? 'עם הזרם' : 'נגד הזרם'}</p>
                    <p>{direction === 'up' ? `מצומת ${pair.from_junction} לצומת ${pair.to_junction}` : 
                          `מצומת ${pair.to_junction} לצומת ${pair.from_junction}`}</p>
                    <p>נקודה {lineType === 'low' ? 'תחתונה' : 'עליונה'} - חלק 2 ({description})</p>
                    <p>שיפוע: {Math.abs(actualSlope).toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          return true;
        }
        
        if ((y1 < chartBottomY && y2 > chartBottomY) || (y1 > chartBottomY && y2 < chartBottomY)) {
          let xAtBottom;
          
          if (direction === 'up') {
            xAtBottom = x1 + (chartBottomY - y1) / slope;
          } else {
            xAtBottom = x1 - (chartBottomY - y1) / slope;
          }
          
          lines.push(
            <line
              key={`${direction}-${lineType}-bottom1-${index}`}
              x1={x1}
              y1={y1}
              x2={xAtBottom}
              y2={chartBottomY}
              stroke={direction === 'up' ? "#4ADE80" : "#60A5FA"}
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: {direction === 'up' ? 'עם הזרם' : 'נגד הזרם'}</p>
                    <p>{direction === 'up' ? `מצומת ${pair.from_junction} לצומת ${pair.to_junction}` : 
                          `מצומת ${pair.to_junction} לצומת ${pair.from_junction}`}</p>
                    <p>נקודה {lineType === 'low' ? 'תחתונה' : 'עליונה'} - חלק 1 ({description})</p>
                    <p>שיפוע: {Math.abs(actualSlope).toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          lines.push(
            <line
              key={`${direction}-${lineType}-bottom2-${index}`}
              x1={xAtBottom}
              y1={chartTopY}
              x2={x2}
              y2={y2}
              stroke={direction === 'up' ? "#4ADE80" : "#60A5FA"}
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: {direction === 'up' ? 'עם הזרם' : 'נגד הזרם'}</p>
                    <p>{direction === 'up' ? `מצומת ${pair.from_junction} לצומת ${pair.to_junction}` : 
                          `מצומת ${pair.to_junction} לצומת ${pair.from_junction}`}</p>
                    <p>נקודה {lineType === 'low' ? 'תחתונה' : 'עליונה'} - חלק 2 ({description})</p>
                    <p>שיפוע: {Math.abs(actualSlope).toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          return true;
        }
        
        return false;
      };

      // Check if upstream bandwidth is positive before drawing upstream lines
      const upstreamBandwidth = pair.up.dest_high - pair.up.dest_low;
      console.log(`Checking upstream bandwidth for ${pair.from_junction}->${pair.to_junction}: ${upstreamBandwidth}`);
      
      if (upstreamBandwidth > 0) {
        const upOriginLowY = dimensions.height - 40 - yScale(pair.up.origin_low);
        const upOriginHighY = dimensions.height - 40 - yScale(pair.up.origin_high);
        const upDestLowY = dimensions.height - 40 - yScale(pair.up.dest_low);
        const upDestHighY = dimensions.height - 40 - yScale(pair.up.dest_high);

        console.log(`Drawing upstream lines for ${pair.from_junction}->${pair.to_junction} with bandwidth: ${upstreamBandwidth.toFixed(2)}`);

        if (!handleBoundaryCrossing(originX, upOriginLowY, destX, upDestLowY, 'up', 'low', 'קו תחתון')) {
          const slope = (upDestLowY - upOriginLowY) / (destX - originX);
          console.log(`Upstream low line slope: ${slope}`);
          
          lines.push(
            <line
              key={`up-low-${index}`}
              x1={originX}
              y1={upOriginLowY}
              x2={destX}
              y2={upDestLowY}
              stroke="#4ADE80"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: עם הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                    <p>נקודה תחתונה</p>
                    <p>שיפוע: {Math.abs(slope).toFixed(2)}</p>
                    <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }

        if (!handleBoundaryCrossing(originX, upOriginHighY, destX, upDestHighY, 'up', 'high', 'קו עליון')) {
          const slope = (upDestHighY - upOriginHighY) / (destX - originX);
          console.log(`Upstream high line slope: ${slope}`);
          
          lines.push(
            <line
              key={`up-high-${index}`}
              x1={originX}
              y1={upOriginHighY}
              x2={destX}
              y2={upDestHighY}
              stroke="#4ADE80"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: עם הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                    <p>נקודה עליונה</p>
                    <p>שיפוע: {Math.abs(slope).toFixed(2)}</p>
                    <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }
      } else {
        console.log(`Skipping upstream lines for ${pair.from_junction}->${pair.to_junction} due to zero or negative bandwidth: ${upstreamBandwidth}`);
      }

      // Check if downstream bandwidth is positive before drawing downstream lines
      const downstreamBandwidth = pair.down.dest_high - pair.down.dest_low;
      console.log(`Checking downstream bandwidth for ${pair.to_junction}->${pair.from_junction}: ${downstreamBandwidth}`);
      
      if (downstreamBandwidth > 0) {
        const downOriginLowY = dimensions.height - 40 - yScale(pair.down.origin_low);
        const downOriginHighY = dimensions.height - 40 - yScale(pair.down.origin_high);
        const downDestLowY = dimensions.height - 40 - yScale(pair.down.dest_low);
        const downDestHighY = dimensions.height - 40 - yScale(pair.down.dest_high);
        
        console.log(`Drawing downstream lines for ${pair.to_junction}->${pair.from_junction} with bandwidth: ${downstreamBandwidth.toFixed(2)}`);
        console.log(`Downstream low line: (${destX}, ${downOriginLowY}) to (${originX}, ${downDestLowY})`);
        
        if (!handleBoundaryCrossing(destX, downOriginLowY, originX, downDestLowY, 'down', 'low', 'קו תחתון')) {
          const slope = (downOriginLowY - downDestLowY) / (destX - originX);
          console.log(`Downstream low line slope: ${slope}`);
          
          if (slope >= 0) {
            console.warn("WARNING: Downstream low line has incorrect slope (vehicles moving backward in time)");
          }
          
          lines.push(
            <line
              key={`down-low-${index}`}
              x1={destX}
              y1={downOriginLowY}
              x2={originX}
              y2={downDestLowY}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                    <p>נקודה תחתונה</p>
                    <p>שיפוע: {Math.abs(slope).toFixed(2)}</p>
                    <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }

        if (!handleBoundaryCrossing(destX, downOriginHighY, originX, downDestHighY, 'down', 'high', 'קו עליון')) {
          const slope = (downOriginHighY - downDestHighY) / (destX - originX);
          console.log(`Downstream high line slope: ${slope}`);
          
          if (slope >= 0) {
            console.warn("WARNING: Downstream high line has incorrect slope (vehicles moving backward in time)");
          }
          
          lines.push(
            <line
              key={`down-high-${index}`}
              x1={destX}
              y1={downOriginHighY}
              x2={originX}
              y2={downDestHighY}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                    <p>נקודה עליונה</p>
                    <p>שיפוע: {Math.abs(slope).toFixed(2)}</p>
                    <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }
      } else {
        console.log(`Skipping downstream lines for ${pair.to_junction}->${pair.from_junction} due to zero or negative bandwidth: ${downstreamBandwidth}`);
      }

      return lines;
    });
  };

  return (
    <>
      <CardHeader>
        <CardTitle>תרשים גל ירוק - {mode === 'manual' ? 'מצב ידני' : mode === 'calculate' ? 'אופטימיזציה' : 'מצב קיים'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" ref={chartRef}>
          <svg 
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible w-full"
          >
            {generateYGridLines()}
            {generateXGridLines()}
            
            <line 
              x1={60} 
              y1={40} 
              x2={60} 
              y2={dimensions.height - 40} 
              stroke="black" 
              strokeWidth={1} 
            />
            <line 
              x1={60} 
              y1={dimensions.height - 40} 
              x2={dimensions.width - 60} 
              y2={dimensions.height - 40} 
              stroke="black" 
              strokeWidth={1} 
            />

            {renderDiagonalLines()}

            {intersections.map((intersection, i) => {
              const offset = mode === 'display' ? 0 : (intersection.offset || 0);
              
              console.log(`Rendering intersection ${i+1} (ID: ${intersection.id}):`);
              console.log(`  Distance: ${intersection.distance}m`);
              console.log(`  Cycle Time: ${intersection.cycleTime}s`);
              console.log(`  Offset: ${offset}s`);
              console.log(`  Green Phases:`, intersection.greenPhases);
              
              return intersection.greenPhases.map((phase, j) => {
                const x = 40 + xScale(intersection.distance);
                const xOffset = phase.direction === 'upstream' ? -10 : 10;
                
                let startTime = (phase.startTime + offset) % intersection.cycleTime;
                let endTime = (startTime + phase.duration) % intersection.cycleTime;
                
                if (endTime === 0) endTime = intersection.cycleTime;
                
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

            {Array.from({ length: 5 }).map((_, i) => {
              const value = (maxCycleTime / 4) * i;
              const y = dimensions.height - 40 - yScale(value);
              return (
                <g key={`y-tick-${i}`}>
                  <line 
                    x1={55} 
                    y1={y} 
                    x2={60} 
                    y2={y} 
                    stroke="black" 
                    strokeWidth={1} 
                  />
                  <text 
                    x={50} 
                    y={y - 10} 
                    textAnchor="end" 
                    fontSize={12}
                  >
                    {Math.round(value)}
                  </text>
                </g>
              );
            })}

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

            <g transform={`translate(${dimensions.width - 100}, 20)`}>
              <rect x={0} y={0} width={20} height={10} fill="#A7F3D0" rx={2} />
              <text x={24} y={8} fontSize={10}>עם הזרם</text>
              <rect x={0} y={15} width={20} height={10} fill="#93C5FD" rx={2} />
              <text x={24} y={23} fontSize={10}>נגד הזרם</text>
            </g>
          </svg>
          
          {tooltipInfo.visible && (
            <GreenWaveTooltip
              x={tooltipInfo.x}
              y={tooltipInfo.y}
              content={tooltipInfo.content}
            />
          )}
        </div>
      </CardContent>
    </>
  );
};
