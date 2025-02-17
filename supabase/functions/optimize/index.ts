
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import * as glpk from "https://esm.sh/glpk.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GreenPhase {
  start: number;
  duration: number;
}

interface Intersection {
  id: number;
  distance: number;
  green_up?: GreenPhase[];
  green_down?: GreenPhase[];
  cycle_up?: number;
  cycle_down?: number;
}

interface NetworkData {
  intersections: Intersection[];
  travel: {
    up: { speed: number };
    down: { speed: number };
  };
}

interface OptimizationWeights {
  corridor_up: number;
  corridor_down: number;
  overlap_up: number;
  overlap_down: number;
  avg_delay_up: number;
  avg_delay_down: number;
  max_delay_up: number;
  max_delay_down: number;
}

function calculateOffsets(data: NetworkData): number[] {
  const offsets: number[] = [];
  const { intersections, travel } = data;
  
  for (let i = 0; i < intersections.length; i++) {
    if (i === 0) {
      offsets.push(0);
      continue;
    }

    const curr = intersections[i];
    const prev = intersections[i - 1];
    if (!curr.green_up?.length || !prev.green_up?.length || !curr.cycle_up || !prev.cycle_up) {
      offsets.push(0);
      continue;
    }

    const distance = curr.distance - prev.distance;
    const travelTimeUp = (distance / travel.up.speed) * 3.6;

    const greenPhaseUp = curr.green_up[0];
    const prevGreenPhaseUp = prev.green_up[0];
    const idealOffset = Math.round(
      (prevGreenPhaseUp.start + prevGreenPhaseUp.duration/2 + travelTimeUp - greenPhaseUp.duration/2) % curr.cycle_up
    );
    offsets.push(idealOffset);
  }
  return offsets;
}

function calculateCorridorBandwidth(data: NetworkData, offsets: number[]): { up: number|null; down: number|null } {
  const { intersections, travel } = data;

  let minBandwidthUp = Infinity;
  let minBandwidthDown = Infinity;
  let hasUp = false;
  let hasDown = false;

  // כיוון UP
  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    if (!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up) {
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
    minBandwidthUp = Math.min(minBandwidthUp, overlap);
  }

  // כיוון DOWN
  for (let i = intersections.length - 1; i > 0; i--) {
    const curr = intersections[i];
    const prev = intersections[i - 1];
    if (!curr.green_down?.length || !prev.green_down?.length || !curr.cycle_down || !prev.cycle_down) {
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
    minBandwidthDown = Math.min(minBandwidthDown, overlap);
  }

  const upVal = hasUp ? (minBandwidthUp === Infinity ? 0 : minBandwidthUp) : null;
  const downVal = hasDown ? (minBandwidthDown === Infinity ? 0 : minBandwidthDown) : null;

  return { up: upVal, down: downVal };
}

function calculateDelays(data: NetworkData, offsets: number[]): {
  avg_up: Array<number|null>;
  avg_down: Array<number|null>;
  max_up: Array<number|null>;
  max_down: Array<number|null>;
} {
  const { intersections, travel } = data;
  const delays = {
    avg_up: [] as Array<number|null>,
    avg_down: [] as Array<number|null>,
    max_up: [] as Array<number|null>,
    max_down: [] as Array<number|null>,
  };

  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];

    // up
    if (curr.green_up?.length && next.green_up?.length && curr.cycle_up && next.cycle_up) {
      const distance = next.distance - curr.distance;
      const travelTimeUp = (distance / travel.up.speed) * 3.6;
      const currGreenUp = curr.green_up[0];
      const nextGreenUp = next.green_up[0];
      const currStartUp = (offsets[i] + currGreenUp.start) % curr.cycle_up;
      const nextStartUp = (offsets[i + 1] + nextGreenUp.start) % next.cycle_up;
      
      const expectedArrivalUp = (currStartUp + currGreenUp.duration/2 + travelTimeUp) % next.cycle_up;
      const actualGreenStartUp = (nextStartUp + nextGreenUp.duration/2);
      const avgDelayUp = Math.min(
        Math.abs(expectedArrivalUp - actualGreenStartUp),
        next.cycle_up - Math.abs(expectedArrivalUp - actualGreenStartUp)
      );
      const maxDelayUp = next.cycle_up - nextGreenUp.duration;

      delays.avg_up.push(avgDelayUp);
      delays.max_up.push(maxDelayUp);
    } else {
      delays.avg_up.push(null);
      delays.max_up.push(null);
    }

    // down
    if (curr.green_down?.length && next.green_down?.length && curr.cycle_down && next.cycle_down) {
      const distance = next.distance - curr.distance;
      const travelTimeDown = (distance / travel.down.speed) * 3.6;
      const currGreenDown = curr.green_down[0];
      const nextGreenDown = next.green_down[0];
      const currStartDown = (offsets[i] + currGreenDown.start) % curr.cycle_down;
      const nextStartDown = (offsets[i + 1] + nextGreenDown.start) % next.cycle_down;
      
      const expectedArrivalDown = (nextStartDown + nextGreenDown.duration/2 + travelTimeDown) % curr.cycle_down;
      const actualGreenStartDown = (currStartDown + currGreenDown.duration/2);
      const avgDelayDown = Math.min(
        Math.abs(expectedArrivalDown - actualGreenStartDown),
        curr.cycle_down - Math.abs(expectedArrivalDown - actualGreenStartDown)
      );
      const maxDelayDown = curr.cycle_down - currGreenDown.duration;

      delays.avg_down.push(avgDelayDown);
      delays.max_down.push(maxDelayDown);
    } else {
      delays.avg_down.push(null);
      delays.max_down.push(null);
    }
  }
  return delays;
}

