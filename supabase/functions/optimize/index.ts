import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

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
    // אם אין מופעים ב-UP באחד מהם => אין חישוב, קובעים offset=0 או כל ערך
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
  let foundUpPair = false;   // מסמן האם נמצא לפחות זוג אחד עם מופעי up
  let foundDownPair = false; // מסמן האם נמצא לפחות זוג אחד עם מופעי down

  // כיוון UP
  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    if (!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up) {
      console.log(`Skipping corridorBW up at i=${i} because:`, {
        curr_green_up: curr.green_up?.length ? 'exists' : 'missing',
        next_green_up: next.green_up?.length ? 'exists' : 'missing',
        curr_cycle_up: curr.cycle_up ? 'exists' : 'missing',
        next_cycle_up: next.cycle_up ? 'exists' : 'missing'
      });
      continue;
    }
    foundUpPair = true;
    console.log(`Processing corridorBW up at i=${i}:`, {
      curr_green: curr.green_up[0],
      next_green: next.green_up[0],
      curr_cycle: curr.cycle_up,
      next_cycle: next.cycle_up
    });

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
      console.log(`Skipping corridorBW down at i=${i} because:`, {
        curr_green_down: curr.green_down?.length ? 'exists' : 'missing',
        prev_green_down: prev.green_down?.length ? 'exists' : 'missing',
        curr_cycle_down: curr.cycle_down ? 'exists' : 'missing',
        prev_cycle_down: prev.cycle_down ? 'exists' : 'missing'
      });
      continue;
    }
    foundDownPair = true;
    console.log(`Processing corridorBW down at i=${i}:`, {
      curr_green: curr.green_down[0],
      prev_green: prev.green_down[0],
      curr_cycle: curr.cycle_down,
      prev_cycle: prev.cycle_down
    });

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

  let upVal: number|null = null;
  if (foundUpPair) {
    // במקרה זה באמת היה זוג אחד לפחות
    upVal = minBandwidthUp === Infinity ? 0 : minBandwidthUp;
  }

  let downVal: number|null = null;
  if (foundDownPair) {
    // במקרה זה באמת היה זוג אחד לפחות
    downVal = minBandwidthDown === Infinity ? 0 : minBandwidthDown;
  }

  console.log('Final corridor bandwidth values:', { upVal, downVal });
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

/** פונקציות שרשור, אך אם אין מופע => מחזירים null. */

/** שרשור UP */
function computeChainCorridorUpAll(
  data: NetworkData,
  offsets: number[]
): { chain_up_start: Array<number|null>; chain_up_end: Array<number|null> } {
  const n = data.intersections.length;
  const travelUp: number[] = [];
  for(let i=0; i<n-1; i++){
    const dist = data.intersections[i+1].distance - data.intersections[i].distance;
    travelUp.push( (dist/data.travel.up.speed)*3.6 );
  }
  const chain_up_start = new Array(n).fill(null) as Array<number|null>;
  const chain_up_end   = new Array(n).fill(null) as Array<number|null>;

  for(let i=0;i<n;i++){
    if(i===n-1){
      chain_up_start[i]=0;
      chain_up_end[i]=0;
      continue;
    }

    const curr = data.intersections[i];
    const next = data.intersections[i+1];
    if(!curr.green_up?.length || !next.green_up?.length || !curr.cycle_up || !next.cycle_up){
      chain_up_start[i]=null;
      chain_up_end[i]=null;
      continue;
    }

    const travelTime = travelUp[i];
    const currGreen = curr.green_up[0];
    const nextGreen = next.green_up[0];
    const currStart = offsets[i]+currGreen.start;
    let Lc = Math.max(currStart + travelTime, offsets[i+1]+nextGreen.start);
    let Uc = Math.min(currStart+travelTime+currGreen.duration, offsets[i+1]+nextGreen.start+nextGreen.duration);

    if(Lc>Uc){
      chain_up_start[i]=null;
      chain_up_end[i]=null;
      continue;
    }

    for(let j=i+1; j<n-1; j++){
      const c1 = data.intersections[j];
      const c2 = data.intersections[j+1];
      if(!c1.green_up?.length || !c2.green_up?.length || !c1.cycle_up || !c2.cycle_up){
        // מפסיקים
        Lc=null; Uc=null;
        break;
      }
      const t = travelUp[j];
      if(Lc!==null && Uc!==null){
        Lc+=t; Uc+=t;
        const c1Green = c1.green_up[0];
        const c2Green = c2.green_up[0];
        const a2 = offsets[j]+ c1Green.start;
        const b2 = offsets[j+1]+ c2Green.start;
        const newL = Math.max(Lc, Math.max(a2,b2));
        const newU = Math.min(Uc, Math.min(a2+c1Green.duration,b2+c2Green.duration));
        if(newL>newU){
          Lc=null; Uc=null;
          break;
        } else {
          Lc=newL; Uc=newU;
        }
      }
    }
    chain_up_start[i]=Lc;
    chain_up_end[i]=Uc;
  }
  return { chain_up_start, chain_up_end };
}

