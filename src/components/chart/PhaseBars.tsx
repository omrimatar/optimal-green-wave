
import React from 'react';
import { GreenPhaseBar } from '../GreenPhaseBar';
import { type Intersection } from "@/types/optimization";

interface PhaseBarsProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  xScale: (value: number) => number;
  yScale: (value: number) => number;
  chartHeight: number;
  onShowTooltip: (x: number, y: number, content: React.ReactNode) => void;
  onHideTooltip: () => void;
}

export const PhaseBars: React.FC<PhaseBarsProps> = ({
  intersections,
  mode,
  xScale,
  yScale,
  chartHeight,
  onShowTooltip,
  onHideTooltip
}) => {
  return (
    <>
      {intersections.map((intersection, i) => {
        // Get the offset for this intersection (0 if in display mode)
        const offset = mode === 'display' ? 0 : (intersection.offset || 0);
        
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
                chartHeight={chartHeight}
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
                  onShowTooltip(e.clientX, e.clientY, content);
                }}
                onMouseLeave={onHideTooltip}
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
                  chartHeight={chartHeight}
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
                    onShowTooltip(e.clientX, e.clientY, content);
                  }}
                  onMouseLeave={onHideTooltip}
                />
              )}
            </React.Fragment>
          );
        });
      })}
    </>
  );
};
