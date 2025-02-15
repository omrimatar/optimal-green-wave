
import { greenWaveOptimization } from "./traffic";
import type { Intersection, OptimizationWeights } from "@/types/optimization";
import type { NetworkData, RunResult } from "@/types/traffic";

export async function calculateGreenWave(
  intersections: Intersection[],
  speed: number,
  weights?: OptimizationWeights,
  manualOffsets?: number[]
): Promise<{
  baseline_results: RunResult;
  optimized_results: RunResult;
  manual_results?: RunResult;
}> {
  // המרת הנתונים לפורמט הנדרש
  const networkData: NetworkData = {
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

  // המרת המשקולות לפורמט הנדרש (אם סופקו)
  const optimizationWeights = weights ? {
    corridor_up: weights.corridorUp,
    corridor_down: weights.corridorDown,
    overlap_up: weights.overlapUp,
    overlap_down: weights.overlapDown,
    avg_delay_up: weights.avgDelayUp,
    avg_delay_down: weights.avgDelayDown,
    max_delay_up: weights.maxDelayUp,
    max_delay_down: weights.maxDelayDown
  } : undefined;

  // קריאה לפונקציית האופטימיזציה
  return await greenWaveOptimization(networkData, optimizationWeights || {
    corridor_up: 0.125,
    corridor_down: 0.125,
    overlap_up: 0.125,
    overlap_down: 0.125,
    avg_delay_up: 0.125,
    avg_delay_down: 0.125,
    max_delay_up: 0.125,
    max_delay_down: 0.125
  }, manualOffsets);
}
