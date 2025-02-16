
import { greenWaveOptimization } from "./traffic";
import { DEFAULT_WEIGHTS } from "@/types/optimization";
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

  // וידוא שיש אופסטים ידניים כשצריך
  if (manualOffsets && manualOffsets.length !== intersections.length) {
    throw new Error("מספר האופסטים הידניים חייב להתאים למספר הצמתים");
  }

  console.log("Sending to optimization:", {
    networkData,
    weights: weights || DEFAULT_WEIGHTS,
    manualOffsets
  });
  
  // קריאה לפונקציית האופטימיזציה
  const results = await greenWaveOptimization(networkData, weights || DEFAULT_WEIGHTS, manualOffsets);
  console.log("Received results from optimization:", results);
  
  return results;
}
