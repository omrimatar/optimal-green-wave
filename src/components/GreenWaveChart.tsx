import React, { useEffect, useRef, useState } from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";
import { type PairBandPoint, type RunResult, type DiagonalPoint } from "@/types/traffic";
import { isMobileDevice, getMobileScale, handleCycleTimeCrossing } from '@/lib/traffic';

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
  pairBandPoints?: PairBandPoint[];
  calculationPerformed?: boolean;
  comparisonResults?: RunResult;
}

export const GreenWaveChart: React.FC<GreenWaveChartProps> = ({ 
  intersections,
  mode,
  speed,
  pairBandPoints,
  calculationPerformed = false,
  comparisonResults
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1800, height: 600 });
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
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const leftPadding = isMobile ? 65 : 85;
  const originX = leftPadding + 25;
  const rightPadding = isMobile ? 80 : 50;

  const yLabelOffset = 20;

  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    console.log("GreenWaveChart received intersections:", intersections);
    console.log("GreenWaveChart mode:", mode);
    console.log("GreenWaveChart speed:", speed);
    console.log("GreenWaveChart pairBandPoints:", pairBandPoints);
    console.log("GreenWaveChart comparisonResults:", comparisonResults);
    console.log("Left padding:", leftPadding);
    console.log("Origin X:", originX);
    console.log("Right padding:", rightPadding);
  }, [intersections, mode, speed, pairBandPoints, comparisonResults, leftPadding, originX, rightPadding]);

  const lastIntersectionDistance = intersections.length > 0 ? 
    intersections[intersections.length - 1].distance : 0;
  const maxDistance = Math.max(...intersections.map(i => i.distance)) + 20;
  const maxCycleTime = Math.max(...intersections.map(i => i.cycleTime));
  
  useEffect(() => {
    console.log("Computed maxDistance:", maxDistance);
    console.log("Last intersection distance:", lastIntersectionDistance);
    console.log("Extended by 20 meters:", lastIntersectionDistance + 20);
    console.log("Computed maxCycleTime:", maxCycleTime);
  }, [maxDistance, lastIntersectionDistance, maxCycleTime]);

  const xScale = (value: number) => (value / maxDistance) * (dimensions.width - leftPadding - rightPadding);
  const yScale = (value: number) => (value / maxCycleTime) * (dimensions.height - (isMobile ? 60 : 80));

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const width = chartRef.current.clientWidth;
        const heightRatio = isMobileDevice() ? 0.5 : 0.4;
        const height = Math.min(550, Math.max(300, width * heightRatio));
        
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
    setHoveredElement(null);
  };

  const generateYAxisLabels = () => {
    const interval = 10;
    const labels = [];
    
    for (let t = 0; t <= maxCycleTime; t += interval) {
      const y = dimensions.height - 40 - yScale(t);
      labels.push(
        <g key={`y-label-${t}`}
          onMouseEnter={(e) => {
            setHoveredElement(`y-label-${t}`);
            const content = (
              <div>
                <p><strong>זמן: {t} שניות</strong></p>
              </div>
            );
            handleShowTooltip(e.clientX, e.clientY, content);
          }}
          onMouseLeave={handleHideTooltip}
        >
          <text
            x={leftPadding - yLabelOffset}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={isMobile ? 10 : 12}
            fill={hoveredElement === `y-label-${t}` ? "#000" : "#6B7280"}
            style={{ fontWeight: hoveredElement === `y-label-${t}` ? 'bold' : 'normal' }}
          >
            {t}
          </text>
          <line 
            x1={leftPadding - 5} 
            y1={y} 
            x2={leftPadding} 
            y2={y} 
            stroke={hoveredElement === `y-label-${t}` ? "#000" : "#6B7280"} 
            strokeWidth={hoveredElement === `y-label-${t}` ? 2 : 1}
          />
        </g>
      );
    }
    return labels;
  };

  const generateXAxisLabels = () => {
    const interval = 100;
    const labels = [];
    
    for (let d = 0; d <= maxDistance; d += interval) {
      const x = originX + xScale(d);
      if (x <= dimensions.width - rightPadding) {
        labels.push(
          <g key={`x-label-${d}`}
            onMouseEnter={(e) => {
              setHoveredElement(`x-label-${d}`);
              const content = (
                <div>
                  <p><strong>מרחק: {d} מטרים</strong></p>
                  {speed && (
                    <p>זמן נסיעה משוער בהינתן מהירות {speed} קמ"ש: {Math.round(d / speed * 3.6)} שניות</p>
                  )}
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          >
            <text
              x={x}
              y={dimensions.height - (isMobile ? 15 : 20)}
              textAnchor="middle"
              fontSize={isMobile ? 10 : 12}
              fill={hoveredElement === `x-label-${d}` ? "#000" : "#6B7280"}
              style={{ fontWeight: hoveredElement === `x-label-${d}` ? 'bold' : 'normal' }}
            >
              {d}
            </text>
            <line 
              x1={x} 
              y1={dimensions.height - 40} 
              x2={x} 
              y2={dimensions.height - 35} 
              stroke={hoveredElement === `x-label-${d}` ? "#000" : "#6B7280"}
              strokeWidth={hoveredElement === `x-label-${d}` ? 2 : 1}
            />
          </g>
        );
      }
    }

    if (intersections.length > 0) {
      const lastIntersectionX = originX + xScale(lastIntersectionDistance);
      
      const isAlreadyLabeled = labels.some(label => {
        const labelKey = label.key;
        if (typeof labelKey === 'string') {
          const distanceMatch = labelKey.match(/x-label-(\d+)/);
          if (distanceMatch && parseInt(distanceMatch[1]) === lastIntersectionDistance) {
            return true;
          }
        }
        return false;
      });
      
      if (!isAlreadyLabeled && lastIntersectionX <= dimensions.width - rightPadding) {
        labels.push(
          <g key={`x-label-${lastIntersectionDistance}`}
            onMouseEnter={(e) => {
              setHoveredElement(`x-label-${lastIntersectionDistance}`);
              const content = (
                <div>
                  <p><strong>מרחק: {lastIntersectionDistance} מטרים</strong></p>
                  {speed && (
                    <p>זמן נסיעה משוער בהינתן מהירות {speed} קמ"ש: {Math.round(lastIntersectionDistance / speed * 3.6)} שניות</p>
                  )}
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          >
            <text
              x={lastIntersectionX}
              y={dimensions.height - (isMobile ? 15 : 20)}
              textAnchor="middle"
              fontSize={isMobile ? 10 : 12}
              fill={hoveredElement === `x-label-${lastIntersectionDistance}` ? "#000" : "#6B7280"}
              style={{ fontWeight: hoveredElement === `x-label-${lastIntersectionDistance}` ? 'bold' : 'normal' }}
            >
              {lastIntersectionDistance}
            </text>
            <line 
              x1={lastIntersectionX} 
              y1={dimensions.height - 40} 
              x2={lastIntersectionX} 
              y2={dimensions.height - 35} 
              stroke={hoveredElement === `x-label-${lastIntersectionDistance}` ? "#000" : "#6B7280"}
              strokeWidth={hoveredElement === `x-label-${lastIntersectionDistance}` ? 2 : 1}
            />
          </g>
        );
      }

      const extendedX = originX + xScale(lastIntersectionDistance + 20);
      if (extendedX <= dimensions.width - rightPadding) {
        labels.push(
          <g key={`x-label-${lastIntersectionDistance + 20}`}
            onMouseEnter={(e) => {
              setHoveredElement(`x-label-${lastIntersectionDistance + 20}`);
              const content = (
                <div>
                  <p><strong>מרחק: {lastIntersectionDistance + 20} מטרים</strong></p>
                  {speed && (
                    <p>זמן נסיעה משוער בהינתן מהירות {speed} קמ"ש: {Math.round((lastIntersectionDistance + 20) / speed * 3.6)} שניות</p>
                  )}
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          >
            <text
              x={extendedX}
              y={dimensions.height - (isMobile ? 15 : 20)}
              textAnchor="middle"
              fontSize={isMobile ? 10 : 12}
              fill={hoveredElement === `x-label-${lastIntersectionDistance + 20}` ? "#000" : "#6B7280"}
              style={{ fontWeight: hoveredElement === `x-label-${lastIntersectionDistance + 20}` ? 'bold' : 'normal' }}
            >
              {lastIntersectionDistance + 20}
            </text>
            <line 
              x1={extendedX} 
              y1={dimensions.height - 40} 
              x2={extendedX} 
              y2={dimensions.height - 35} 
              stroke={hoveredElement === `x-label-${lastIntersectionDistance + 20}` ? "#000" : "#6B7280"}
              strokeWidth={hoveredElement === `x-label-${lastIntersectionDistance + 20}` ? 2 : 1}
            />
          </g>
        );
      }
    }
    
    return labels;
  };

  const generateYGridLines = () => {
    const interval = 10;
    const lines = [];
    for (let t = 0; t <= maxCycleTime; t += interval) {
      const y = dimensions.height - 40 - yScale(t);
      lines.push(
        <line 
          key={`y-grid-${t}`}
          x1={leftPadding} 
          y1={y} 
          x2={dimensions.width - rightPadding} 
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
    const interval = 100;
    const lines = [];
    
    for (let d = 0; d <= maxDistance; d += interval) {
      const x = originX + xScale(d);
      if (x <= dimensions.width - rightPadding) {
        lines.push(
          <line 
            key={`x-grid-${d}`}
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
    }
    return lines;
  };

  const renderDiagonalLines = () => {
    if (!calculationPerformed || !pairBandPoints || pairBandPoints.length === 0 || !comparisonResults) {
      return null;
    }

    return pairBandPoints.map((pair, index) => {
      const originIdx = intersections.findIndex(i => i.id === pair.from_junction);
      const destIdx = intersections.findIndex(i => i.id === pair.to_junction);

      if (originIdx < 0 || destIdx < 0) {
        console.warn(`Could not find intersections for pair: ${pair.from_junction} -> ${pair.to_junction}`);
        return null;
      }

      const originX = leftPadding + 25 + xScale(intersections[originIdx].distance);
      const destX = leftPadding + 25 + xScale(intersections[destIdx].distance);
      const lines = [];

      const pairIndex = pair.from_junction - 1;
      const upstreamBandwidth = comparisonResults.pair_bandwidth_up?.[pairIndex] || 0;
      const downstreamBandwidth = comparisonResults.pair_bandwidth_down?.[pairIndex] || 0;
      
      console.log(`Rendering diagonal lines for pair ${pair.from_junction}->${pair.to_junction}:`);
      console.log(`Upstream bandwidth: ${upstreamBandwidth}, Downstream bandwidth: ${downstreamBandwidth}`);
      console.log(`Upstream data: origin_low=${pair.up.origin_low.toFixed(2)}, origin_high=${pair.up.origin_high.toFixed(2)}, dest_low=${pair.up.dest_low.toFixed(2)}, dest_high=${pair.up.dest_high.toFixed(2)}`);
      console.log(`Downstream data: origin_low=${pair.down.origin_low.toFixed(2)}, origin_high=${pair.down.origin_high.toFixed(2)}, dest_low=${pair.down.dest_low.toFixed(2)}, dest_high=${pair.down.dest_high.toFixed(2)}`);
      
      const cycleTime = Math.max(
        intersections[originIdx].cycleTime || 90,
        intersections[destIdx].cycleTime || 90
      );
      
      if (upstreamBandwidth > 0) {
        const upLowLine = handleCycleTimeCrossing(
          originX, 
          destX, 
          pair.up.origin_low, 
          pair.up.dest_low, 
          cycleTime, 
          yScale, 
          dimensions.height - 40,
          dimensions.width,
          leftPadding,
          rightPadding
        );
        
        if (!upLowLine.outOfBounds) {
          if (upLowLine.wrapsAround) {
            console.log(`Upstream low line wraps around at cycle boundary`);
            lines.push(
              <line
                key={`up-low-part1-${index}`}
                x1={upLowLine.part1.x1}
                y1={upLowLine.part1.y1}
                x2={upLowLine.part1.x2}
                y2={upLowLine.part1.y2}
                className={`line-groove line-groove-upstream ${upLowLine.part1.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>נקודה תחתונה - חלק 1 (עד סוף המחזור)</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            lines.push(
              <line
                key={`up-low-part2-${index}`}
                x1={upLowLine.part2.x1}
                y1={upLowLine.part2.y1}
                x2={upLowLine.part2.x2}
                y2={upLowLine.part2.y2}
                className={`line-groove line-groove-upstream ${upLowLine.part2.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>נקודה תחתונה - חלק 2 (מתחילת המחזור)</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else {
            lines.push(
              <line
                key={`up-low-${index}`}
                x1={upLowLine.full.x1}
                y1={upLowLine.full.y1}
                x2={upLowLine.full.x2}
                y2={upLowLine.full.y2}
                className={`line-groove line-groove-upstream ${upLowLine.full.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>נקודה תחתונה</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          }
        }
        
        const upHighLine = handleCycleTimeCrossing(
          originX, 
          destX, 
          pair.up.origin_high, 
          pair.up.dest_high, 
          cycleTime, 
          yScale, 
          dimensions.height - 40,
          dimensions.width,
          leftPadding,
          rightPadding
        );
        
        if (!upHighLine.outOfBounds) {
          if (upHighLine.wrapsAround) {
            console.log(`Upstream high line wraps around at cycle boundary`);
            lines.push(
              <line
                key={`up-high-part1-${index}`}
                x1={upHighLine.part1.x1}
                y1={upHighLine.part1.y1}
                x2={upHighLine.part1.x2}
                y2={upHighLine.part1.y2}
                className={`line-ridge line-ridge-upstream ${upHighLine.part1.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>נקודה עליונה - חלק 1 (עד סוף המחזור)</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            lines.push(
              <line
                key={`up-high-part2-${index}`}
                x1={upHighLine.part2.x1}
                y1={upHighLine.part2.y1}
                x2={upHighLine.part2.x2}
                y2={upHighLine.part2.y2}
                className={`line-ridge line-ridge-upstream ${upHighLine.part2.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>נקודה עליונה - חלק 2 (מתחילת המחזור)</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else {
            lines.push(
              <line
                key={`up-high-${index}`}
                x1={upHighLine.full.x1}
                y1={upHighLine.full.y1}
                x2={upHighLine.full.x2}
                y2={upHighLine.full.y2}
                className={`line-ridge line-ridge-upstream ${upHighLine.full.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>נקודה עליונה</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          }
        }
      } else {
        console.log(`Skipping upstream lines for ${pair.from_junction}->${pair.to_junction} due to zero or negative bandwidth: ${upstreamBandwidth}`);
      }

      if (downstreamBandwidth > 0) {
        const downLowLine = handleCycleTimeCrossing(
          destX, 
          originX, 
          pair.down.origin_low, 
          pair.down.dest_low, 
          cycleTime, 
          yScale, 
          dimensions.height - 40,
          dimensions.width,
          leftPadding,
          rightPadding
        );
        
        if (!downLowLine.outOfBounds) {
          if (downLowLine.wrapsAround) {
            console.log(`Downstream low line wraps around at cycle boundary`);
            lines.push(
              <line
                key={`down-low-part1-${index}`}
                x1={downLowLine.part1.x1}
                y1={downLowLine.part1.y1}
                x2={downLowLine.part1.x2}
                y2={downLowLine.part1.y2}
                className={`line-groove line-groove-downstream ${downLowLine.part1.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                      <p>נקודה תחתונה - חלק 1 (עד סוף המחזור)</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            lines.push(
              <line
                key={`down-low-part2-${index}`}
                x1={downLowLine.part2.x1}
                y1={downLowLine.part2.y1}
                x2={downLowLine.part2.x2}
                y2={downLowLine.part2.y2}
                className={`line-groove line-groove-downstream ${downLowLine.part2.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                      <p>נקודה תחתונה - חלק 2 (מתחילת המחזור)</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else {
            lines.push(
              <line
                key={`down-low-${index}`}
                x1={downLowLine.full.x1}
                y1={downLowLine.full.y1}
                x2={downLowLine.full.x2}
                y2={downLowLine.full.y2}
                className={`line-groove line-groove-downstream ${downLowLine.full.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                      <p>נקודה תחתונה</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          }
        }
        
        const downHighLine = handleCycleTimeCrossing(
          destX, 
          originX, 
          pair.down.origin_high, 
          pair.down.dest_high, 
          cycleTime, 
          yScale, 
          dimensions.height - 40,
          dimensions.width,
          leftPadding,
          rightPadding
        );
        
        if (!downHighLine.outOfBounds) {
          if (downHighLine.wrapsAround) {
            console.log(`Downstream high line wraps around at cycle boundary`);
            lines.push(
              <line
                key={`down-high-part1-${index}`}
                x1={downHighLine.part1.x1}
                y1={downHighLine.part1.y1}
                x2={downHighLine.part1.x2}
                y2={downHighLine.part1.y2}
                className={`line-ridge line-ridge-downstream ${downHighLine.part1.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                      <p>נקודה עליונה - חלק 1 (עד סוף המחזור)</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            lines.push(
              <line
                key={`down-high-part2-${index}`}
                x1={downHighLine.part2.x1}
                y1={downHighLine.part2.y1}
                x2={downHighLine.part2.x2}
                y2={downHighLine.part2.y2}
                className={`line-ridge line-ridge-downstream ${downHighLine.part2.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                      <p>נקודה עליונה - חלק 2 (מתחילת המחזור)</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else {
            lines.push(
              <line
                key={`down-high-${index}`}
                x1={downHighLine.full.x1}
                y1={downHighLine.full.y1}
                x2={downHighLine.full.x2}
                y2={downHighLine.full.y2}
                className={`line-ridge line-ridge-downstream ${downHighLine.full.isClipped ? 'opacity-50' : ''}`}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                      <p>נקודה עליונה</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          }
        }
      } else {
        console.log(`Skipping downstream lines for ${pair.to_junction}->${pair.from_junction} due to zero or negative bandwidth: ${downstreamBandwidth}`);
      }

      return lines;
    });
  };

  const renderSolidDiagonalLines = () => {
    return null;
  };

  const renderIntersections = () => {
    return intersections.map((intersection, i) => {
      const offset = mode === 'display' ? 0 : (intersection.offset || 0);
      
      console.log(`Rendering intersection ${i+1} (ID: ${intersection.id}):`);
      console.log(`  Distance: ${intersection.distance}m`);
      console.log(`  Cycle Time: ${intersection.cycleTime}s`);
      console.log(`  Offset: ${offset}s`);
      console.log(`  Green Phases:`, intersection.greenPhases);
      console.log(`  UseHalfCycleTime: ${intersection.useHalfCycleTime}`);
      
      return intersection.greenPhases.map((phase, j) => {
        const x = originX + xScale(intersection.distance);
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
        console.log(`    Phase Number: ${phase.phaseNumber || 'N/A'}`);
        
        const phaseElements = [];
        
        phaseElements.push(
          <React.Fragment key={`phase-${i}-${j}-original`}>
            <GreenPhaseBar
              x={x + xOffset}
              startTime={startTime}
              endTime={wrappedPhase ? intersection.cycleTime : endTime}
              cycleTime={intersection.cycleTime}
              direction={phase.direction}
              barWidth={15}
              yScale={yScale}
              chartHeight={dimensions.height - 40}
              onMouseEnter={(e, info) => {
                const content = (
                  <div>
                    <p>צומת: {intersection.id}</p>
                    <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
                    <p>התחלה: {Math.round(startTime)} שניות</p>
                    <p>סיום: {Math.round(wrappedPhase ? intersection.cycleTime : endTime)} שניות</p>
                    <p>היסט: {Math.round(offset)} שניות</p>
                    {phase.phaseNumber && <p>מספר מופע: {phase.phaseNumber}</p>}
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
              phaseNumber={phase.phaseNumber}
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
                onMouseEnter={(e, info) => {
                  const content = (
                    <div>
                      <p>צומת: {intersection.id}</p>
                      <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
                      <p>התחלה: 0 שניות (המשך)</p>
                      <p>סיום: {Math.round(endTime)} שניות</p>
                      <p>היסט: {Math.round(offset)} שניות</p>
                      {phase.phaseNumber && <p>מספר מופע: {phase.phaseNumber}</p>}
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
                phaseNumber={phase.phaseNumber}
              />
            )}
          </React.Fragment>
        );
        
        if (intersection.useHalfCycleTime) {
          const halfCycleTime = intersection.cycleTime / 2;
          let halfCycleStartTime = (startTime + halfCycleTime) % intersection.cycleTime;
          let halfCycleEndTime = (halfCycleStartTime + phase.duration) % intersection.cycleTime;
          
          if (halfCycleEndTime === 0) halfCycleEndTime = intersection.cycleTime;
          
          const halfCycleWrappedPhase = halfCycleEndTime < halfCycleStartTime;
          
          console.log(`  Half-Cycle Phase ${j+1}:`);
          console.log(`    Direction: ${phase.direction}`);
          console.log(`    Half-Cycle Start: ${halfCycleStartTime}s`);
          console.log(`    Half-Cycle End: ${halfCycleWrappedPhase ? intersection.cycleTime : halfCycleEndTime}s`);
          console.log(`    Half-Cycle Wrapped: ${halfCycleWrappedPhase}`);
          
          phaseElements.push(
            <React.Fragment key={`phase-${i}-${j}-half-cycle`}>
              <GreenPhaseBar
                x={x + xOffset}
                startTime={halfCycleStartTime}
                endTime={halfCycleWrappedPhase ? intersection.cycleTime : halfCycleEndTime}
                cycleTime={intersection.cycleTime}
                direction={phase.direction}
                barWidth={15}
                yScale={yScale}
                chartHeight={dimensions.height - 40}
                isHalfCycle={true}
                onMouseEnter={(e, info) => {
                  const content = (
                    <div>
                      <p>צומת: {intersection.id}</p>
                      <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
                      <p>התחלה: {Math.round(halfCycleStartTime)} שניות (מחצית מחזור)</p>
                      <p>סיום: {Math.round(halfCycleWrappedPhase ? intersection.cycleTime : halfCycleEndTime)} שניות</p>
                      <p>היסט: {Math.round(offset)} שניות</p>
                      {phase.phaseNumber && <p>מספר מופע: {phase.phaseNumber}</p>}
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
                phaseNumber={phase.phaseNumber}
              />
              
              {halfCycleWrappedPhase && (
                <GreenPhaseBar
                  x={x + xOffset}
                  startTime={0}
                  endTime={halfCycleEndTime}
                  cycleTime={intersection.cycleTime}
                  direction={phase.direction}
                  barWidth={15}
                  yScale={yScale}
                  chartHeight={dimensions.height - 40}
                  isHalfCycle={true}
                  onMouseEnter={(e, info) => {
                    const content = (
                      <div>
                        <p>צומת: {intersection.id}</p>
                        <p>כיוון: {phase.direction === 'upstream' ? 'עם הזרם' : 'נגד הזרם'}</p>
                        <p>התחלה: 0 שניות (המשך, מחצית מחזור)</p>
                        <p>סיום: {Math.round(halfCycleEndTime)} שניות</p>
                        <p>היסט: {Math.round(offset)} שניות</p>
                        {phase.phaseNumber && <p>מספר מופע: {phase.phaseNumber}</p>}
                      </div>
                    );
                    handleShowTooltip(e.clientX, e.clientY, content);
                  }}
                  onMouseLeave={handleHideTooltip}
                  phaseNumber={phase.phaseNumber}
                />
              )}
            </React.Fragment>
          );
        }
        
        return phaseElements;
      });
    });
  };

  return (
    <>
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between p-3 md:p-6">
        <CardTitle className="text-base md:text-lg mb-2 sm:mb-0">תרשים גל ירוק - {mode === 'manual' ? 'מצב ידני' : mode === 'calculate' ? 'אופטימיזציה' : 'מצב קיים'}</CardTitle>
        
        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-2 md:w-5 md:h-2.5 bg-[#A7F3D0] rounded-sm ml-1 md:ml-2 rtl:mr-2"></div>
            <span className="text-xs">עם הזרם</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-2 md:w-5 md:h-2.5 bg-[#93C5FD] rounded-sm ml-1 md:ml-2 rtl:mr-2"></div>
            <span className="text-xs">נגד הזרם</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 md:w-5 border-t-2 border-[#4ADE80] ml-1 md:ml-2 rtl:mr-2"></div>
            <span className="text-xs">רוחב פס עם הזרם</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 md:w-5 border-t-2 border-[#60A5FA] ml-1 md:ml-2 rtl:mr-2"></div>
            <span className="text-xs">רוחב פס נגד הזרם</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="relative w-full" ref={chartRef}>
          <svg 
            width="100%" 
            height={dimensions.height}
            className="overflow-visible"
            preserveAspectRatio="xMinYMin meet"
          >
            {generateYGridLines()}
            {generateXGridLines()}
            
            <line 
              x1={leftPadding} 
              y1={isMobile ? 30 : 40} 
              x2={leftPadding} 
              y2={dimensions.height - (isMobile ? 30 : 40)} 
              stroke="black" 
              strokeWidth={1} 
            />
            <line 
              x1={leftPadding} 
              y1={dimensions.height - (isMobile ? 30 : 40)} 
              x2={dimensions.width - rightPadding} 
              y2={dimensions.height - (isMobile ? 30 : 40)} 
              stroke="black" 
              strokeWidth={1} 
            />

            {generateYAxisLabels()}
            {generateXAxisLabels()}

            <text
              x={leftPadding - 50 - 10}
              y={dimensions.height / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${leftPadding - 50 - 10}, ${dimensions.height / 2})`}
              fontSize={isMobile ? 12 : 14}
              fill="#4B5563"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p><strong>ציר Y: זמן</strong></p>
                    <p>מציג את זמן המחזור בשניות</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            >
              זמן (שניות)
            </text>
            <text
              x={dimensions.width / 2}
              y={dimensions.height - 5}
              textAnchor="middle"
              fontSize={isMobile ? 12 : 14}
              fill="#4B5563"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p><strong>ציר X: מרחק</strong></p>
                    <p>מציג את המרחק במטרים</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            >
              מרחק (מטרים)
            </text>

            {renderIntersections()}
            
            {renderDiagonalLines()}
            {renderSolidDiagonalLines()}
          </svg>
          
          {tooltipInfo.visible && (
            <GreenWaveTooltip 
              x={tooltipInfo.x} 
              y={tooltipInfo.y} 
              content={tooltipInfo.content}
              isMobile={isMobile}
            />
          )}
        </div>
      </CardContent>
    </>
  );
};