function computeChainCorridorUpAll(data: NetworkData, offsets: number[]): {
  chain_up_start: Array<number|null>;
  chain_up_end: Array<number|null>;
} {
  const { intersections, travel } = data;
  const n = intersections.length;
  const travelUp: number[] = [];
  
  for (let i = 0; i < n-1; i++) {
    const dist = intersections[i+1].distance - intersections[i].distance;
    travelUp.push((dist/travel.up.speed) * 3.6);
  }
  
  const chain_up_start = new Array(n).fill(null) as Array<number|null>;
  const chain_up_end = new Array(n).fill(null) as Array<number|null>;

  for (let i = 0; i < n; i++) {
    if (i === n-1) {
      chain_up_start[i] = 0;
      chain_up_end[i] = 0;
      continue;
    }

    const curr = intersections[i];
    const next = intersections[i+1];
    if (!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up) {
      chain_up_start[i] = null;
      chain_up_end[i] = null;
      continue;
    }

    const travelTime = travelUp[i];
    const currGreen = curr.green_up[0];
    const nextGreen = next.green_up[0];
    const currStart = offsets[i] + currGreen.start;
    const Lc = Math.max(currStart + travelTime, offsets[i+1] + nextGreen.start);
    const Uc = Math.min(currStart + travelTime + currGreen.duration, offsets[i+1] + nextGreen.start + nextGreen.duration);

    if (Lc > Uc) {
      chain_up_start[i] = null;
      chain_up_end[i] = null;
      continue;
    }

    chain_up_start[i] = Lc;
    chain_up_end[i] = Uc;
  }
  
  return { chain_up_start, chain_up_end };
}

