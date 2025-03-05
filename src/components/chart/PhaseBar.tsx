
import { Rectangle } from 'recharts';
import { GreenPhase } from '@/types/optimization';

interface PhaseBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: any;
  maxTime: number;
  mode: 'display' | 'calculate' | 'manual';
}

export const PhaseBar = (props: PhaseBarProps) => {
  const { x, y, width, height, payload, maxTime, mode } = props;
  
  if (!payload.greenPhases || !Array.isArray(payload.greenPhases)) {
    return null;
  }

  // Normalize time to be within cycle time
  const normalizeTime = (time: number): number => {
    return ((time % maxTime) + maxTime) % maxTime;
  };
  
  return payload.greenPhases.map((phase: GreenPhase, phaseIndex: number) => {
    const scaleFactor = height / maxTime;
    
    // Calculate adjusted start time with offset
    const startTime = normalizeTime(
      mode === 'display' ? 
        phase.startTime : // In display mode, no offset
        (phase.startTime + (payload.offset || 0)) // In calculate or manual modes, add offset
    );
    
    // Calculate end time (normalized)
    const endTime = normalizeTime(startTime + phase.duration);
    
    // Position each bar with a slight offset based on direction
    // Upstream (green) bars to the left, downstream (blue) bars to the right
    const isUpstream = phase.direction === 'upstream';
    const barOffset = isUpstream ? -0.2 : 0.2; // Offset for visual separation
    const barWidth = width * 0.4; // Make bars narrower than full width
    const barX = x + (width * barOffset) + (width / 2) - (barWidth / 2);
    
    // Check if phase wraps around the cycle time
    const wrapsAround = endTime < startTime;

    if (!wrapsAround) {
      // Regular case - start to end in same cycle
      return (
        <Rectangle 
          key={`phase-${phaseIndex}`}
          x={barX} 
          y={y + (maxTime - endTime) * scaleFactor} 
          width={barWidth} 
          height={(endTime - startTime) * scaleFactor} 
          fill={isUpstream ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />
      );
    } else {
      // Split into two rectangles when wrapping occurs
      const firstPartDuration = maxTime - startTime;
      const secondPartDuration = endTime;

      return [
        // First part - from start time to end of cycle
        <Rectangle 
          key={`phase-${phaseIndex}-1`}
          x={barX} 
          y={y} 
          width={barWidth} 
          height={firstPartDuration * scaleFactor} 
          fill={isUpstream ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />,
        // Second part - from beginning of cycle
        <Rectangle 
          key={`phase-${phaseIndex}-2`}
          x={barX} 
          y={y + (maxTime - secondPartDuration) * scaleFactor} 
          width={barWidth} 
          height={secondPartDuration * scaleFactor} 
          fill={isUpstream ? '#22c55e' : '#3b82f6'} 
          opacity={0.7}
          rx={4}
          ry={4}
        />
      ];
    }
  }).flat();
};
