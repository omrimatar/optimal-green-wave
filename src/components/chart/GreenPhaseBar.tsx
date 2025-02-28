
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
    return null;
  }

  const normalizeTime = (time: number): number => {
    return ((time % maxTime) + maxTime) % maxTime;
  };
  
  return payload.greenPhases.map((phase: GreenPhase, phaseIndex: number) => {
    const scaleFactor = height / maxTime;
    const adjustedStart = normalizeTime(
      mode === 'display' ? 
        phase.startTime : // In display mode, don't apply offset
        phase.startTime + (payload.offset || 0) // In calculate or manual mode, apply offset
    );
    
    const adjustedWidth = width * 0.3;
    const startX = x + (phaseIndex * width * 0.35);
    
    // חישוב זמן הסיום כולל נירמול
    const endTime = normalizeTime(adjustedStart + phase.duration);
    const wrapsAround = endTime < adjustedStart;

    if (!wrapsAround) {
      // מקרה רגיל - אין חריגה מזמן המחזור
      return (
        <Rectangle 
          key={`phase-${phaseIndex}`}
          x={startX} 
          y={y + height - (adjustedStart + phase.duration) * scaleFactor} 
          width={adjustedWidth} 
          height={phase.duration * scaleFactor} 
          fill={phase.direction === 'upstream' ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />
      );
    } else {
      // פיצול לשני מלבנים במקרה של חריגה מזמן המחזור
      const firstPartDuration = maxTime - adjustedStart;
      const secondPartDuration = phase.duration - firstPartDuration;

      return [
        // החלק הראשון - מזמן ההתחלה ועד סוף המחזור
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
        // החלק השני - מתחילת המחזור
        <Rectangle 
          key={`phase-${phaseIndex}-2`}
          x={startX} 
          y={y + height - secondPartDuration * scaleFactor} 
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
