
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
    intersections: intersections.map(intersection => {
      // Extract and combine green phases
      const upPhases = intersection.greenPhases
        .filter(phase => phase.direction === 'upstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration
        }));
      
      const downPhases = intersection.greenPhases
        .filter(phase => phase.direction === 'downstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration
        }));

      return {
        id: intersection.id,
        distance: intersection.distance,
        green_up: upPhases,
        green_down: downPhases,
        cycle_up: intersection.cycleTime,
        cycle_down: intersection.cycleTime
      };
    }),
    travel: {
      up: { speed },
      down: { speed }
    }
  };

  console.log("Sending to optimization with manualOffsets:", manualOffsets);
  console.log("Sending intersections with distances:", intersections.map(i => `${i.id}: ${i.distance}`));
  
  // קריאה לפונקציית האופטימיזציה
  const results = await greenWaveOptimization(networkData, weights || DEFAULT_WEIGHTS, manualOffsets);
  
  // Ensure distances are properly preserved in the results
  const actualDistances = intersections.map(i => i.distance);
  
  // Add the actual distances to all result objects
  if (results.baseline_results) {
    results.baseline_results.distances = actualDistances;
  }
  
  if (results.optimized_results) {
    results.optimized_results.distances = actualDistances;
  }
  
  if (results.manual_results) {
    results.manual_results.distances = actualDistances;
  }
  
  console.log("Received results from optimization with distances:", actualDistances);
  
  return results;
}
