
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
  // Convert the data to the required format
  const networkData: NetworkData = {
    intersections: intersections.map(intersection => ({
      id: intersection.id,
      distance: intersection.distance,
      green_up: intersection.greenPhases
        .filter(phase => phase.direction === 'upstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration,
          speed: speed // Use the provided speed for all phases
        })),
      green_down: intersection.greenPhases
        .filter(phase => phase.direction === 'downstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration,
          speed: speed // Use the provided speed for all phases
        })),
      cycle: intersection.cycleTime
    })),
    travel: {
      up: { speed },
      down: { speed }
    }
  };

  console.log("Sending to optimization with manualOffsets:", manualOffsets);
  
  // Call the optimization function
  const results = await greenWaveOptimization(networkData, weights || DEFAULT_WEIGHTS, manualOffsets);
  console.log("Received results from optimization:", results);
  
  return results;
}

