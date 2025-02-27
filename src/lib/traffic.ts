
import { supabase } from "@/integrations/supabase/client";
import type { NetworkData, Weights, RunResult, LambdaRequest } from "@/types/traffic";

export interface GreenPhase {
    start: number;
    duration: number;
}

export interface Intersection {
    id: number;
    distance: number;
    green_up: GreenPhase[];
    green_down: GreenPhase[];
    cycle_up: number;
    cycle_down: number;
}

function calculateCorridorBandwidth(data: NetworkData, offsets: number[]): { 
  up: number|null; 
  down: number|null;
  local_up: Array<number|null>;
  local_down: Array<number|null>;
} {
  const { intersections, travel } = data;

  let minBandwidthUp = Infinity;
  let minBandwidthDown = Infinity;
  let hasUp = false;
  let hasDown = false;
  const local_up: Array<number|null> = [];
  const local_down: Array<number|null> = [];

  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    if (!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up) {
      local_up.push(null);
      continue;
    }
    hasUp = true;

    const distance = next.distance - curr.distance;
    const travelTime = (distance / travel.up.speed) * 3.6;

    const currGreen = curr.green_up[0];
    const nextGreen = next.green_up[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_up;
    const nextStart = (offsets[i + 1] + nextGreen.start) % next.cycle_up;
    
    const arrivalTime = (currStart + currGreen.duration/2 + travelTime) % next.cycle_up;
    const overlap = Math.min(
      nextGreen.duration,
      Math.max(0, nextGreen.duration - Math.abs(arrivalTime - (nextStart + nextGreen.duration/2)))
    );
    local_up.push(overlap);
    minBandwidthUp = Math.min(minBandwidthUp, overlap);
  }

  for (let i = intersections.length - 1; i > 0; i--) {
    const curr = intersections[i];
    const prev = intersections[i - 1];
    if (!curr.green_down?.length || !prev.green_down?.length || !curr.cycle_down || !prev.cycle_down) {
      local_down.push(null);
      continue;
    }
    hasDown = true;

    const distance = curr.distance - prev.distance;
    const travelTime = (distance / travel.down.speed) * 3.6;

    const currGreen = curr.green_down[0];
    const prevGreen = prev.green_down[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_down;
    const prevStart = (offsets[i - 1] + prevGreen.start) % prev.cycle_down;
    
    const arrivalTime = (currStart + currGreen.duration/2 + travelTime) % prev.cycle_down;
    const overlap = Math.min(
      prevGreen.duration,
      Math.max(0, prevGreen.duration - Math.abs(arrivalTime - (prevStart + prevGreen.duration/2)))
    );
    local_down.unshift(overlap);
    minBandwidthDown = Math.min(minBandwidthDown, overlap);
  }

  const upVal = hasUp ? (minBandwidthUp === Infinity ? 0 : minBandwidthUp) : null;
  const downVal = hasDown ? (minBandwidthDown === Infinity ? 0 : minBandwidthDown) : null;

  return { 
    up: upVal, 
    down: downVal,
    local_up,
    local_down
  };
}

function chainPostProc(run: RunResult, data: NetworkData) {
    const n = data.intersections.length;
    const travelUp: number[] = [];
    const travelDown: number[] = [];
    
    for(let i = 0; i < n-1; i++) {
        const dist = data.intersections[i+1].distance - data.intersections[i].distance;
        travelUp[i] = Math.round(dist * 3.6 / data.travel.up.speed);
        travelDown[i] = Math.round(dist * 3.6 / data.travel.down.speed);
    }

    const diagonalUp = chainBWUp(run.offsets, data, travelUp);
    const diagonalDown = chainBWDown(run.offsets, data, travelDown);

    run.diagonal_up_start = diagonalUp.diagonal_up_start;
    run.diagonal_up_end = diagonalUp.diagonal_up_end;
    run.diagonal_down_start = diagonalDown.diagonal_down_start;
    run.diagonal_down_end = diagonalDown.diagonal_down_end;
}

function chainBWUp(offsets: number[], data: NetworkData, travelUp: number[]): {
    diagonal_up_start: Array<number|null>;
    diagonal_up_end: Array<number|null>;
} {
    const n = data.intersections.length;
    if(n < 2) return {diagonal_up_start: [], diagonal_up_end: []};
    
    let Lc: number, Uc: number;
    {
        const off_dep = offsets[0];
        const off_dest = offsets[1];
        const phDep = data.intersections[0].green_up[0];
        const phDest = data.intersections[1].green_up[0];
        const a = off_dep + phDep.start + travelUp[0];
        const c = a + phDep.duration;
        const b = off_dest + phDest.start;
        const d = b + phDest.duration;
        Lc = Math.max(a, b);
        Uc = Math.min(c, d);
        if(Lc > Uc) return {diagonal_up_start: [], diagonal_up_end: []};
    }

    for(let i = 1; i < n-1; i++) {
        const t = travelUp[i];
        Lc += t;
        Uc += t;
        const off_dep = offsets[i];
        const off_dest = offsets[i+1];
        const phDep = data.intersections[i].green_up[0];
        const phDest = data.intersections[i+1].green_up[0];
        const a = off_dep + phDep.start;
        const c = a + phDep.duration;
        const b = off_dest + phDest.start;
        const d = b + phDest.duration;
        const newL = Math.max(Lc, Math.max(a, b));
        const newU = Math.min(Uc, Math.min(c, d));
        if(newL > newU) return {diagonal_up_start: [], diagonal_up_end: []};
        Lc = newL;
        Uc = newU;
    }
    return {diagonal_up_start: [Math.max(0, Uc-Lc)], diagonal_up_end: [Math.max(0, Uc-Lc)]};
}

function chainBWDown(offsets: number[], data: NetworkData, travelDown: number[]): {
    diagonal_down_start: Array<number|null>;
    diagonal_down_end: Array<number|null>;
} {
    const n = data.intersections.length;
    if(n < 2) return {diagonal_down_start: [], diagonal_down_end: []};
    
    let Lc: number, Uc: number;
    {
        const off_dep = offsets[n-1];
        const off_dest = offsets[n-2];
        const ph_dep = data.intersections[n-1].green_down[0];
        const ph_dest = data.intersections[n-2].green_down[0];
        const t = travelDown[n-2];
        const a = off_dep + ph_dep.start + t;
        const c = a + ph_dep.duration;
        const b = off_dest + ph_dest.start;
        const d = b + ph_dest.duration;
        Lc = Math.max(a, b);
        Uc = Math.min(c, d);
        if(Lc > Uc) return {diagonal_down_start: [], diagonal_down_end: []};
    }

    for(let i = n-2; i > 0; i--) {
        const t = travelDown[i-1];
        Lc += t;
        Uc += t;
        const off_dep = offsets[i];
        const off_dest = offsets[i-1];
        const ph_dep = data.intersections[i].green_down[0];
        const ph_dest = data.intersections[i-1].green_down[0];
        const a = off_dep + ph_dep.start;
        const c = a + ph_dep.duration;
        const b = off_dest + ph_dest.start;
        const d = b + ph_dest.duration;
        const newL = Math.max(Lc, Math.max(a, b));
        const newU = Math.min(Uc, Math.min(c, d));
        if(newL > newU) return {diagonal_down_start: [], diagonal_down_end: []};
        Lc = newL;
        Uc = newU;
    }
    return {diagonal_down_start: [Math.max(0, Uc-Lc)], diagonal_down_end: [Math.max(0, Uc-Lc)]};
}

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
