import { callLambdaOptimization, getLatestDebugData } from './lambda-client';
import { modifiedWeights } from '@/types/optimization';
import type { 
  NetworkData, 
  Weights, 
  RunResult, 
  LambdaRequest, 
  LambdaResponse 
} from "@/types/traffic";

/**
 * Transforms application data into Lambda request format and calls Lambda function
 * Enhanced with better error handling and data validation
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
    console.log('Weight modification status:', modifiedWeights);

    // Validate inputs
    if (!data.intersections || !data.travel || !weights) {
      throw new Error('Missing required data for optimization');
    }

    if (data.intersections.length === 0) {
      throw new Error('At least one intersection is required for optimization');
    }

    // Validate all intersection data has required fields
    for (const intersection of data.intersections) {
      if (intersection.green_up === undefined || intersection.green_down === undefined) {
        throw new Error(`Intersection ${intersection.id} is missing green phase data`);
      }
      
      if (intersection.cycle_up === undefined && intersection.cycle_down === undefined) {
        console.warn(`Intersection ${intersection.id} has no cycle time specified, using default 90s`);
      }
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
            speed: phase.speed // Use phase-specific speed from the data
          })),
          green_down: intersection.green_down.map(phase => ({
            start: phase.start,
            duration: phase.duration,
            speed: phase.speed // Use phase-specific speed from the data
          })),
          cycle: intersection.cycle_up || intersection.cycle_down || 90,
          use_half_cycle: intersection.use_half_cycle || false // Pass the half cycle time flag
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
        corridor_bandwidth_down: weights.corridor_down,
        alpha: weights.alpha,          // Pass the alpha parameter
        beta: weights.beta             // Pass the beta parameter
      }
    };

    // Add manualOffsets if provided
    if (manualOffsets) {
      requestBody.manualOffsets = manualOffsets;
    }

    console.log('Request body for AWS Lambda:', requestBody);
    
    try {
      // Call Lambda function
      const lambdaResults: LambdaResponse = await callLambdaOptimization(requestBody);
      
      if (!lambdaResults) {
        throw new Error('No results returned from optimization');
      }

      console.log('Received results from Lambda:', lambdaResults);

      // Validate the Lambda response
      if (!lambdaResults.baseline_results || 
          (manualOffsets && !lambdaResults.optimization_results)) {
        throw new Error('Invalid response structure from Lambda');
      }

      // Process the results and add the actual distances to each result object
      const results = {
        baseline_results: enhanceResults(lambdaResults.baseline_results, actualDistances),
        optimized_results: enhanceResults(lambdaResults.optimization_results, actualDistances),
        manual_results: manualOffsets ? enhanceResults(lambdaResults.optimization_results, actualDistances) : undefined
      };

      console.log('Final processed results with distances:', results);
      return results;
    } catch (error) {
      console.error('Error calling Lambda optimization:', error);
      // Re-throw with a more user-friendly message
      throw new Error(`שגיאה בחישוב הגל הירוק: ${error instanceof Error ? error.message : 'תקלה לא ידועה'}`);
    }
  } catch (error) {
    console.error('Error in greenWaveOptimization:', error);
    throw error;
  }
}

/**
 * Enhances results with additional properties needed by UI components
 * Added validation to prevent UI errors from invalid data
 */
function enhanceResults(result: RunResult, actualDistances?: number[]): RunResult {
  // Defensive check for undefined result
  if (!result) {
    console.error('Received undefined result in enhanceResults');
    // Return a minimal valid object to prevent UI errors
    return {
      status: 'Error',
      offsets: [],
      objective_value: 0,
      corridorBW_up: 0,
      corridorBW_down: 0,
      local_up: [],
      local_down: [],
      distances: actualDistances || []
    };
  }
  
  return {
    ...result,
    // Ensure properties needed by UI components are present
    corridorBW_up: result.corridor_bandwidth_up || 0,
    corridorBW_down: result.corridor_bandwidth_down || 0,
    local_up: Array.isArray(result.pair_bandwidth_up) ? result.pair_bandwidth_up : [],
    local_down: Array.isArray(result.pair_bandwidth_down) ? result.pair_bandwidth_down : [],
    // Add the actual distances to the result
    distances: actualDistances || result.distances || []
  };
}

/**
 * Returns the latest Lambda request and response data for debugging
 */
export function getLatestLambdaDebugData() {
  return getLatestDebugData();
}
