
import { Intersection } from '@/types/optimization';

interface BandwidthLineParams {
  intersections: Intersection[];
  speed: number;
  cycleTime: number;
}

interface Point {
  distance: number;
  time: number;
}

interface BandwidthLine {
  start: Point;
  end: Point;
  color: string;
  opacity: number;
}

// Convert km/h to m/s
const kmhToMs = (kmh: number): number => kmh / 3.6;

// Normalize time to be within cycle time
const normalizeTime = (time: number, cycleTime: number): number => {
  return ((time % cycleTime) + cycleTime) % cycleTime;
};

export const calculateBandwidthLines = (
  params: BandwidthLineParams, 
  direction: 'upstream' | 'downstream'
): BandwidthLine[] => {
  const { intersections, speed, cycleTime } = params;
  
  if (!intersections || intersections.length < 2 || !speed || speed <= 0) {
    return [];
  }

  const sortedIntersections = [...intersections].sort((a, b) => a.distance - b.distance);
  const speedMs = kmhToMs(speed); // Convert to m/s
  const color = direction === 'upstream' ? '#22c55e' : '#3b82f6';
  const lines: BandwidthLine[] = [];

  // For each intersection, calculate possible paths
  for (let i = 0; i < sortedIntersections.length; i++) {
    const currentIntersection = sortedIntersections[i];
    
    // Get relevant green phases for this direction
    const relevantPhases = currentIntersection.greenPhases.filter(
      phase => phase.direction === direction
    );

    if (!relevantPhases.length) continue;

    for (const phase of relevantPhases) {
      // Adjust start time by offset if any
      const adjustedStartTime = normalizeTime(
        phase.startTime + (currentIntersection.offset || 0), 
        cycleTime
      );
      
      // Calculate range of times during the green phase
      const phaseEndTime = normalizeTime(
        adjustedStartTime + phase.duration,
        cycleTime
      );

      // Create bandwidth lines from this intersection to the next ones
      if (direction === 'upstream') {
        // For upstream, lines go from earlier to later intersections
        for (let j = i + 1; j < sortedIntersections.length; j++) {
          const targetIntersection = sortedIntersections[j];
          const distance = targetIntersection.distance - currentIntersection.distance;
          
          if (distance <= 0) continue;
          
          const travelTime = distance / speedMs; // Time to travel between intersections
          
          // Start time at the current intersection
          const startTime = adjustedStartTime;
          
          // End time at the target intersection (adjusted for travel)
          const endTime = normalizeTime(startTime + travelTime, cycleTime);
          
          lines.push({
            start: { distance: currentIntersection.distance, time: startTime },
            end: { distance: targetIntersection.distance, time: endTime },
            color,
            opacity: 0.8
          });
          
          // Add a line for the end of the green phase too
          lines.push({
            start: { distance: currentIntersection.distance, time: phaseEndTime },
            end: { 
              distance: targetIntersection.distance, 
              time: normalizeTime(phaseEndTime + travelTime, cycleTime) 
            },
            color,
            opacity: 0.8
          });
        }
      } else {
        // For downstream, lines go from later to earlier intersections
        for (let j = i - 1; j >= 0; j--) {
          const targetIntersection = sortedIntersections[j];
          const distance = currentIntersection.distance - targetIntersection.distance;
          
          if (distance <= 0) continue;
          
          const travelTime = distance / speedMs; // Time to travel between intersections
          
          // Start time at the current intersection
          const startTime = adjustedStartTime;
          
          // End time at the target intersection (adjusted for travel)
          const endTime = normalizeTime(startTime + travelTime, cycleTime);
          
          lines.push({
            start: { distance: currentIntersection.distance, time: startTime },
            end: { distance: targetIntersection.distance, time: endTime },
            color,
            opacity: 0.8
          });
          
          // Add a line for the end of the green phase too
          lines.push({
            start: { distance: currentIntersection.distance, time: phaseEndTime },
            end: { 
              distance: targetIntersection.distance, 
              time: normalizeTime(phaseEndTime + travelTime, cycleTime) 
            },
            color,
            opacity: 0.8
          });
        }
      }
    }
  }

  return lines;
};
