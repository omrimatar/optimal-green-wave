
import { supabase } from "@/integrations/supabase/client";
import type { NetworkData, Weights, RunResult } from "@/types/traffic";

function calculateCorridorBandwidth(data: NetworkData, offsets: number[]): { 
  up: number|null; 
  down: number|null;
} {
  const { intersections, travel } = data;

  let minBandwidthUp = Infinity;
  let minBandwidthDown = Infinity;
  let hasUp = false;
  let hasDown = false;

  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    if (!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up) {
      continue;
    }
    hasUp = true;

    const distance = next.distance - curr.distance;
    const travelTime = (distance / travel.speedUp) * 3.6;

    const currGreen = curr.green_up[0];
    const nextGreen = next.green_up[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_up;
    const nextStart = (offsets[i + 1] + nextGreen.start) % next.cycle_up;
    
    const arrivalTime = (currStart + currGreen.duration/2 + travelTime) % next.cycle_up;
    const overlap = Math.min(
      nextGreen.duration,
      Math.max(0, nextGreen.duration - Math.abs(arrivalTime - (nextStart + nextGreen.duration/2)))
    );
    minBandwidthUp = Math.min(minBandwidthUp, overlap);
  }

  for (let i = intersections.length - 1; i > 0; i--) {
    const curr = intersections[i];
    const prev = intersections[i - 1];
    if (!curr.green_down?.length || !prev.green_down?.length || !curr.cycle_down || !prev.cycle_down) {
      continue;
    }
    hasDown = true;

    const distance = curr.distance - prev.distance;
    const travelTime = (distance / travel.speedDown) * 3.6;

    const currGreen = curr.green_down[0];
    const prevGreen = prev.green_down[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_down;
    const prevStart = (offsets[i - 1] + prevGreen.start) % prev.cycle_down;
    
    const arrivalTime = (currStart + currGreen.duration/2 + travelTime) % prev.cycle_down;
    const overlap = Math.min(
      prevGreen.duration,
      Math.max(0, prevGreen.duration - Math.abs(arrivalTime - (prevStart + prevGreen.duration/2)))
    );
    minBandwidthDown = Math.min(minBandwidthDown, overlap);
  }

  const upVal = hasUp ? (minBandwidthUp === Infinity ? 0 : minBandwidthUp) : null;
  const downVal = hasDown ? (minBandwidthDown === Infinity ? 0 : minBandwidthDown) : null;

  return { up: upVal, down: downVal };
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

    console.log('Preparing request body...');
    const requestBody = {
      data: {
        intersections: data.intersections,
        travel: {
          speedUp: data.travel.speedUp,
          speedDown: data.travel.speedDown
        }
      },
      weights,
      manualOffsets
    };
    console.log('Request body:', requestBody);
    
    const functionUrl = `https://xfdqxyxvjzbvxewbzrpe.supabase.co/functions/v1/optimize?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZHF4eXh2anpidnhld2J6cnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzE5MTIsImV4cCI6MjA1NTE0NzkxMn0.uhp87GwzK6g04w3ZTBE1vVe8dtDkXALlzrBsSjAuUtg`;
    console.log('Function URL:', functionUrl);
        
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();
    
    if (!results) {
      throw new Error('No results returned from optimization');
    }

    console.log('Received results:', results);

    if (results.baseline_results) {
      const baselineBandwidth = calculateCorridorBandwidth(data, results.baseline_results.offsets);
      results.baseline_results.corridorBW_up = baselineBandwidth.up || 0;
      results.baseline_results.corridorBW_down = baselineBandwidth.down || 0;
    }
    if (results.optimized_results) {
      const optimizedBandwidth = calculateCorridorBandwidth(data, results.optimized_results.offsets);
      results.optimized_results.corridorBW_up = optimizedBandwidth.up || 0;
      results.optimized_results.corridorBW_down = optimizedBandwidth.down || 0;
    }
    if (results.manual_results) {
      const manualBandwidth = calculateCorridorBandwidth(data, results.manual_results.offsets);
      results.manual_results.corridorBW_up = manualBandwidth.up || 0;
      results.manual_results.corridorBW_down = manualBandwidth.down || 0;
    }

    console.log('Final results:', results);
    return results;
  } catch (error) {
    console.error('Error in greenWaveOptimization:', error);
    throw error;
  }
}