function computeChainCorridorDownAll(data: NetworkData, offsets: number[]): {
  chain_down_start: Array<number|null>;
  chain_down_end: Array<number|null>;
} {
  const { intersections, travel } = data;
  const n = intersections.length;
  const travelDown: number[] = [];
  
  for (let i = 0; i < n-1; i++) {
    const dist = intersections[i+1].distance - intersections[i].distance;
    travelDown.push((dist/travel.down.speed) * 3.6);
  }
  
  const chain_down_start = new Array(n).fill(null) as Array<number|null>;
  const chain_down_end = new Array(n).fill(null) as Array<number|null>;

  for (let i = n-1; i >= 0; i--) {
    if (i === 0) {
      chain_down_start[i] = 0;
      chain_down_end[i] = 0;
      continue;
    }

    const curr = intersections[i];
    const prev = intersections[i-1];
    if (!curr.green_down?.length || !prev.green_down?.length || !curr.cycle_down || !prev.cycle_down) {
      chain_down_start[i] = null;
      chain_down_end[i] = null;
      continue;
    }

    const travelTime = travelDown[i-1];
    const currGreen = curr.green_down[0];
    const prevGreen = prev.green_down[0];
    const currStart = offsets[i] + currGreen.start;
    const Lc = Math.max(currStart + travelTime, offsets[i-1] + prevGreen.start);
    const Uc = Math.min(currStart + travelTime + currGreen.duration, offsets[i-1] + prevGreen.start + prevGreen.duration);

    if (Lc > Uc) {
      chain_down_start[i] = null;
      chain_down_end[i] = null;
      continue;
    }

    chain_down_start[i] = Lc;
    chain_down_end[i] = Uc;
  }
  
  return { chain_down_start, chain_down_end };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const bodyText = await req.text();
    if (!bodyText) {
      throw new Error("Request body is empty");
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (e) {
      throw new Error("Invalid JSON in request body");
    }

    const { data, weights, manualOffsets } = parsedBody;
    if (!data || !weights) {
      throw new Error("Missing required fields: data or weights");
    }

    // baseline=0
    const baselineOffsets = new Array(data.intersections.length).fill(0);
    const baselineBandwidth = calculateCorridorBandwidth(data, baselineOffsets);
    const baselineDelays = calculateDelays(data, baselineOffsets);
    const chainAllUpBase = computeChainCorridorUpAll(data, baselineOffsets);
    const chainAllDownBase = computeChainCorridorDownAll(data, baselineOffsets);

    const baselineResults = {
      status: "Success",
      offsets: baselineOffsets,
      objective_value: null,
      corridorBW_up: baselineBandwidth.up,
      corridorBW_down: baselineBandwidth.down,
      avg_delay_up: baselineDelays.avg_up,
      avg_delay_down: baselineDelays.avg_down,
      max_delay_up: baselineDelays.max_up,
      max_delay_down: baselineDelays.max_down,
      chain_up_start: chainAllUpBase.chain_up_start,
      chain_up_end: chainAllUpBase.chain_up_end,
      chain_down_start: chainAllDownBase.chain_down_start,
      chain_down_end: chainAllDownBase.chain_down_end
    };

    // optimized
    const optimizedOffsets = calculateOffsets(data);
    const optimizedBandwidth = calculateCorridorBandwidth(data, optimizedOffsets);
    const optimizedDelays = calculateDelays(data, optimizedOffsets);
    const chainAllUpOpt = computeChainCorridorUpAll(data, optimizedOffsets);
    const chainAllDownOpt = computeChainCorridorDownAll(data, optimizedOffsets);

    const optimizedResults = {
      status: "Success",
      offsets: optimizedOffsets,
      objective_value: null,
      corridorBW_up: optimizedBandwidth.up,
      corridorBW_down: optimizedBandwidth.down,
      avg_delay_up: optimizedDelays.avg_up,
      avg_delay_down: optimizedDelays.avg_down,
      max_delay_up: optimizedDelays.max_up,
      max_delay_down: optimizedDelays.max_down,
      chain_up_start: chainAllUpOpt.chain_up_start,
      chain_up_end: chainAllUpOpt.chain_up_end,
      chain_down_start: chainAllDownOpt.chain_down_start,
      chain_down_end: chainAllDownOpt.chain_down_end
    };

    // manual (if manualOffsets provided)
    let manual_results = null;
    if (manualOffsets && manualOffsets.length === data.intersections.length) {
      // Force first intersection offset=0
      const normalizedOffsets = [...manualOffsets];
      normalizedOffsets[0] = 0;
      
      const manualBandwidth = calculateCorridorBandwidth(data, normalizedOffsets);
      const manualDelays = calculateDelays(data, normalizedOffsets);
      const chainAllUpMan = computeChainCorridorUpAll(data, normalizedOffsets);
      const chainAllDownMan = computeChainCorridorDownAll(data, normalizedOffsets);

      manual_results = {
        status: "Success",
        offsets: normalizedOffsets,
        objective_value: null,
        corridorBW_up: manualBandwidth.up,
        corridorBW_down: manualBandwidth.down,
        avg_delay_up: manualDelays.avg_up,
        avg_delay_down: manualDelays.avg_down,
        max_delay_up: manualDelays.max_up,
        max_delay_down: manualDelays.max_down,
        chain_up_start: chainAllUpMan.chain_up_start,
        chain_up_end: chainAllUpMan.chain_up_end,
        chain_down_start: chainAllDownMan.chain_down_start,
        chain_down_end: chainAllDownMan.chain_down_end
      };
    }

    const response = {
      baseline_results: baselineResults,
      optimized_results: optimizedResults,
      manual_results: manual_results
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
