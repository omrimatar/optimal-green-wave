
import React, { useEffect, useRef, useState } from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";
import { type PairBandPoint, type RunResult, type DiagonalPoint } from "@/types/traffic";
import { isMobileDevice, getMobileScale } from '@/lib/traffic';

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
  const [showLegend, setShowLegend] = useState(true);

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

  const renderLegend = () => {
    if (!showLegend || !calculationPerformed || !pairBandPoints || pairBandPoints.length === 0) {
      return null;
    }

    return (
      <g transform={`translate(${dimensions.width - rightPadding - 240}, 60)`}>
        <rect 
          x={0}
          y={0}
          width={220}
          height={100}
          rx={5}
          ry={5}
          fill="white"
          fillOpacity={0.8}
          stroke="#e5e7eb"
        />
        
        {/* Legend Title */}
        <text x={110} y={20} textAnchor="middle" fontSize={14} fontWeight="bold">
          מקרא
        </text>
        
        {/* Upstream Bandwidth */}
        <rect x={10} y={35} width={20} height={10} fill="#4ADE80" fillOpacity={0.2} stroke="#10B981" />
        <text x={40} y={43} fontSize={12} textAnchor="start">
          רוחב פס בכיוון הזרם (ירוק)
        </text>
        
        {/* Downstream Bandwidth */}
        <rect x={10} y={55} width={20} height={10} fill="#93C5FD" fillOpacity={0.2} stroke="#3B82F6" />
        <text x={40} y={63} fontSize={12} textAnchor="start">
          רוחב פס נגד הזרם (כחול)
        </text>
        
        {/* Phase Bars */}
        <rect x={10} y={75} width={20} height={10} fill="#A7F3D0" stroke="#10B981" />
        <text x={40} y={83} fontSize={12} textAnchor="start">
          מופע ירוק בכיוון הזרם
        </text>
      </g>
    );
  };

  const renderDiagonalLines = () => {
    if (!calculationPerformed || !pairBandPoints || pairBandPoints.length === 0 || !comparisonResults) {
      return null;
    }

    const elements = [];

    pairBandPoints.forEach((pair, index) => {
      const originIdx = intersections.findIndex(i => i.id === pair.from_junction);
      const destIdx = intersections.findIndex(i => i.id === pair.to_junction);

      if (originIdx < 0 || destIdx < 0) {
        console.warn(`Could not find intersections for pair: ${pair.from_junction} -> ${pair.to_junction}`);
        return null;
      }

      const originX = leftPadding + 25 + xScale(intersections[originIdx].distance);
      const destX = leftPadding + 25 + xScale(intersections[destIdx].distance);
      const lines = [];
      const polygons = [];

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
        const upOriginLowY = dimensions.height - 40 - yScale(pair.up.origin_low);
        const upOriginHighY = dimensions.height - 40 - yScale(pair.up.origin_high);
        const upDestLowY = dimensions.height - 40 - yScale(pair.up.dest_low);
        const upDestHighY = dimensions.height - 40 - yScale(pair.up.dest_high);
        
        const upLowWrapsAround = pair.up.dest_low < pair.up.origin_low;
        const upHighWrapsAround = pair.up.dest_high < pair.up.origin_high;

        console.log(`Upstream low line: origin=${pair.up.origin_low.toFixed(2)}, dest=${pair.up.dest_low.toFixed(2)}, wraps=${upLowWrapsAround}`);
        console.log(`Upstream high line: origin=${pair.up.origin_high.toFixed(2)}, dest=${pair.up.dest_high.toFixed(2)}, wraps=${upHighWrapsAround}`);
        
        // Handle polygon creation for upstream direction
        if (!upLowWrapsAround && !upHighWrapsAround) {
          // Simple case - no wrapping around
          polygons.push(
            <polygon
              key={`polygon-up-${index}`}
              points={`${originX},${upOriginLowY} ${destX},${upDestLowY} ${destX},${upDestHighY} ${originX},${upOriginHighY}`}
              fill="#4ADE80"
              fillOpacity="0.2"
              stroke="#10B981"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: עם הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                    <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }
        
        if (upLowWrapsAround) {
          const totalTimeDiff = cycleTime - pair.up.origin_low + pair.up.dest_low;
          const timeToCycleEnd = cycleTime - pair.up.origin_low;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          const distanceToTravel = destX - originX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = originX + distanceToCycleEnd;
          
          const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const upCycleStartY = dimensions.height - 40 - yScale(0);
          
          console.log(`Upstream low wrap calculation:`, {
            totalTimeDiff,
            timeToCycleEnd,
            proportionToCycleEnd,
            distanceToTravel,
            distanceToCycleEnd,
            xAtCycleEnd,
            upOriginLowY,
            upCycleEndY,
            upCycleStartY,
            upDestLowY
          });
          
          lines.push(
            <line
              key={`up-low-part1-${index}`}
              x1={originX}
              y1={upOriginLowY}
              x2={xAtCycleEnd}
              y2={upCycleEndY}
              className="line-groove line-groove-upstream"
              stroke="#10B981"
              strokeWidth={1}
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
              x1={xAtCycleEnd}
              y1={upCycleStartY}
              x2={destX}
              y2={upDestLowY}
              className="line-groove line-groove-upstream"
              stroke="#10B981"
              strokeWidth={1}
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
              x1={originX}
              y1={upOriginLowY}
              x2={destX}
              y2={upDestLowY}
              className="line-groove line-groove-upstream"
              stroke="#10B981"
              strokeWidth={1}
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
        
        if (upHighWrapsAround) {
          const totalTimeDiff = cycleTime - pair.up.origin_high + pair.up.dest_high;
          const timeToCycleEnd = cycleTime - pair.up.origin_high;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          const distanceToTravel = destX - originX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = originX + distanceToCycleEnd;
          
          const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const upCycleStartY = dimensions.height - 40 - yScale(0);
          
          console.log(`Upstream high wrap calculation:`, {
            pair: `${pair.from_junction}->${pair.to_junction}`,
            origin_high: pair.up.origin_high,
            dest_high: pair.up.dest_high,
            totalTimeDiff,
            timeToCycleEnd,
            proportionToCycleEnd,
            distanceToTravel,
            distanceToCycleEnd,
            originX,
            destX,
            xAtCycleEnd,
            upOriginHighY,
            upCycleEndY,
            upCycleStartY,
            upDestHighY
          });
          
          lines.push(
            <line
              key={`up-high-part1-${index}`}
              x1={originX}
              y1={upOriginHighY}
              x2={xAtCycleEnd}
              y2={upCycleEndY}
              className="line-ridge line-ridge-upstream"
              stroke="#10B981"
              strokeWidth={1}
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
              x1={xAtCycleEnd}
              y1={upCycleStartY}
              x2={destX}
              y2={upDestHighY}
              className="line-ridge line-ridge-upstream"
              stroke="#10B981"
              strokeWidth={1}
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
              x1={originX}
              y1={upOriginHighY}
              x2={destX}
              y2={upDestHighY}
              className="line-ridge line-ridge-upstream"
              stroke="#10B981"
              strokeWidth={1}
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
        
        // Handle polygon for wrapped cases in upstream direction
        if (upLowWrapsAround || upHighWrapsAround) {
          if (upLowWrapsAround && upHighWrapsAround) {
            // Both lines wrap around
            const lowTotalTimeDiff = cycleTime - pair.up.origin_low + pair.up.dest_low;
            const lowTimeToCycleEnd = cycleTime - pair.up.origin_low;
            const lowProportionToCycleEnd = lowTimeToCycleEnd / lowTotalTimeDiff;
            const lowDistanceToCycleEnd = (destX - originX) * lowProportionToCycleEnd;
            const lowXAtCycleEnd = originX + lowDistanceToCycleEnd;
            
            const highTotalTimeDiff = cycleTime - pair.up.origin_high + pair.up.dest_high;
            const highTimeToCycleEnd = cycleTime - pair.up.origin_high;
            const highProportionToCycleEnd = highTimeToCycleEnd / highTotalTimeDiff;
            const highDistanceToCycleEnd = (destX - originX) * highProportionToCycleEnd;
            const highXAtCycleEnd = originX + highDistanceToCycleEnd;
            
            const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
            const upCycleStartY = dimensions.height - 40 - yScale(0);
            
            // First part (from origin to cycle end)
            polygons.push(
              <polygon
                key={`polygon-up-part1-${index}`}
                points={`${originX},${upOriginLowY} ${lowXAtCycleEnd},${upCycleEndY} ${highXAtCycleEnd},${upCycleEndY} ${originX},${upOriginHighY}`}
                fill="#4ADE80"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 1 (עד סוף המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            // Second part (from cycle start to dest)
            polygons.push(
              <polygon
                key={`polygon-up-part2-${index}`}
                points={`${lowXAtCycleEnd},${upCycleStartY} ${destX},${upDestLowY} ${destX},${upDestHighY} ${highXAtCycleEnd},${upCycleStartY}`}
                fill="#4ADE80"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 2 (מתחילת המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else if (upLowWrapsAround) {
            // Only low line wraps around
            const lowTotalTimeDiff = cycleTime - pair.up.origin_low + pair.up.dest_low;
            const lowTimeToCycleEnd = cycleTime - pair.up.origin_low;
            const lowProportionToCycleEnd = lowTimeToCycleEnd / lowTotalTimeDiff;
            const lowDistanceToCycleEnd = (destX - originX) * lowProportionToCycleEnd;
            const lowXAtCycleEnd = originX + lowDistanceToCycleEnd;
            
            const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
            const upCycleStartY = dimensions.height - 40 - yScale(0);
            
            // First part (from origin to cycle end)
            polygons.push(
              <polygon
                key={`polygon-up-low-wrap-part1-${index}`}
                points={`${originX},${upOriginLowY} ${lowXAtCycleEnd},${upCycleEndY} ${lowXAtCycleEnd},${upCycleEndY} ${originX},${upOriginHighY}`}
                fill="#4ADE80"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 1 (עד סוף המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            // Second part (from cycle start to dest)
            polygons.push(
              <polygon
                key={`polygon-up-low-wrap-part2-${index}`}
                points={`${lowXAtCycleEnd},${upCycleStartY} ${destX},${upDestLowY} ${destX},${upDestHighY} ${lowXAtCycleEnd},${upCycleStartY}`}
                fill="#4ADE80"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 2 (מתחילת המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else if (upHighWrapsAround) {
            // Only high line wraps around
            const highTotalTimeDiff = cycleTime - pair.up.origin_high + pair.up.dest_high;
            const highTimeToCycleEnd = cycleTime - pair.up.origin_high;
            const highProportionToCycleEnd = highTimeToCycleEnd / highTotalTimeDiff;
            const highDistanceToCycleEnd = (destX - originX) * highProportionToCycleEnd;
            const highXAtCycleEnd = originX + highDistanceToCycleEnd;
            
            const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
            const upCycleStartY = dimensions.height - 40 - yScale(0);
            
            // First part (from origin to cycle end)
            polygons.push(
              <polygon
                key={`polygon-up-high-wrap-part1-${index}`}
                points={`${originX},${upOriginLowY} ${originX},${upOriginHighY} ${highXAtCycleEnd},${upCycleEndY} ${highXAtCycleEnd},${upCycleEndY}`}
                fill="#4ADE80"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 1 (עד סוף המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            // Second part (from cycle start to dest)
            polygons.push(
              <polygon
                key={`polygon-up-high-wrap-part2-${index}`}
                points={`${highXAtCycleEnd},${upCycleStartY} ${destX},${upDestLowY} ${destX},${upDestHighY} ${highXAtCycleEnd},${upCycleStartY}`}
                fill="#4ADE80"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: עם הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {upstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 2 (מתחילת המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          }
        }
      }

      // Handle downstream diagonal lines and polygons
      if (downstreamBandwidth > 0) {
        // Implement downstream direction (similar to upstream but with different colors)
        const downOriginLowY = dimensions.height - 40 - yScale(pair.down.origin_low);
        const downOriginHighY = dimensions.height - 40 - yScale(pair.down.origin_high);
        const downDestLowY = dimensions.height - 40 - yScale(pair.down.dest_low);
        const downDestHighY = dimensions.height - 40 - yScale(pair.down.dest_high);
        
        const downLowWrapsAround = pair.down.dest_low < pair.down.origin_low;
        const downHighWrapsAround = pair.down.dest_high < pair.down.origin_high;

        console.log(`Downstream low line: origin=${pair.down.origin_low.toFixed(2)}, dest=${pair.down.dest_low.toFixed(2)}, wraps=${downLowWrapsAround}`);
        console.log(`Downstream high line: origin=${pair.down.origin_high.toFixed(2)}, dest=${pair.down.dest_high.toFixed(2)}, wraps=${downHighWrapsAround}`);
        
        // Handle polygon creation for downstream direction
        if (!downLowWrapsAround && !downHighWrapsAround) {
          // Simple case - no wrapping around
          polygons.push(
            <polygon
              key={`polygon-down-${index}`}
              points={`${originX},${downOriginLowY} ${destX},${downDestLowY} ${destX},${downDestHighY} ${originX},${downOriginHighY}`}
              fill="#93C5FD"
              fillOpacity="0.2"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                    <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }
        
        if (downLowWrapsAround) {
          const totalTimeDiff = cycleTime - pair.down.origin_low + pair.down.dest_low;
          const timeToCycleEnd = cycleTime - pair.down.origin_low;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          const distanceToTravel = destX - originX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = originX + distanceToCycleEnd;
          
          const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const downCycleStartY = dimensions.height - 40 - yScale(0);
          
          console.log(`Downstream low wrap calculation:`, {
            totalTimeDiff,
            timeToCycleEnd,
            proportionToCycleEnd,
            distanceToTravel,
            distanceToCycleEnd,
            xAtCycleEnd
          });
          
          lines.push(
            <line
              key={`down-low-part1-${index}`}
              x1={originX}
              y1={downOriginLowY}
              x2={xAtCycleEnd}
              y2={downCycleEndY}
              className="line-groove line-groove-downstream"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
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
              x1={xAtCycleEnd}
              y1={downCycleStartY}
              x2={destX}
              y2={downDestLowY}
              className="line-groove line-groove-downstream"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
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
              x1={originX}
              y1={downOriginLowY}
              x2={destX}
              y2={downDestLowY}
              className="line-groove line-groove-downstream"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
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
        
        if (downHighWrapsAround) {
          const totalTimeDiff = cycleTime - pair.down.origin_high + pair.down.dest_high;
          const timeToCycleEnd = cycleTime - pair.down.origin_high;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          const distanceToTravel = destX - originX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = originX + distanceToCycleEnd;
          
          const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const downCycleStartY = dimensions.height - 40 - yScale(0);
          
          console.log(`Downstream high wrap calculation:`, {
            pair: `${pair.from_junction}->${pair.to_junction}`,
            origin_high: pair.down.origin_high,
            dest_high: pair.down.dest_high,
            totalTimeDiff,
            timeToCycleEnd,
            proportionToCycleEnd,
            distanceToTravel,
            distanceToCycleEnd,
            xAtCycleEnd
          });
          
          lines.push(
            <line
              key={`down-high-part1-${index}`}
              x1={originX}
              y1={downOriginHighY}
              x2={xAtCycleEnd}
              y2={downCycleEndY}
              className="line-ridge line-ridge-downstream"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
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
              x1={xAtCycleEnd}
              y1={downCycleStartY}
              x2={destX}
              y2={downDestHighY}
              className="line-ridge line-ridge-downstream"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
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
              x1={originX}
              y1={downOriginHighY}
              x2={destX}
              y2={downDestHighY}
              className="line-ridge line-ridge-downstream"
              stroke="#3B82F6"
              strokeWidth={1}
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
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
        
        // Handle polygon for wrapped cases in downstream direction
        if (downLowWrapsAround || downHighWrapsAround) {
          if (downLowWrapsAround && downHighWrapsAround) {
            // Both lines wrap around
            const lowTotalTimeDiff = cycleTime - pair.down.origin_low + pair.down.dest_low;
            const lowTimeToCycleEnd = cycleTime - pair.down.origin_low;
            const lowProportionToCycleEnd = lowTimeToCycleEnd / lowTotalTimeDiff;
            const lowDistanceToCycleEnd = (destX - originX) * lowProportionToCycleEnd;
            const lowXAtCycleEnd = originX + lowDistanceToCycleEnd;
            
            const highTotalTimeDiff = cycleTime - pair.down.origin_high + pair.down.dest_high;
            const highTimeToCycleEnd = cycleTime - pair.down.origin_high;
            const highProportionToCycleEnd = highTimeToCycleEnd / highTotalTimeDiff;
            const highDistanceToCycleEnd = (destX - originX) * highProportionToCycleEnd;
            const highXAtCycleEnd = originX + highDistanceToCycleEnd;
            
            const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
            const downCycleStartY = dimensions.height - 40 - yScale(0);
            
            // First part (from origin to cycle end)
            polygons.push(
              <polygon
                key={`polygon-down-part1-${index}`}
                points={`${originX},${downOriginLowY} ${lowXAtCycleEnd},${downCycleEndY} ${highXAtCycleEnd},${downCycleEndY} ${originX},${downOriginHighY}`}
                fill="#93C5FD"
                fillOpacity="0.2"
                stroke="#3B82F6"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 1 (עד סוף המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            // Second part (from cycle start to dest)
            polygons.push(
              <polygon
                key={`polygon-down-part2-${index}`}
                points={`${lowXAtCycleEnd},${downCycleStartY} ${destX},${downDestLowY} ${destX},${downDestHighY} ${highXAtCycleEnd},${downCycleStartY}`}
                fill="#93C5FD"
                fillOpacity="0.2"
                stroke="#3B82F6"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 2 (מתחילת המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else if (downLowWrapsAround) {
            // Only low line wraps around
            const lowTotalTimeDiff = cycleTime - pair.down.origin_low + pair.down.dest_low;
            const lowTimeToCycleEnd = cycleTime - pair.down.origin_low;
            const lowProportionToCycleEnd = lowTimeToCycleEnd / lowTotalTimeDiff;
            const lowDistanceToCycleEnd = (destX - originX) * lowProportionToCycleEnd;
            const lowXAtCycleEnd = originX + lowDistanceToCycleEnd;
            
            const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
            const downCycleStartY = dimensions.height - 40 - yScale(0);
            
            polygons.push(
              <polygon
                key={`polygon-down-low-wrap-part1-${index}`}
                points={`${originX},${downOriginLowY} ${lowXAtCycleEnd},${downCycleEndY} ${lowXAtCycleEnd},${downCycleEndY} ${originX},${downOriginHighY}`}
                fill="#93C5FD"
                fillOpacity="0.2"
                stroke="#3B82F6"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 1 (עד סוף המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            polygons.push(
              <polygon
                key={`polygon-down-low-wrap-part2-${index}`}
                points={`${lowXAtCycleEnd},${downCycleStartY} ${destX},${downDestLowY} ${destX},${downDestHighY} ${lowXAtCycleEnd},${downCycleStartY}`}
                fill="#93C5FD"
                fillOpacity="0.2"
                stroke="#3B82F6" 
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 2 (מתחילת המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          } else if (downHighWrapsAround) {
            // Only high line wraps around
            const highTotalTimeDiff = cycleTime - pair.down.origin_high + pair.down.dest_high;
            const highTimeToCycleEnd = cycleTime - pair.down.origin_high;
            const highProportionToCycleEnd = highTimeToCycleEnd / highTotalTimeDiff;
            const highDistanceToCycleEnd = (destX - originX) * highProportionToCycleEnd;
            const highXAtCycleEnd = originX + highDistanceToCycleEnd;
            
            const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
            const downCycleStartY = dimensions.height - 40 - yScale(0);
            
            polygons.push(
              <polygon
                key={`polygon-down-high-wrap-part1-${index}`}
                points={`${originX},${downOriginLowY} ${originX},${downOriginHighY} ${highXAtCycleEnd},${downCycleEndY} ${highXAtCycleEnd},${downCycleEndY}`}
                fill="#93C5FD"
                fillOpacity="0.2"
                stroke="#3B82F6"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 1 (עד סוף המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
            
            polygons.push(
              <polygon
                key={`polygon-down-high-wrap-part2-${index}`}
                points={`${highXAtCycleEnd},${downCycleStartY} ${destX},${downDestLowY} ${destX},${downDestHighY} ${highXAtCycleEnd},${downCycleStartY}`}
                fill="#93C5FD"
                fillOpacity="0.2"
                stroke="#3B82F6"
                strokeWidth={1}
                onMouseEnter={(e) => {
                  const content = (
                    <div>
                      <p>כיוון: נגד הזרם</p>
                      <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                      <p>רוחב פס: {downstreamBandwidth.toFixed(2)}</p>
                      <p>חלק 2 (מתחילת המחזור)</p>
                    </div>
                  );
                  handleShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={handleHideTooltip}
              />
            );
          }
        }
      }

      // Handle multiple elements in the return statement
      polygons.forEach(polygon => elements.push(polygon));
      lines.forEach(line => elements.push(line));
    });

    return elements;
  };

  const renderIntersections = () => {
    return intersections.map((intersection, index) => {
      const x = originX + xScale(intersection.distance);
      const barWidth = 15;

      // Convert greenPhases to sorted phases with adjusted offsets
      let phases = [...(intersection.greenPhases || [])];
      const adjustedOffset = intersection.offset || 0;

      // Process each phase to handle offset and cycle time wrapping
      const processedPhases = phases.map((phase, phaseIndex) => {
        // Adjust start time by the offset
        let adjustedStart = (phase.startTime + adjustedOffset) % intersection.cycleTime;
        let adjustedEnd = (adjustedStart + phase.duration) % intersection.cycleTime;
        
        const wrapsAround = adjustedStart + phase.duration > intersection.cycleTime;
        
        console.log(`  Phase ${phaseIndex + 1}:`);
        console.log(`    Direction: ${phase.direction}`);
        console.log(`    Original Start: ${phase.startTime}s`);
        console.log(`    Duration: ${phase.duration}s`);
        console.log(`    Adjusted Start: ${adjustedStart}s`);
        console.log(`    Adjusted End: ${adjustedEnd}s`);
        console.log(`    Wrapped: ${wrapsAround}`);
        console.log(`    Phase Number: ${phase.phaseNumber || 'N/A'}`);

        return {
          ...phase,
          adjustedStart,
          adjustedEnd,
          wrapsAround
        };
      });
      
      // Render the phases as rectangles
      const phaseElements = processedPhases.map((phase, phaseIndex) => {
        if (phase.wrapsAround) {
          // Phase wraps around the cycle time - render in two parts
          const firstPartDuration = intersection.cycleTime - phase.adjustedStart;
          
          return (
            <React.Fragment key={`phase-${index}-${phaseIndex}`}>
              <GreenPhaseBar
                x={x}
                startTime={phase.adjustedStart}
                endTime={intersection.cycleTime}
                cycleTime={intersection.cycleTime}
                direction={phase.direction}
                barWidth={barWidth}
                yScale={yScale}
                chartHeight={dimensions.height - 40}
                onMouseEnter={handleShowTooltip}
                onMouseLeave={handleHideTooltip}
                isHalfCycle={intersection.useHalfCycleTime}
                phaseNumber={phase.phaseNumber}
              />
              <GreenPhaseBar
                x={x}
                startTime={0}
                endTime={phase.adjustedEnd}
                cycleTime={intersection.cycleTime}
                direction={phase.direction}
                barWidth={barWidth}
                yScale={yScale}
                chartHeight={dimensions.height - 40}
                onMouseEnter={handleShowTooltip}
                onMouseLeave={handleHideTooltip}
                isHalfCycle={intersection.useHalfCycleTime}
                phaseNumber={phase.phaseNumber}
              />
            </React.Fragment>
          );
        } else {
          // Simple case - phase doesn't wrap around
          return (
            <GreenPhaseBar
              key={`phase-${index}-${phaseIndex}`}
              x={x}
              startTime={phase.adjustedStart}
              endTime={phase.adjustedEnd}
              cycleTime={intersection.cycleTime}
              direction={phase.direction}
              barWidth={barWidth}
              yScale={yScale}
              chartHeight={dimensions.height - 40}
              onMouseEnter={handleShowTooltip}
              onMouseLeave={handleHideTooltip}
              isHalfCycle={intersection.useHalfCycleTime}
              phaseNumber={phase.phaseNumber}
            />
          );
        }
      });

      return (
        <g 
          key={`intersection-${intersection.id}`}
          onMouseEnter={(e) => {
            const content = (
              <div className="space-y-1">
                <div><strong>צומת {intersection.id}</strong></div>
                <div>מרחק: {intersection.distance} מ'</div>
                <div>זמן מחזור: {intersection.cycleTime} שניות</div>
                <div>היסט: {intersection.offset || 0} שניות</div>
                {intersection.upstreamSpeed && <div>מהירות כיוון זרם: {intersection.upstreamSpeed} קמ"ש</div>}
                {intersection.downstreamSpeed && <div>מהירות נגד זרם: {intersection.downstreamSpeed} קמ"ש</div>}
                {intersection.useHalfCycleTime && <div>מצב חצי זמן מחזור פעיל</div>}
              </div>
            );
            handleShowTooltip(e.clientX, e.clientY, content);
          }}
          onMouseLeave={handleHideTooltip}
        >
          <line
            x1={x}
            y1={40}
            x2={x}
            y2={dimensions.height - 40}
            stroke={hoveredElement === `intersection-${intersection.id}` ? "#000" : "#ccc"}
            strokeWidth={hoveredElement === `intersection-${intersection.id}` ? 2 : 1}
            strokeDasharray="5 3"
          />
          {phaseElements}
          <circle 
            cx={x} 
            cy={dimensions.height - 40} 
            r={5}
            fill={hoveredElement === `intersection-${intersection.id}` ? "#000" : "#666"}
            onMouseEnter={() => setHoveredElement(`intersection-${intersection.id}`)}
            onMouseLeave={() => setHoveredElement(null)}
          />
          <text
            x={x}
            y={dimensions.height - 45}
            textAnchor="middle"
            fontSize={12}
            fontWeight={hoveredElement === `intersection-${intersection.id}` ? 'bold' : 'normal'}
          >
            {intersection.id}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="border-border" ref={chartRef}>
      <svg
        className="h-auto w-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Chart Grid */}
        {generateYGridLines()}
        {generateXGridLines()}
        
        {/* Diagonal lines showing wave patterns */}
        {renderDiagonalLines()}
        
        {/* Intersection lines with green phase bars */}
        {renderIntersections()}
        
        {/* Axes */}
        <line
          x1={leftPadding}
          y1={dimensions.height - 40}
          x2={dimensions.width - rightPadding}
          y2={dimensions.height - 40}
          stroke="#000"
          strokeWidth={2}
        />
        <line
          x1={leftPadding}
          y1={40}
          x2={leftPadding}
          y2={dimensions.height - 40}
          stroke="#000"
          strokeWidth={2}
        />
        <text
          x={dimensions.width / 2}
          y={dimensions.height - 5}
          textAnchor="middle"
          fontSize={14}
        >
          מרחק (מטרים)
        </text>
        <text
          x={15}
          y={dimensions.height / 2}
          textAnchor="middle"
          fontSize={14}
          transform={`rotate(-90, 15, ${dimensions.height / 2})`}
        >
          זמן (שניות)
        </text>
        
        {/* Axis Labels */}
        {generateXAxisLabels()}
        {generateYAxisLabels()}
        
        {/* Legend */}
        {renderLegend()}
      </svg>
      
      <GreenWaveTooltip
        visible={tooltipInfo.visible}
        x={tooltipInfo.x}
        y={tooltipInfo.y}
        content={tooltipInfo.content}
      />
    </div>
  );
};
