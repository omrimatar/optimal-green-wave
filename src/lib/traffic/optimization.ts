
import { callLambdaOptimization } from './lambda-client';
import type { 
  NetworkData, 
  Weights, 
  RunResult, 
  LambdaRequest, 
  LambdaResponse 
} from "@/types/traffic";

/**
 * Transforms application data into Lambda request format and calls Lambda function
 */
export async function greenWaveOptimization(
  data: NetworkData, 
  weights: Weights,
  manualOffsets?: number[]
): Promise<{
  baseline_results: RunResult;
  optimized_results: RunResult;
  manual_results?: RunResult;
}> {
  try {
    console.log('Starting optimization with data:', { 
      intersections: data.intersections,
      travel: data.travel,
      manualOffsets
    });
    console.log('Using weights:', weights);

    if (!data.intersections || !data.travel || !weights) {
      throw new Error('Missing required data for optimization');
    }

    // Extract actual distances from input data for later reference
    const actualDistances = data.intersections.map(intersection => intersection.distance);

    // Prepare data for AWS Lambda function
    const requestBody: LambdaRequest = {
      mode: manualOffsets ? "manual" : "optimization",
      data: {
        intersections: data.intersections.map(intersection => ({
          id: intersection.id,
          distance: intersection.distance,
          green_up: intersection.green_up.map(phase => ({
            start: phase.start,
            duration: phase.duration,
            speed: phase.speed || data.travel.up.speed // Use phase-specific speed if available
          })),
          green_down: intersection.green_down.map(phase => ({
            start: phase.start,
            duration: phase.duration,
            speed: phase.speed || data.travel.down.speed // Use phase-specific speed if available
          })),
          cycle: intersection.cycle_up || intersection.cycle_down || 90
        }))
      },
      weights: {
        pair_bandwidth_up: weights.overlap_up,
        pair_bandwidth_down: weights.overlap_down,
        avg_delay_up: weights.avg_delay_up,
        max_delay_up: weights.max_delay_up,
        avg_delay_down: weights.avg_delay_down,
        max_delay_down: weights.max_delay_down,
        corridor_bandwidth_up: weights.corridor_up,
        corridor_bandwidth_down: weights.corridor_down
      }
    };

    // Add manualOffsets if provided
    if (manualOffsets) {
      requestBody.manualOffsets = manualOffsets;
    }

    console.log('Request body for AWS Lambda:', requestBody);
    
    // Call Lambda function
    const lambdaResults: LambdaResponse = await callLambdaOptimization(requestBody);
    
    if (!lambdaResults) {
      throw new Error('No results returned from optimization');
    }

    console.log('Received results from Lambda:', lambdaResults);

    // Process the results and add the actual distances to each result object
    const results = {
      baseline_results: enhanceResults(lambdaResults.baseline_results, actualDistances),
      optimized_results: enhanceResults(lambdaResults.optimization_results, actualDistances),
      manual_results: manualOffsets ? enhanceResults(lambdaResults.optimization_results, actualDistances) : undefined
    };

    console.log('Final processed results with distances:', results);
    return results;
  } catch (error) {
    console.error('Error in greenWaveOptimization:', error);
    throw error;
  }
}

/**
 * Enhances results with additional properties needed by UI components
 */
function enhanceResults(result: RunResult, actualDistances?: number[]): RunResult {
  return {
    ...result,
    // Ensure properties needed by UI components are present
    corridorBW_up: result.corridor_bandwidth_up || 0,
    corridorBW_down: result.corridor_bandwidth_down || 0,
    local_up: result.pair_bandwidth_up || [],
    local_down: result.pair_bandwidth_down || [],
    // Add the actual distances to the result
    distances: actualDistances || result.distances,
    // Ensure all pairs_band_points have the correct structure, especially for pairs with zero bandwidth
    pairs_band_points: (result.pairs_band_points || []).map((pair, idx) => {
      // For diagnostics
      console.log(`Processing pair_band_point ${idx}:`, pair);
      
      if (!pair) return pair;
      
      // Check if we need to fix any wrapping issues in the pairs
      return {
        ...pair,
        // Make sure we preserve the correct wrapping for downstream directions
        down: {
          ...pair.down,
          // Log the values for debugging
          origin_low: pair.down.origin_low,
          origin_high: pair.down.origin_high,
          dest_low: pair.down.dest_low,
          dest_high: pair.down.dest_high
        }
      };
    })
  };
}
