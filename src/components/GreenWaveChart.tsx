<lov-code>
import React, { useEffect, useRef, useState } from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";
import { type PairBandPoint, type RunResult } from "@/types/traffic";

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

  useEffect(() => {
    console.log("GreenWaveChart received intersections:", intersections);
    console.log("GreenWaveChart mode:", mode);
    console.log("GreenWaveChart speed:", speed);
    console.log("GreenWaveChart pairBandPoints:", pairBandPoints);
    console.log("GreenWaveChart comparisonResults:", comparisonResults);
  }, [intersections, mode, speed, pairBandPoints, comparisonResults]);

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

  const renderArrowMarkers = () => {
    return (
      <defs>
        {/* Arrow for upstream lower line (pointing upward) */}
        <marker 
          id="arrow-up" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="2.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,0 L10,5 L5,2.5 Z" fill="#10B981" />
        </marker>
        
        {/* Arrow for upstream upper line (pointing downward) */}
        <marker 
          id="arrow-down" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="7.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,10 L10,5 L5,7.5 Z" fill="#10B981" />
        </marker>
        
        {/* Arrow for downstream lower line (pointing upward) */}
        <marker 
          id="arrow-up-down" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="2.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,0 L10,5 L5,2.5 Z" fill="#3B82F6" />
        </marker>
        
        {/* Arrow for downstream upper line (pointing downward) */}
        <marker 
          id="arrow-down-down" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="7.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,10 L10,5 L5,7.5 Z" fill="#3B82F6" />
        </marker>
      </defs>
    );
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

      const originX = 40 + xScale(intersections[originIdx].distance);
      const destX = 40 + xScale(intersections[destIdx].distance);
      const lines = [];

      const pairIndex = pair.from_junction - 1;
      const upstreamBandwidth = comparisonResults.pair_bandwidth_up?.[pairIndex] || 0;
      const downstreamBandwidth = comparisonResults.pair_bandwidth_down?.[pairIndex] || 0;
      
      console.log(`Rendering diagonal lines for pair ${pair.from_junction}->${pair.to_junction}:`);
      console.log(`Upstream bandwidth: ${upstreamBandwidth}, Downstream bandwidth: ${downstreamBandwidth}`);
      
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
          const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const slope = (upCycleEndY - upOriginLowY) / (destX - originX);
          const xAtCycleEnd = originX + (upCycleEndY - upOriginLowY) / slope;
          
          lines.push(
            <React.Fragment key={`up-low-part1-${index}`}>
              <line
                x1={originX}
                y1={upOriginLowY}
                x2={xAtCycleEnd}
                y2={upCycleEndY}
                stroke="#4ADE80"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-up)"
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
              
              {/* Add arrow in the middle of the line */}
              <line
                x1={(originX + xAtCycleEnd) / 2 - 10}
                y1={(upOriginLowY + upCycleEndY) / 2 - 5}
                x2={(originX + xAtCycleEnd) / 2 + 10}
                y2={(upOriginLowY + upCycleEndY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-up)"
              />
            </React.Fragment>
          );
          
          const upCycleStartY = dimensions.height - 40 - yScale(0);
          
          lines.push(
            <React.Fragment key={`up-low-part2-${index}`}>
              <line
                x1={xAtCycleEnd}
                y1={upCycleStartY}
                x2={destX}
                y2={upDestLowY}
                stroke="#4ADE80"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-up)"
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
              
              {/* Add arrow in the middle of the line */}
              <line
                x1={(xAtCycleEnd + destX) / 2 - 10}
                y1={(upCycleStartY + upDestLowY) / 2 - 5}
                x2={(xAtCycleEnd + destX) / 2 + 10}
                y2={(upCycleStartY + upDestLowY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-up)"
              />
            </React.Fragment>
          );
        } else {
          const midX = (originX + destX) / 2;
          const midY = (upOriginLowY + upDestLowY) / 2;
          
          lines.push(
            <React.Fragment key={`up-low-${index}`}>
              <line
                x1={originX}
                y1={upOriginLowY}
                x2={destX}
                y2={upDestLowY}
                stroke="#4ADE80"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-up)"
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
              
              {/* Add arrow in the middle of the line */}
              <line
                x1={midX - 10}
                y1={midY - 5}
                x2={midX + 10}
                y2={midY + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-up)"
              />
            </React.Fragment>
          );
        }
        
        if (upHighWrapsAround) {
          const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const slope = (upCycleEndY - upOriginHighY) / (destX - originX);
          const xAtCycleEnd = originX + (upCycleEndY - upOriginHighY) / slope;
          
          lines.push(
            <React.Fragment key={`up-high-part1-${index}`}>
              <line
                x1={originX}
                y1={upOriginHighY}
                x2={xAtCycleEnd}
                y2={upCycleEndY}
                stroke="#4ADE80"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-down)"
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
              
              {/* Add arrow in the middle of the line */}
              <line
                x1={(originX + xAtCycleEnd) / 2 - 10}
                y1={(upOriginHighY + upCycleEndY) / 2 - 5}
                x2={(originX + xAtCycleEnd) / 2 + 10}
                y2={(upOriginHighY + upCycleEndY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-down)"
              />
            </React.Fragment>
          );
          
          const upCycleStartY = dimensions.height - 40 - yScale(0);
          
          lines.push(
            <React.Fragment key={`up-high-part2-${index}`}>
              <line
                x1={xAtCycleEnd}
                y1={upCycleStartY}
                x2={destX}
                y2={upDestHighY}
                stroke="#4ADE80"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-down)"
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
              
              {/* Add arrow in the middle of the line */}
              <line
                x1={(xAtCycleEnd + destX) / 2 - 10}
                y1={(upCycleStartY + upDestHighY) / 2 - 5}
                x2={(xAtCycleEnd + destX) / 2 + 10}
                y2={(upCycleStartY + upDestHighY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-down)"
              />
            </React.Fragment>
          );
        } else {
          const midX = (originX + destX) / 2;
          const midY = (upOriginHighY + upDestHighY) / 2;
          
          lines.push(
            <React.Fragment key={`up-high-${index}`}>
              <line
                x1={originX}
                y1={upOriginHighY}
                x2={destX}
                y2={upDestHighY}
                stroke="#4ADE80"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-down)"
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
              
              {/* Add arrow in the middle of the line */}
              <line
                x1={midX - 10}
                y1={midY - 5}
                x2={midX + 10}
                y2={midY + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-down)"
              />
            </React.Fragment>
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
            <React.Fragment key={`down-low-part1-${index}`}>
              <line
                x1={destX}
                y1={downOriginLowY}
                x2={xAtCycleEnd}
                y2={downCycleEndY}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-up-down)"
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
              
              {/* Add arrow in the middle of the line - pointing right to left for downstream */}
              <line
                x1={(destX + xAtCycleEnd) / 2 + 10}
                y1={(downOriginLowY + downCycleEndY) / 2 - 5}
                x2={(destX + xAtCycleEnd) / 2 - 10}
                y2={(downOriginLowY + downCycleEndY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-up-down)"
              />
            </React.Fragment>
          );
          
          lines.push(
            <React.Fragment key={`down-low-part2-${index}`}>
              <line
                x1={xAtCycleEnd}
                y1={downCycleStartY}
                x2={originX}
                y2={downDestLowY}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-up-down)"
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
              
              {/* Add arrow in the middle of the line - pointing right to left for downstream */}
              <line
                x1={(xAtCycleEnd + originX) / 2 + 10}
                y1={(downCycleStartY + downDestLowY) / 2 - 5}
                x2={(xAtCycleEnd + originX) / 2 - 10}
                y2={(downCycleStartY + downDestLowY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-up-down)"
              />
            </React.Fragment>
          );
        } else {
          const midX = (destX + originX) / 2;
          const midY = (downOriginLowY + downDestLowY) / 2;
          
          lines.push(
            <React.Fragment key={`down-low-${index}`}>
              <line
                x1={destX}
                y1={downOriginLowY}
                x2={originX}
                y2={downDestLowY}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-up-down)"
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
              
              {/* Add arrow in the middle of the line - pointing right to left for downstream */}
              <line
                x1={midX + 10}
                y1={midY - 5}
                x2={midX - 10}
                y2={midY + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-up-down)"
              />
            </React.Fragment>
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
            <React.Fragment key={`down-high-part1-${index}`}>
              <line
                x1={destX}
                y1={downOriginHighY}
                x2={xAtCycleEnd}
                y2={downCycleEndY}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-down-down)"
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
              
              {/* Add arrow in the middle of the line - pointing right to left for downstream */}
              <line
                x1={(destX + xAtCycleEnd) / 2 + 10}
                y1={(downOriginHighY + downCycleEndY) / 2 - 5}
                x2={(destX + xAtCycleEnd) / 2 - 10}
                y2={(downOriginHighY + downCycleEndY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-down-down)"
              />
            </React.Fragment>
          );
          
          lines.push(
            <React.Fragment key={`down-high-part2-${index}`}>
              <line
                x1={xAtCycleEnd}
                y1={downCycleStartY}
                x2={originX}
                y2={downDestHighY}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-down-down)"
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
              
              {/* Add arrow in the middle of the line - pointing right to left for downstream */}
              <line
                x1={(xAtCycleEnd + originX) / 2 + 10}
                y1={(downCycleStartY + downDestHighY) / 2 - 5}
                x2={(xAtCycleEnd + originX) / 2 - 10}
                y2={(downCycleStartY + downDestHighY) / 2 + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-down-down)"
              />
            </React.Fragment>
          );
        } else {
          const midX = (destX + originX) / 2;
          const midY = (downOriginHighY + downDestHighY) / 2;
          
          lines.push(
            <React.Fragment key={`down-high-${index}`}>
              <line
                x1={destX}
                y1={downOriginHighY}
                x2={originX}
                y2={downDestHighY}
                stroke="#60A5FA"
                strokeWidth={2}
                strokeDasharray="none"
                markerMid="url(#arrow-down-down)"
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
              
              {/* Add arrow in the middle of the line - pointing right to left for downstream */}
              <line
                x1={midX + 10}
                y1={midY - 5}
                x2={midX - 10}
                y2={midY + 5}
                stroke="none"
                strokeWidth={0}
                markerEnd="url(#arrow-down-down)"
              />
            </React.Fragment>
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
            {renderArrowMarkers
