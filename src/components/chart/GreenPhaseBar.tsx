
import { Rectangle } from 'recharts';
import { GreenPhase } from '../../types/optimization';

interface GreenPhaseBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: any;
  maxTime: number;
  mode: 'display' | 'calculate' | 'manual';
}

export const GreenPhaseBar = (props: GreenPhaseBarProps) => {
  const { x, y, width, height, payload, maxTime, mode } = props;
  
  if (!payload.greenPhases || !Array.isArray(payload.greenPhases)) {
    console.log("No green phases found in payload:", payload);
    return null;
  }

  const normalizeTime = (time: number): number => {
    return ((time % maxTime) + maxTime) % maxTime;
  };
  
  return payload.greenPhases.map((phase: GreenPhase, phaseIndex: number) => {
    const scaleFactor = height / maxTime;
    // Calculate adjusted start time with offset
    const phaseStart = normalizeTime(
      mode === 'display' ? 
        phase.startTime : // In display mode, no offset
        (phase.startTime + (payload.offset || 0)) // In calculate or manual modes, add offset
    );
    
    const phaseEnd = normalizeTime(phaseStart + phase.duration);
    
    const adjustedWidth = width * 0.3;
    const startX = x + (phaseIndex * width * 0.35);
    
    // Check if phase wraps around the cycle time
    const wrapsAround = phaseEnd < phaseStart;

    if (!wrapsAround) {
      // Regular case - start to end in same cycle
      return (
        <Rectangle 
          key={`phase-${phaseIndex}`}
          x={startX} 
          y={y + (maxTime - phaseEnd) * scaleFactor} 
          width={adjustedWidth} 
          height={(phaseEnd - phaseStart) * scaleFactor} 
          fill={phase.direction === 'upstream' ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />
      );
    } else {
      // Split into two rectangles when wrapping occurs
      const firstPartDuration = maxTime - phaseStart;
      const secondPartDuration = phaseEnd;

      return [
        // First part - from start time to end of cycle
        <Rectangle 
          key={`phase-${phaseIndex}-1`}
          x={startX} 
          y={y} 
          width={adjustedWidth} 
          height={firstPartDuration * scaleFactor} 
          fill={phase.direction === 'upstream' ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />,
        // Second part - from beginning of cycle
        <Rectangle 
          key={`phase-${phaseIndex}-2`}
          x={startX} 
          y={y + (maxTime - secondPartDuration) * scaleFactor} 
          width={adjustedWidth} 
          height={secondPartDuration * scaleFactor} 
          fill={phase.direction === 'upstream' ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />
      ];
    }
  }).flat();
};
