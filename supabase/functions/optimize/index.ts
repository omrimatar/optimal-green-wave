
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper Functions
function computeBaseline(data: any, weights: any) {
  // Initialize offsets to 0
  const offsets = new Array(data.intersections.length).fill(0);
  
  // Calculate travel times
  const travelUp: number[] = [];
  const travelDown: number[] = [];
  for (let i = 0; i < data.intersections.length - 1; i++) {
    const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
    travelUp.push(Math.round((dist * 3.6) / data.travel.speedUp));
    travelDown.push(Math.round((dist * 3.6) / data.travel.speedDown));
  }
  
  // Calculate chain bandwidths
  const chainUp = chainBWUp(offsets, data, travelUp);
  const chainDown = chainBWDown(offsets, data, travelDown);
  
  return {
    status: "Success",
    offsets: offsets,
    objective_value: null,
    corridorBW_up: chainUp,
    corridorBW_down: chainDown,
    chain_corridorBW_up: chainUp,
    chain_corridorBW_down: chainDown,
    local_up: [],
    local_down: [],
    overlap_up: [],
    overlap_down: [],
    avg_delay_up: [],
    avg_delay_down: [],
    max_delay_up: [],
    max_delay_down: [],
    chain_up_start: [],
    chain_up_end: [],
    chain_down_start: [],
    chain_down_end: []
  };
}

function optimizeGreenWave(data: any, weights: any) {
  // כאן נשתמש באלגוריתם פשוט לאופטימיזציה בשלב ראשון
  const offsets = new Array(data.intersections.length).fill(0);
  
  // נחשב זמני נסיעה
  const travelTimes = [];
  for (let i = 0; i < data.intersections.length - 1; i++) {
    const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
    const time = Math.round((dist * 3.6) / data.travel.speedUp);
    travelTimes.push(time);
  }
  
  // נאופטמז את ההיסטים באופן פשוט
  for (let i = 1; i < data.intersections.length; i++) {
    offsets[i] = travelTimes[i-1] % data.intersections[i].cycle_up;
  }
  
  // נחשב את רוחב הפס בשני הכיוונים
  const travelUp = travelTimes;
  const travelDown = travelTimes.map(t => t); // בשלב זה נשתמש באותם זמנים
  
  const chainUp = chainBWUp(offsets, data, travelUp);
  const chainDown = chainBWDown(offsets, data, travelDown);
  
  return {
    status: "Success",
    offsets: offsets,
    objective_value: chainUp + chainDown, // ערך אובייקטיבי פשוט
    corridorBW_up: chainUp,
    corridorBW_down: chainDown,
    chain_corridorBW_up: chainUp,
    chain_corridorBW_down: chainDown,
    local_up: [],
    local_down: [],
    overlap_up: [],
    overlap_down: [],
    avg_delay_up: [],
    avg_delay_down: [],
    max_delay_up: [],
    max_delay_down: [],
    chain_up_start: [],
    chain_up_end: [],
    chain_down_start: [],
    chain_down_end: []
  };
}

function chainBWUp(offsets: number[], data: any, travelUp: number[]): number {
  const n = data.intersections.length;
  if (n < 2) return 0;
  
  let minBandwidth = Infinity;
  
  for (let i = 0; i < n - 1; i++) {
    const curr = data.intersections[i];
    const next = data.intersections[i + 1];
    
    const currPhase = curr.green_up[0];
    const nextPhase = next.green_up[0];
    
    const currStart = (offsets[i] + currPhase.start) % curr.cycle_up;
    const nextStart = (offsets[i + 1] + nextPhase.start) % next.cycle_up;
    
    const arrivalTime = (currStart + travelUp[i]) % next.cycle_up;
    const bandwidth = Math.min(currPhase.duration, nextPhase.duration);
    
    const effectiveBandwidth = Math.max(0, bandwidth - Math.abs(arrivalTime - nextStart));
    minBandwidth = Math.min(minBandwidth, effectiveBandwidth);
  }
  
  return minBandwidth === Infinity ? 0 : minBandwidth;
}

function chainBWDown(offsets: number[], data: any, travelDown: number[]): number {
  const n = data.intersections.length;
  if (n < 2) return 0;
  
  let minBandwidth = Infinity;
  
  for (let i = n - 1; i > 0; i--) {
    const curr = data.intersections[i];
    const prev = data.intersections[i - 1];
    
    const currPhase = curr.green_down[0];
    const prevPhase = prev.green_down[0];
    
    const currStart = (offsets[i] + currPhase.start) % curr.cycle_down;
    const prevStart = (offsets[i - 1] + prevPhase.start) % prev.cycle_down;
    
    const arrivalTime = (currStart + travelDown[i - 1]) % prev.cycle_down;
    const bandwidth = Math.min(currPhase.duration, prevPhase.duration);
    
    const effectiveBandwidth = Math.max(0, bandwidth - Math.abs(arrivalTime - prevStart));
    minBandwidth = Math.min(minBandwidth, effectiveBandwidth);
  }
  
  return minBandwidth === Infinity ? 0 : minBandwidth;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const bodyText = await req.text();
    if (!bodyText) {
      throw new Error('Request body is empty');
    }

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { data, weights, manualOffsets } = parsedBody;
    
    if (!data || !weights) {
      throw new Error('Missing required fields: data or weights');
    }

    console.log('Received request with data:', data);
    console.log('Weights:', weights);
    console.log('Manual offsets:', manualOffsets);

    // חישוב baseline
    const baselineRes = computeBaseline(data, weights);
    console.log('Baseline results:', baselineRes);

    // חישוב אופטימיזציה
    const optimizedRes = optimizeGreenWave(data, weights);
    console.log('Optimized results:', optimizedRes);

    // חישוב תוצאות ידניות אם יש
    let manualRes = null;
    if (manualOffsets && manualOffsets.length === data.intersections.length) {
      const normalizedOffsets = [...manualOffsets];
      normalizedOffsets[0] = 0;
      
      const travelUp: number[] = [];
      const travelDown: number[] = [];
      for (let i = 0; i < data.intersections.length - 1; i++) {
        const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
        travelUp.push(Math.round((dist * 3.6) / data.travel.speedUp));
        travelDown.push(Math.round((dist * 3.6) / data.travel.speedDown));
      }
      
      const chainUp = chainBWUp(normalizedOffsets, data, travelUp);
      const chainDown = chainBWDown(normalizedOffsets, data, travelDown);
      
      manualRes = {
        status: "Success",
        offsets: normalizedOffsets,
        objective_value: null,
        corridorBW_up: chainUp,
        corridorBW_down: chainDown,
        chain_corridorBW_up: chainUp,
        chain_corridorBW_down: chainDown,
        local_up: [],
        local_down: [],
        overlap_up: [],
        overlap_down: [],
        avg_delay_up: [],
        avg_delay_down: [],
        max_delay_up: [],
        max_delay_down: [],
        chain_up_start: [],
        chain_up_end: [],
        chain_down_start: [],
        chain_down_end: []
      };
    }

    const response = {
      baseline_results: baselineRes,
      optimized_results: optimizedRes,
      manual_results: manualRes
    };

    console.log('Sending response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        type: error.constructor.name,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});
