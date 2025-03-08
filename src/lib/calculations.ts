
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
    intersections: intersections.map((intersection, index) => {
      // Get the effective speeds (use intersection-specific speed if defined, otherwise use global speed)
      const currentUpstreamSpeed = intersection.upstreamSpeed !== undefined ? intersection.upstreamSpeed : speed;
      const currentDownstreamSpeed = intersection.downstreamSpeed !== undefined ? intersection.downstreamSpeed : speed;
      
      // Extract and combine green phases
      const upPhases = intersection.greenPhases
        .filter(phase => phase.direction === 'upstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration,
          speed: currentUpstreamSpeed  // Use the appropriate upstream speed
        }));
      
      const downPhases = intersection.greenPhases
        .filter(phase => phase.direction === 'downstream')
        .map(phase => ({
          start: phase.startTime,
          duration: phase.duration,
          speed: currentDownstreamSpeed  // Use the appropriate downstream speed
        }));

      return {
        id: intersection.id,
        distance: intersection.distance,
        green_up: upPhases,
        green_down: downPhases,
        cycle_up: intersection.cycleTime,
        cycle_down: intersection.cycleTime,
        // Add specific speed properties to communicate clearly to the optimization
        upstream_speed: currentUpstreamSpeed,
        downstream_speed: currentDownstreamSpeed
      };
    }),
    travel: {
      up: { speed },
      down: { speed }
    }
  };

  console.log("Sending to optimization with manualOffsets:", manualOffsets);
  console.log("Sending intersections with distances:", intersections.map(i => `${i.id}: ${i.distance}`));
  console.log("Sending speeds:", intersections.map(i => 
    `${i.id}: upstream=${i.upstreamSpeed || speed}, downstream=${i.downstreamSpeed || speed}`
  ));
  
  // קריאה לפונקציית האופטימיזציה
  const results = await greenWaveOptimization(networkData, weights || DEFAULT_WEIGHTS, manualOffsets);
  
  // Ensure distances and speeds are properly preserved in the results
  const actualDistances = intersections.map(i => i.distance);
  const upstreamSpeeds = intersections.map(i => i.upstreamSpeed || speed);
  const downstreamSpeeds = intersections.map(i => i.downstreamSpeed || speed);
  
  // Add the actual distances and speeds to all result objects
  if (results.baseline_results) {
    results.baseline_results.distances = actualDistances;
    results.baseline_results.speed = speed; // Global design speed
    results.baseline_results.upstream_speeds = upstreamSpeeds;
    results.baseline_results.downstream_speeds = downstreamSpeeds;
  }
  
  if (results.optimized_results) {
    results.optimized_results.distances = actualDistances;
    results.optimized_results.speed = speed; // Global design speed
    results.optimized_results.upstream_speeds = upstreamSpeeds;
    results.optimized_results.downstream_speeds = downstreamSpeeds;
  }
  
  if (results.manual_results) {
    results.manual_results.distances = actualDistances;
    results.manual_results.speed = speed; // Global design speed
    results.manual_results.upstream_speeds = upstreamSpeeds;
    results.manual_results.downstream_speeds = downstreamSpeeds;
  }
  
  console.log("Received results from optimization with distances:", actualDistances);
  console.log("Received results with upstream speeds:", upstreamSpeeds);
  console.log("Received results with downstream speeds:", downstreamSpeeds);
  
  return results;
}
