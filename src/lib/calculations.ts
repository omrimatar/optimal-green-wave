
import type { Intersection } from "@/types/optimization";
import { greenWaveOptimization } from "./traffic";

export const calculateGreenWave = (
  intersections: Intersection[],
  speed: number,
  weights?: any
) => {
  // המרת נתוני הקלט לפורמט הנדרש על ידי האלגוריתם
  const networkData = {
    intersections: intersections.map(intersection => ({
      id: intersection.id,
      distance: intersection.distance,
      green_up: intersection.greenPhases
        .filter(phase => phase.direction === 'upstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration
        })),
      green_down: intersection.greenPhases
        .filter(phase => phase.direction === 'downstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration
        })),
      cycle_up: intersection.cycleTime,
      cycle_down: intersection.cycleTime
    })),
    travel: {
      up: { speed },
      down: { speed }
    }
  };

  console.log("Network data being sent to optimization:", networkData);

  // המרת המשקולות לפורמט הנדרש
  const calculationWeights = weights ? {
    corridor_up: weights.corridorBandwidth.upstream,
    corridor_down: weights.corridorBandwidth.downstream,
    overlap_up: weights.adjacentPairs.upstream,
    overlap_down: weights.adjacentPairs.downstream,
    avg_delay_up: weights.delayMinimization.upstream / 2,  // מחלקים את המשקל של העיכוב בין ממוצע ומקסימום
    avg_delay_down: weights.delayMinimization.downstream / 2,
    max_delay_up: weights.delayMinimization.upstream / 2,
    max_delay_down: weights.delayMinimization.downstream / 2
  } : {
    corridor_up: 25,
    corridor_down: 25,
    overlap_up: 15,
    overlap_down: 15,
    avg_delay_up: 5,
    avg_delay_down: 5,
    max_delay_up: 5,
    max_delay_down: 5
  };

  console.log("Calculation weights:", calculationWeights);

  // הרצת האלגוריתם
  return greenWaveOptimization(networkData, calculationWeights);
};
