
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
  const [isMobile, setIsMobile] = useState(false);

  const leftPadding = isMobile ? 65 : 85;
  const originX = leftPadding + 25;
  const rightPadding = isMobile ? 80 : 110;

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

  const maxDistance = Math.max(...intersections.map(i => i.distance));
  const maxCycleTime = Math.max(...intersections.map(i => i.cycleTime));
  
  useEffect(() => {
    console.log("Computed maxDistance:", maxDistance);
    console.log("Computed maxCycleTime:", maxCycleTime);
  }, [maxDistance, maxCycleTime]);

  const xScale = (value: number) => (value / maxDistance) * (dimensions.width - leftPadding - rightPadding);
  const yScale = (value: number) => (value / maxCycleTime) * (dimensions.height - (isMobile ? 60 : 80));

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const width = chartRef.current.clientWidth;
        const heightRatio = isMobileDevice() ? 0.7 : 0.5;
        const height = Math.min(600, Math.max(300, width * heightRatio));
        
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
        const upOriginLowY = dimensions.height - 40 - yScale(pair.up.origin_low);
        const upOriginHighY = dimensions.height - 40 - yScale(pair.up.origin_high);
        const upDestLowY = dimensions.height - 40 - yScale(pair.up.dest_low);
        const upDestHighY = dimensions.height - 40 - yScale(pair.up.dest_high);
        
        const upLowWrapsAround = pair.up.dest_low < pair.up.origin_low;
        const upHighWrapsAround = pair.up.dest_high < pair.up.origin_high;

        console.log(`Upstream low line: origin=${pair.up.origin_low.toFixed(2)}, dest=${pair.up.dest_low.toFixed(2)}, wraps=${upLowWrapsAround}`);
        console.log(`Upstream high line: origin=${pair.up.origin_high.toFixed(2)}, dest=${pair.up.dest_high.toFixed(2)}, wraps=${upHighWrapsAround}`);
        
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
              stroke="#4ADE80CC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              stroke="#4ADE80CC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              stroke="#4ADE80CC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              stroke="#4ADE80CC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              stroke="#4ADE80CC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              stroke="#4ADE80CC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
      } else {
        console.log(`Skipping upstream lines for ${pair.from_junction}->${pair.to_junction} due to zero or negative bandwidth: ${upstreamBandwidth}`);
      }

      if (downstreamBandwidth > 0) {
        const downOriginLowY = dimensions.height - 40 - yScale(pair.down.origin_low);
        const downOriginHighY = dimensions.height - 40 - yScale(pair.down.origin_high);
        const downDestLowY = dimensions.height - 40 - yScale(pair.down.dest_low);
        const downDestHighY = dimensions.height - 40 - yScale(pair.down.dest_high);
        
        const downLowWrapsAround = pair.down.dest_low < pair.down.origin_low;
        const downHighWrapsAround = pair.down.dest_high < pair.down.origin_high;
        
        console.log(`Downstream low line: origin=${pair.down.origin_low.toFixed(2)}, dest=${pair.down.dest_low.toFixed(2)}, wraps=${downLowWrapsAround}`);
        console.log(`Downstream high line: origin=${pair.down.origin_high.toFixed(2)}, dest=${pair.down.dest_high.toFixed(2)}, wraps=${downHighWrapsAround}`);
        
        if (downLowWrapsAround) {
          const totalTimeDiff = cycleTime - pair.down.origin_low + pair.down.dest_low;
          const timeToCycleEnd = cycleTime - pair.down.origin_low;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          const distanceToTravel = originX - destX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = destX + distanceToCycleEnd;
          
          const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const downCycleStartY = dimensions.height - 40 - yScale(0);
          
          console.log(`Downstream wrap calculation for low line:`, {
            totalTimeDiff,
            timeToCycleEnd,
            proportionToCycleEnd,
            distanceToTravel,
            distanceToCycleEnd,
            xAtCycleEnd,
            downOriginLowY,
            downCycleEndY,
            downCycleStartY,
            downDestLowY
          });
          
          lines.push(
            <line
              key={`down-low-part1-${index}`}
              x1={destX}
              y1={downOriginLowY}
              x2={xAtCycleEnd}
              y2={downCycleEndY}
              stroke="#60A5FACC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              x1={xAtCycleEnd}
              y1={downCycleStartY}
              x2={originX}
              y2={downDestLowY}
              stroke="#60A5FACC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              x1={destX}
              y1={downOriginLowY}
              x2={originX}
              y2={downDestLowY}
              stroke="#60A5FACC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
        
        if (downHighWrapsAround) {
          const totalTimeDiff = cycleTime - pair.down.origin_high + pair.down.dest_high;
          const timeToCycleEnd = cycleTime - pair.down.origin_high;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          const distanceToTravel = originX - destX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = destX + distanceToCycleEnd;
          
          const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const downCycleStartY = dimensions.height - 40 - yScale(0);
          
          console.log(`Downstream wrap calculation for high line:`, {
            totalTimeDiff,
            timeToCycleEnd,
            proportionToCycleEnd,
            distanceToTravel,
            distanceToCycleEnd,
            xAtCycleEnd,
            downOriginHighY,
            downCycleEndY,
            downCycleStartY,
            downDestHighY
          });
          
          lines.push(
            <line
              key={`down-high-part1-${index}`}
              x1={destX}
              y1={downOriginHighY}
              x2={xAtCycleEnd}
              y2={downCycleEndY}
              stroke="#60A5FACC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              x1={xAtCycleEnd}
              y1={downCycleStartY}
              x2={originX}
              y2={downDestHighY}
              stroke="#60A5FACC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
              x1={destX}
              y1={downOriginHighY}
              x2={originX}
              y2={downDestHighY}
              stroke="#60A5FACC"
              strokeWidth={2}
              strokeDasharray="6 3"
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
      } else {
        console.log(`Skipping downstream lines for ${pair.to_junction}->${pair.from_junction} due to zero or negative bandwidth: ${downstreamBandwidth}`);
      }

      return lines;
    });
  };

  const renderSolidDiagonalLines = () => {
    if (!calculationPerformed || !comparisonResults || !comparisonResults.diagonal_points) {
      return null;
    }

    const { up, down } = comparisonResults.diagonal_points;
    const lines = [];

    if (up && up.length > 1) {
      for (let i = 0; i < up.length - 1; i++) {
        const startPoint = up[i];
        const endPoint = up[i + 1];
        
        const startJunctionIdx = intersections.findIndex(inter => inter.id === startPoint.junction);
        const endJunctionIdx = intersections.findIndex(inter => inter.id === endPoint.junction);
        
        if (startJunctionIdx < 0 || endJunctionIdx < 0) continue;
        
        const startX = leftPadding + 25 + xScale(intersections[startJunctionIdx].distance);
        const endX = leftPadding + 25 + xScale(intersections[endJunctionIdx].distance);
        const startLowY = dimensions.height - 40 - yScale(startPoint.low);
        const endLowY = dimensions.height - 40 - yScale(endPoint.low);
        const startTopY = dimensions.height - 40 - yScale(startPoint.top);
        const endTopY = dimensions.height - 40 - yScale(endPoint.top);
        
        lines.push(
          <line
            key={`solid-up-low-${startPoint.junction}-${endPoint.junction}`}
            x1={startX}
            y1={startLowY}
            x2={endX}
            y2={endLowY}
            stroke="#4ADE80"
            strokeWidth={2}
            onMouseEnter={(e) => {
              const content = (
                <div>
                  <p>כיוון: עם הזרם</p>
                  <p>מצומת {startPoint.junction} לצומת {endPoint.junction}</p>
                  <p>קו תחתון</p>
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          />
        );
        
        lines.push(
          <line
            key={`solid-up-top-${startPoint.junction}-${endPoint.junction}`}
            x1={startX}
            y1={startTopY}
            x2={endX}
            y2={endTopY}
            stroke="#4ADE80"
            strokeWidth={2}
            onMouseEnter={(e) => {
              const content = (
                <div>
                  <p>כיוון: עם הזרם</p>
                  <p>מצומת {startPoint.junction} לצומת {endPoint.junction}</p>
                  <p>קו עליון</p>
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          />
        );
      }
    }
    
    if (down && down.length > 1) {
      for (let i = 0; i < down.length - 1; i++) {
        const startPoint = down[i];
        const endPoint = down[i + 1];
        
        const startJunctionIdx = intersections.findIndex(inter => inter.id === startPoint.junction);
        const endJunctionIdx = intersections.findIndex(inter => inter.id === endPoint.junction);
        
        if (startJunctionIdx < 0 || endJunctionIdx < 0) continue;
        
        const startX = leftPadding + 25 + xScale(intersections[startJunctionIdx].distance);
        const endX = leftPadding + 25 + xScale(intersections[endJunctionIdx].distance);
        const startLowY = dimensions.height - 40 - yScale(startPoint.low);
        const endLowY = dimensions.height - 40 - yScale(endPoint.low);
        const startTopY = dimensions.height - 40 - yScale(startPoint.top);
        const endTopY = dimensions.height - 40 - yScale(endPoint.top);
        
        lines.push(
          <line
            key={`solid-down-low-${startPoint.junction}-${endPoint.junction}`}
            x1={startX}
            y1={startLowY}
            x2={endX}
            y2={endLowY}
            stroke="#60A5FA"
            strokeWidth={2}
            onMouseEnter={(e) => {
              const content = (
                <div>
                  <p>כיוון: נגד הזרם</p>
                  <p>מצומת {startPoint.junction} לצומת {endPoint.junction}</p>
                  <p>קו תחתון</p>
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          />
        );
        
        lines.push(
          <line
            key={`solid-down-top-${startPoint.junction}-${endPoint.junction}`}
            x1={startX}
            y1={startTopY}
            x2={endX}
            y2={endTopY}
            stroke="#60A5FA"
            strokeWidth={2}
            onMouseEnter={(e) => {
              const content = (
                <div>
                  <p>כיוון: נגד הזרם</p>
                  <p>מצומת {startPoint.junction} לצומת {endPoint.junction}</p>
                  <p>קו עליון</p>
                </div>
              );
              handleShowTooltip(e.clientX, e.clientY, content);
            }}
            onMouseLeave={handleHideTooltip}
          />
        );
      }
    }

    return lines;
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
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible w-full"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
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

            {renderDiagonalLines && renderDiagonalLines()}
            {renderSolidDiagonalLines && renderSolidDiagonalLines()}

            {intersections.map((intersection, i) => {
              const offset = mode === 'display' ? 0 : (intersection.offset || 0);
              
              console.log(`Rendering intersection ${i+1} (ID: ${intersection.id}):`);
              console.log(`  Distance: ${intersection.distance}m`);
              console.log(`  Cycle Time: ${intersection.cycleTime}s`);
              console.log(`  Offset: ${offset}s`);
              console.log(`  Green Phases:`, intersection.greenPhases);
              
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

            {/* Y-axis labels every 10 seconds */}
            {Array.from({ length: Math.ceil(maxCycleTime / 10) + 1 }).map((_, i) => {
              const value = i * 10;
              const y = dimensions.height - (isMobile ? 30 : 40) - yScale(value);
              return (
                <g key={`y-tick-${i}`}>
                  <line 
                    x1={leftPadding - 5} 
                    y1={y} 
                    x2={leftPadding} 
                    y2={y} 
                    stroke="black" 
                    strokeWidth={1} 
                  />
                  <text 
                    x={leftPadding - (isMobile ? 27 : 30)} 
                    y={y} 
                    textAnchor="end" 
                    fontSize={isMobile ? 10 : 12}
                    dominantBaseline="middle"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels for each 100 meters and intersection locations */}
            {(() => {
              // Create a set of all x-axis label positions to avoid duplicates
              const labelPositions = new Set<number>();
              
              // Add labels every 100 meters up to and including the last intersection
              const lastIntersectionDistance = Math.max(...intersections.map(i => i.distance));
              for (let i = 0; i <= Math.ceil(lastIntersectionDistance / 100); i++) {
                labelPositions.add(i * 100);
              }
              
              // Add labels for each intersection location
              intersections.forEach(intersection => {
                labelPositions.add(intersection.distance);
              });
              
              // Convert to sorted array
              const sortedPositions = Array.from(labelPositions).sort((a, b) => a - b);
              
              return sortedPositions.map(value => {
                const x = originX + xScale(value);
                return (
                  <g key={`x-tick-${value}`}>
                    <line 
                      x1={x} 
                      y1={dimensions.height - (isMobile ? 30 : 40)} 
                      x2={x} 
                      y2={dimensions.height - (isMobile ? 25 : 35)} 
                      stroke="black" 
                      strokeWidth={1} 
                    />
                    <text 
                      x={x} 
                      y={dimensions.height - (isMobile ? 15 : 20)} 
                      textAnchor="middle" 
                      fontSize={isMobile ? 9 : 12}
                    >
                      {isMobile && value > 999 
                        ? `${(value/1000).toFixed(1)}K` 
                        : value}
                    </text>
                  </g>
                );
              });
            })()}

            <text 
              x={dimensions.width / 2} 
              y={dimensions.height - (isMobile ? 3 : 5)} 
              textAnchor="middle" 
              fontSize={isMobile ? 12 : 14}
            >
              מרחק (מטר)
            </text>
            <text 
              x={isMobile ? 10 : 15} 
              y={dimensions.height / 2} 
              textAnchor="middle" 
              fontSize={isMobile ? 12 : 14}
              transform={`rotate(-90 ${isMobile ? 10 : 15} ${dimensions.height / 2})`}
            >
              זמן (שניות)
            </text>
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
