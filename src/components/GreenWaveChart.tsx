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
        {/* Upstream direction arrows */}
        {/* Bottom line arrow - points upward */}
        <marker 
          id="upstream-bottom-arrow" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="2.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,0 L10,5" stroke="#10B981" fill="none" strokeWidth="1.5" />
        </marker>
        
        {/* Top line arrow - points downward */}
        <marker 
          id="upstream-top-arrow" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="7.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,10 L10,5" stroke="#10B981" fill="none" strokeWidth="1.5" />
        </marker>
        
        {/* Downstream direction arrows (opposite direction) */}
        {/* Bottom line arrow - points upward */}
        <marker 
          id="downstream-bottom-arrow" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="2.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,0 L10,5" stroke="#3B82F6" fill="none" strokeWidth="1.5" />
        </marker>
        
        {/* Top line arrow - points downward */}
        <marker 
          id="downstream-top-arrow" 
          markerWidth="10" 
          markerHeight="10" 
          refX="5" 
          refY="7.5" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,5 L5,10 L10,5" stroke="#3B82F6" fill="none" strokeWidth="1.5" />
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
      
      // Upstream lines (green)
      if (upstreamBandwidth > 0) {
        const upOriginLowY = dimensions.height - 40 - yScale(pair.up.origin_low);
        const upOriginHighY = dimensions.height - 40 - yScale(pair.up.origin_high);
        const upDestLowY = dimensions.height - 40 - yScale(pair.up.dest_low);
        const upDestHighY = dimensions.height - 40 - yScale(pair.up.dest_high);
        
        const upLowWrapsAround = pair.up.dest_low < pair.up.origin_low;
        const upHighWrapsAround = pair.up.dest_high < pair.up.origin_high;
        
        console.log(`Upstream low line: origin=${pair.up.origin_low.toFixed(2)}, dest=${pair.up.dest_low.toFixed(2)}, wraps=${upLowWrapsAround}`);
        console.log(`Upstream high line: origin=${pair.up.origin_high.toFixed(2)}, dest=${pair.up.dest_high.toFixed(2)}, wraps=${upHighWrapsAround}`);
        
        // Draw lower boundary line (with upward arrow)
        if (upLowWrapsAround) {
          const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const slope = (upCycleEndY - upOriginLowY) / (destX - originX);
          const xAtCycleEnd = originX + (upCycleEndY - upOriginLowY) / slope;
          
          // First part of wrapped line
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
                markerMid="url(#upstream-bottom-arrow)"
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
            </React.Fragment>
          );
          
          const upCycleStartY = dimensions.height - 40 - yScale(0);
          
          // Second part of wrapped line
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
                markerMid="url(#upstream-bottom-arrow)"
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
            </React.Fragment>
          );
        } else {
          // Non-wrapped line
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
                markerMid="url(#upstream-bottom-arrow)"
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
            </React.Fragment>
          );
        }
        
        // Draw upper boundary line (with downward arrow)
        if (upHighWrapsAround) {
          const upCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const slope = (upCycleEndY - upOriginHighY) / (destX - originX);
          const xAtCycleEnd = originX + (upCycleEndY - upOriginHighY) / slope;
          
          // First part of wrapped line
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
                markerMid="url(#upstream-top-arrow)"
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
            </React.Fragment>
          );
          
          const upCycleStartY = dimensions.height - 40 - yScale(0);
          
          // Second part of wrapped line
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
                markerMid="url(#upstream-top-arrow)"
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
            </React.Fragment>
          );
        } else {
          // Non-wrapped line
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
                markerMid="url(#upstream-top-arrow)"
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
            </React.Fragment>
          );
        }
      } else {
        console.log(`Skipping upstream lines for ${pair.from_junction}->${pair.to_junction} due to zero or negative bandwidth: ${upstreamBandwidth}`);
      }

      // Downstream lines (blue) - in opposite direction
      if (downstreamBandwidth > 0) {
        const downOriginLowY = dimensions.height - 40 - yScale(pair.down.origin_low);
        const downOriginHighY = dimensions.height - 40 - yScale(pair.down.origin_high);
        const downDestLowY = dimensions.height - 40 - yScale(pair.down.dest_low);
        const downDestHighY = dimensions.height - 40 - yScale(pair.down.dest_high);
        
        const downLowWrapsAround = pair.down.dest_low < pair.down.origin_low;
        const downHighWrapsAround = pair.down.dest_high < pair.down.origin_high;
        
        console.log(`Downstream low line: origin=${pair.down.origin_low.toFixed(2)}, dest=${pair.down.dest_low.toFixed(2)}, wraps=${downLowWrapsAround}`);
        console.log(`Downstream high line: origin=${pair.down.origin_high.toFixed(2)}, dest=${pair.down.dest_high.toFixed(2)}, wraps=${downHighWrapsAround}`);
        
        // Draw lower boundary line (with upward arrow)
        if (downLowWrapsAround) {
          const totalTimeDiff = cycleTime - pair.down.origin_low + pair.down.dest_low;
          
          const timeToCycleEnd = cycleTime - pair.down.origin_low;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          
          const distanceToTravel = originX - destX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = destX + distanceToCycleEnd;
          
          const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const downCycleStartY = dimensions.height - 40 - yScale(0);
          
          // First part of wrapped line
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
                markerMid="url(#downstream-bottom-arrow)"
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
            </React.Fragment>
          );
          
          // Second part of wrapped line
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
                markerMid="url(#downstream-bottom-arrow)"
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
            </React.Fragment>
          );
        } else {
          // Non-wrapped line
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
                markerMid="url(#downstream-bottom-arrow)"
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
            </React.Fragment>
          );
        }
        
        // Draw upper boundary line (with downward arrow)
        if (downHighWrapsAround) {
          const totalTimeDiff = cycleTime - pair.down.origin_high + pair.down.dest_high;
          
          const timeToCycleEnd = cycleTime - pair.down.origin_high;
          const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
          
          const distanceToTravel = originX - destX;
          const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
          const xAtCycleEnd = destX + distanceToCycleEnd;
          
          const downCycleEndY = dimensions.height - 40 - yScale(cycleTime);
          const downCycleStartY = dimensions.height - 40 - yScale(0);
          
          // First part of wrapped line
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
                markerMid="url(#downstream-top-arrow)"
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
            </React.Fragment>
          );
          
          // Second part of wrapped line
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
                markerMid="url(#downstream-top-arrow)"
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
            </React.Fragment>
          );
        } else {
          // Non-wrapped line
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
                markerMid="url(#downstream-top-arrow)"
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
            </React.Fragment>
          );
        }
      } else {
        console.log(`Skipping downstream lines for ${pair.to_junction}->${pair.from_junction} due to zero or negative bandwidth: ${downstreamBandwidth}`);
      }

      return lines;
    });
  };

  const renderArrowhead = (
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    color: string,
    direction: 'upstream' | 'downstream'
  ) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    
    return (
      <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
        {direction === 'upstream' ? (
          <ArrowRight size={16} color="#10B981" strokeWidth={2} />
        ) : (
          <ArrowLeft size={16} color="#3B82F6" strokeWidth={2} />
        )}
      </g>
    );
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
            {renderArrowMarkers()}
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
                    y={y} 
                    textAnchor="end" 
                    fontSize={12}
                    dominantBaseline="middle"
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
                    y1={dimensions.height - 
