
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  green_up: GreenPhase[];
  green_down: GreenPhase[];
  cycle_up: number;
  cycle_down: number;
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
    const curr = intersections[i];
    if (i === 0) {
      // צומת ראשון - היסט 0
      offsets.push(0);
      continue;
    }

    const prev = intersections[i-1];
    const distance = curr.distance - prev.distance;
    
    // חישוב זמן נסיעה בשניות
    const travelTimeUp = (distance / travel.up.speed) * 3.6; // המרה ממטר/שניה לקמ"ש
    
    // חישוב היסט אופטימלי
    const greenPhaseUp = curr.green_up[0];
    const prevGreenPhaseUp = prev.green_up[0];
    
    const idealOffset = (prevGreenPhaseUp.start + prevGreenPhaseUp.duration/2 + travelTimeUp - greenPhaseUp.duration/2) % curr.cycle_up;
    
    offsets.push(Math.round(idealOffset));
  }
  
  return offsets;
}

function calculateCorridorBandwidth(data: NetworkData, offsets: number[]): { up: number; down: number } {
  const { intersections, travel } = data;
  let minBandwidthUp = Infinity;
  let minBandwidthDown = Infinity;

  // חישוב רוחב מסדרון בכיוון למעלה
  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    const distance = next.distance - curr.distance;
    const travelTime = (distance / travel.up.speed) * 3.6;

    const currGreen = curr.green_up[0];
    const nextGreen = next.green_up[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_up;
    const nextStart = (offsets[i + 1] + nextGreen.start) % next.cycle_up;
    
    const bandwidth = Math.min(currGreen.duration, nextGreen.duration);
    minBandwidthUp = Math.min(minBandwidthUp, bandwidth);
  }

  // חישוב רוחב מסדרון בכיוון למטה
  for (let i = intersections.length - 1; i > 0; i--) {
    const curr = intersections[i];
    const prev = intersections[i - 1];
    const distance = curr.distance - prev.distance;
    const travelTime = (distance / travel.down.speed) * 3.6;

    const currGreen = curr.green_down[0];
    const prevGreen = prev.green_down[0];
    const currStart = (offsets[i] + currGreen.start) % curr.cycle_down;
    const prevStart = (offsets[i - 1] + prevGreen.start) % prev.cycle_down;
    
    const bandwidth = Math.min(currGreen.duration, prevGreen.duration);
    minBandwidthDown = Math.min(minBandwidthDown, bandwidth);
  }

  return {
    up: minBandwidthUp === Infinity ? 0 : minBandwidthUp,
    down: minBandwidthDown === Infinity ? 0 : minBandwidthDown
  };
}

function calculateDelays(data: NetworkData, offsets: number[]): {
  avg_up: number[];
  avg_down: number[];
  max_up: number[];
  max_down: number[];
} {
  const { intersections } = data;
  const delays = {
    avg_up: [],
    avg_down: [],
    max_up: [],
    max_down: []
  };

  // חישוב עיכובים ממוצעים ומקסימליים לכל כיוון
  for (let i = 0; i < intersections.length - 1; i++) {
    const curr = intersections[i];
    const next = intersections[i + 1];
    
    // עיכובים בכיוון למעלה
    const currGreenUp = curr.green_up[0];
    const nextGreenUp = next.green_up[0];
    const currStartUp = (offsets[i] + currGreenUp.start) % curr.cycle_up;
    const nextStartUp = (offsets[i + 1] + nextGreenUp.start) % next.cycle_up;
    
    const avgDelayUp = Math.abs(nextStartUp - currStartUp) % curr.cycle_up;
    const maxDelayUp = Math.max(curr.cycle_up - currGreenUp.duration, next.cycle_up - nextGreenUp.duration);
    
    delays.avg_up.push(avgDelayUp);
    delays.max_up.push(maxDelayUp);

    // עיכובים בכיוון למטה
    const currGreenDown = curr.green_down[0];
    const nextGreenDown = next.green_down[0];
    const currStartDown = (offsets[i] + currGreenDown.start) % curr.cycle_down;
    const nextStartDown = (offsets[i + 1] + nextGreenDown.start) % next.cycle_down;
    
    const avgDelayDown = Math.abs(nextStartDown - currStartDown) % curr.cycle_down;
    const maxDelayDown = Math.max(curr.cycle_down - currGreenDown.duration, next.cycle_down - nextGreenDown.duration);
    
    delays.avg_down.push(avgDelayDown);
    delays.max_down.push(maxDelayDown);
  }

  return delays;
}

console.log("Loading optimize function");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const bodyText = await req.text();
    console.log('Raw request body:', bodyText);

    if (!bodyText) {
      throw new Error('Request body is empty');
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { data, weights } = parsedBody;
    
    if (!data || !weights) {
      throw new Error('Missing required fields: data or weights');
    }

    console.log('Received request with data:', { data, weights });
    
    // חישוב תוצאות בסיס (מצב נוכחי - כל ההיסטים 0)
    const baselineOffsets = new Array(data.intersections.length).fill(0);
    const baselineBandwidth = calculateCorridorBandwidth(data, baselineOffsets);
    const baselineDelays = calculateDelays(data, baselineOffsets);
    
    const baselineResults = {
      status: "Success",
      offsets: baselineOffsets,
      objective_value: null,
      corridorBW_up: baselineBandwidth.up,
      corridorBW_down: baselineBandwidth.down,
      avg_delay_up: baselineDelays.avg_up,
      avg_delay_down: baselineDelays.avg_down,
      max_delay_up: baselineDelays.max_up,
      max_delay_down: baselineDelays.max_down
    };

    // חישוב תוצאות אופטימליות
    const optimizedOffsets = calculateOffsets(data);
    const optimizedBandwidth = calculateCorridorBandwidth(data, optimizedOffsets);
    const optimizedDelays = calculateDelays(data, optimizedOffsets);

    const optimizedResults = {
      status: "Success",
      offsets: optimizedOffsets,
      objective_value: null,
      corridorBW_up: optimizedBandwidth.up,
      corridorBW_down: optimizedBandwidth.down,
      avg_delay_up: optimizedDelays.avg_up,
      avg_delay_down: optimizedDelays.avg_down,
      max_delay_up: optimizedDelays.max_up,
      max_delay_down: optimizedDelays.max_down
    };

    const response = {
      baseline_results: baselineResults,
      optimized_results: optimizedResults
    };

    console.log('Sending response:', response);

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
