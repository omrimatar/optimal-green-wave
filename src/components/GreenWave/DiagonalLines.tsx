
import React from 'react';
import { type Intersection } from "@/types/optimization";
import { type PairBandPoint } from "@/types/traffic";

interface DiagonalLinesProps {
  pairBandPoints: PairBandPoint[] | undefined;
  intersections: Intersection[];
  maxCycleTime: number;
  dimensions: { width: number, height: number };
  xScale: (value: number) => number;
  yScale: (value: number) => number;
  handleShowTooltip: (x: number, y: number, content: React.ReactNode) => void;
  handleHideTooltip: () => void;
}

export const DiagonalLines: React.FC<DiagonalLinesProps> = ({
  pairBandPoints,
  intersections,
  maxCycleTime,
  dimensions,
  xScale,
  yScale,
  handleShowTooltip,
  handleHideTooltip
}) => {
  if (!pairBandPoints || pairBandPoints.length === 0) {
    return null;
  }

  return (
    <>
      {pairBandPoints.map((pair, index) => {
        const originIdx = intersections.findIndex(i => i.id === pair.from_junction);
        const destIdx = intersections.findIndex(i => i.id === pair.to_junction);

        if (originIdx < 0 || destIdx < 0) {
          console.warn(`Could not find intersections for pair: ${pair.from_junction} -> ${pair.to_junction}`);
          return null;
        }

        const originX = 40 + xScale(intersections[originIdx].distance);
        const destX = 40 + xScale(intersections[destIdx].distance);

        const upLines = [];
        const upOriginLowY = dimensions.height - 40 - yScale(pair.up.origin_low);
        const upOriginHighY = dimensions.height - 40 - yScale(pair.up.origin_high);
        const upDestLowY = dimensions.height - 40 - yScale(pair.up.dest_low);
        const upDestHighY = dimensions.height - 40 - yScale(pair.up.dest_high);

        // Check if low point needs to be wrapped
        if (pair.up.dest_low > maxCycleTime) {
          // Calculate intersection with cycle time boundary
          const ratio = (maxCycleTime - pair.up.origin_low) / (pair.up.dest_low - pair.up.origin_low);
          const intersectX = originX + ratio * (destX - originX);
          
          // Draw first segment to the cycle time boundary
          upLines.push(
            <line
              key={`up-low-part1-${index}`}
              x1={originX}
              y1={upOriginLowY}
              x2={intersectX}
              y2={dimensions.height - 40 - yScale(maxCycleTime)}
              stroke="#4ADE80"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: עם הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                    <p>נקודה תחתונה (חלק 1)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          // Draw second segment from 0 to destination
          upLines.push(
            <line
              key={`up-low-part2-${index}`}
              x1={intersectX}
              y1={dimensions.height - 40 - yScale(0)}
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
                    <p>נקודה תחתונה (חלק 2)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        } else {
          // Normal case - no wrapping needed
          upLines.push(
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
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }

        // Check if high point needs to be wrapped
        if (pair.up.dest_high > maxCycleTime) {
          // Calculate intersection with cycle time boundary
          const ratio = (maxCycleTime - pair.up.origin_high) / (pair.up.dest_high - pair.up.origin_high);
          const intersectX = originX + ratio * (destX - originX);
          
          // Draw first segment to the cycle time boundary
          upLines.push(
            <line
              key={`up-high-part1-${index}`}
              x1={originX}
              y1={upOriginHighY}
              x2={intersectX}
              y2={dimensions.height - 40 - yScale(maxCycleTime)}
              stroke="#4ADE80"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: עם הזרם</p>
                    <p>מצומת {pair.from_junction} לצומת {pair.to_junction}</p>
                    <p>נקודה עליונה (חלק 1)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          // Draw second segment from 0 to destination
          upLines.push(
            <line
              key={`up-high-part2-${index}`}
              x1={intersectX}
              y1={dimensions.height - 40 - yScale(0)}
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
                    <p>נקודה עליונה (חלק 2)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        } else {
          // Normal case - no wrapping needed
          upLines.push(
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
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }

        const downLines = [];
        const downOriginLowY = dimensions.height - 40 - yScale(pair.down.origin_low);
        const downOriginHighY = dimensions.height - 40 - yScale(pair.down.origin_high);
        const downDestLowY = dimensions.height - 40 - yScale(pair.down.dest_low);
        const downDestHighY = dimensions.height - 40 - yScale(pair.down.dest_high);

        // Check if low point needs to be wrapped
        if (pair.down.dest_low > maxCycleTime) {
          // Calculate intersection with cycle time boundary
          const ratio = (maxCycleTime - pair.down.origin_low) / (pair.down.dest_low - pair.down.origin_low);
          const intersectX = destX + ratio * (originX - destX);
          
          // Draw first segment to the cycle time boundary
          downLines.push(
            <line
              key={`down-low-part1-${index}`}
              x1={destX}
              y1={downOriginLowY}
              x2={intersectX}
              y2={dimensions.height - 40 - yScale(maxCycleTime)}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                    <p>נקודה תחתונה (חלק 1)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          // Draw second segment from 0 to destination
          downLines.push(
            <line
              key={`down-low-part2-${index}`}
              x1={intersectX}
              y1={dimensions.height - 40 - yScale(0)}
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
                    <p>נקודה תחתונה (חלק 2)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        } else {
          // Normal case - no wrapping needed
          downLines.push(
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
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }

        // Check if high point needs to be wrapped
        if (pair.down.dest_high > maxCycleTime) {
          // Calculate intersection with cycle time boundary
          const ratio = (maxCycleTime - pair.down.origin_high) / (pair.down.dest_high - pair.down.origin_high);
          const intersectX = destX + ratio * (originX - destX);
          
          // Draw first segment to the cycle time boundary
          downLines.push(
            <line
              key={`down-high-part1-${index}`}
              x1={destX}
              y1={downOriginHighY}
              x2={intersectX}
              y2={dimensions.height - 40 - yScale(maxCycleTime)}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeDasharray="none"
              onMouseEnter={(e) => {
                const content = (
                  <div>
                    <p>כיוון: נגד הזרם</p>
                    <p>מצומת {pair.to_junction} לצומת {pair.from_junction}</p>
                    <p>נקודה עליונה (חלק 1)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
          
          // Draw second segment from 0 to destination
          downLines.push(
            <line
              key={`down-high-part2-${index}`}
              x1={intersectX}
              y1={dimensions.height - 40 - yScale(0)}
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
                    <p>נקודה עליונה (חלק 2)</p>
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        } else {
          // Normal case - no wrapping needed
          downLines.push(
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
                  </div>
                );
                handleShowTooltip(e.clientX, e.clientY, content);
              }}
              onMouseLeave={handleHideTooltip}
            />
          );
        }

        return [...upLines, ...downLines];
      })}
    </>
  );
};
