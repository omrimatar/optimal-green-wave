
import React from 'react';
import { type Intersection } from "@/types/optimization";
import { GreenPhaseBar } from '../GreenPhaseBar';

interface IntersectionPhasesProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  xScale: (value: number) => number;
  yScale: (value: number) => number;
  dimensions: { width: number, height: number };
  handleShowTooltip: (x: number, y: number, content: React.ReactNode) => void;
  handleHideTooltip: () => void;
}

export const IntersectionPhases: React.FC<IntersectionPhasesProps> = ({
  intersections,
  mode,
  xScale,
  yScale,
  dimensions,
  handleShowTooltip,
  handleHideTooltip
}) => {
  return (
    <>
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
    </>
  );
};
