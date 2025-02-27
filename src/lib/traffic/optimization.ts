
import { supabase } from "@/integrations/supabase/client";
import type { NetworkData, Weights, RunResult, LambdaRequest } from "@/types/traffic";
import { calculateCorridorBandwidth } from "./bandwidth";
import { chainPostProc } from "./chainBandwidth";

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
            speed: data.travel.up.speed
          })),
          green_down: intersection.green_down.map(phase => ({
            start: phase.start,
            duration: phase.duration,
            speed: data.travel.down.speed
          })),
          cycle: intersection.cycle_up || intersection.cycle_down
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
    
    const lambdaUrl = "https://xphhfrlnpiikldzbmfkboitshq0dkdnt.lambda-url.eu-north-1.on.aws/";
    console.log('Lambda URL:', lambdaUrl);
        
    const response = await fetch(lambdaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lambda response error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const lambdaResults = await response.json();
    
    if (!lambdaResults) {
      throw new Error('No results returned from optimization');
    }

    console.log('Received results from Lambda:', lambdaResults);

    // Process the results
    const results = {
      baseline_results: lambdaResults.baseline_results,
      optimized_results: lambdaResults.optimization_results,
      manual_results: manualOffsets ? lambdaResults.optimization_results : undefined
    };

    // Add local bandwidth calculations for each result
    if (results.baseline_results) {
      const baselineBandwidth = calculateCorridorBandwidth(data, results.baseline_results.offsets);
      results.baseline_results.corridorBW_up = results.baseline_results.corridor_bandwidth_up || 0;
      results.baseline_results.corridorBW_down = results.baseline_results.corridor_bandwidth_down || 0;
      results.baseline_results.local_up = results.baseline_results.pair_bandwidth_up || baselineBandwidth.local_up;
      results.baseline_results.local_down = results.baseline_results.pair_bandwidth_down || baselineBandwidth.local_down;
    }
    
    if (results.optimized_results) {
      const optimizedBandwidth = calculateCorridorBandwidth(data, results.optimized_results.offsets);
      results.optimized_results.corridorBW_up = results.optimized_results.corridor_bandwidth_up || 0;
      results.optimized_results.corridorBW_down = results.optimized_results.corridor_bandwidth_down || 0;
      results.optimized_results.local_up = results.optimized_results.pair_bandwidth_up || optimizedBandwidth.local_up;
      results.optimized_results.local_down = results.optimized_results.pair_bandwidth_down || optimizedBandwidth.local_down;
    }

    console.log('Final processed results:', results);
    return results;
  } catch (error) {
    console.error('Error in greenWaveOptimization:', error);
    throw error;
  }
}