/** שרשור DOWN */
function computeChainCorridorDownAll(
  data: NetworkData,
  offsets: number[]
): { chain_down_start: Array<number|null>, chain_down_end: Array<number|null> } {
  const n= data.intersections.length;
  const travelDown:number[] = [];
  for(let i=0; i<n-1;i++){
    const dist= data.intersections[i+1].distance - data.intersections[i].distance;
    travelDown.push((dist/data.travel.down.speed)*3.6);
  }
  const chain_down_start = new Array(n).fill(null) as Array<number|null>;
  const chain_down_end   = new Array(n).fill(null) as Array<number|null>;

  for(let i=n-1; i>=0; i--){
    if(i===0){
      chain_down_start[i]=0;
      chain_down_end[i]=0;
      continue;
    }
    const curr = data.intersections[i];
    const prev = data.intersections[i-1];
    if(!curr.green_down?.length || !prev.green_down?.length || !curr.cycle_down || !prev.cycle_down){
      chain_down_start[i]=null;
      chain_down_end[i]=null;
      continue;
    }
    const distance = curr.distance - prev.distance;
    let Lc: number|null, Uc: number|null;
    {
      const t= travelDown[i-1];
      const currG= curr.green_down[0];
      const prevG= prev.green_down[0];
      const a= offsets[i]+ currG.start + t;
      const c= a+ currG.duration;
      const b= offsets[i-1]+ prevG.start;
      const d= b+ prevG.duration;
      Lc= Math.max(a,b);
      Uc= Math.min(c,d);
      if(Lc>Uc){
        chain_down_start[i]=null;
        chain_down_end[i]=null;
        continue;
      }
    }
    for(let j=i-1; j>0; j--){
      const t= travelDown[j-1];
      if(Lc!==null && Uc!==null){
        Lc+=t; Uc+=t;
        const c1= data.intersections[j];
        const c2= data.intersections[j-1];
        if(!c1.green_down?.length || !c2.green_down?.length || !c1.cycle_down || !c2.cycle_down){
          Lc=null; Uc=null;
          break;
        }
        const c1G= c1.green_down[0];
        const c2G= c2.green_down[0];
        const a2= offsets[j]+ c1G.start;
        const b2= offsets[j-1]+ c2G.start;
        const newL= Math.max(Lc, Math.max(a2,b2));
        const newU= Math.min(Uc, Math.min(a2+c1G.duration, b2+c2G.duration));
        if(newL>newU){
          Lc=null; Uc=null;
          break;
        } else {
          Lc=newL; Uc=newU;
        }
      }
    }
    chain_down_start[i]= Lc;
    chain_down_end[i]= Uc;
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

    const { data, weights } = parsedBody;
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
      avg_delay_down: optimizedDelays.avg_delay_down,
      max_delay_up: optimizedDelays.max_up,
      max_delay_down: optimizedDelays.max_down,
      chain_up_start: chainAllUpOpt.chain_up_start,
      chain_up_end: chainAllUpOpt.chain_up_end,
      chain_down_start: chainAllDownOpt.chain_down_start,
      chain_down_end: chainAllDownOpt.chain_down_end
    };

    const response = {
      baseline_results: baselineResults,
      optimized_results: optimizedResults
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
