
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const n = data.intersections.length;
    const baselineRes = {
      status: "Optimal",
      offsets: new Array(n).fill(0),
      objective_value: 100,
      overlap_up: new Array(n-1).fill(20),
      avg_delay_up: new Array(n-1).fill(15),
      max_delay_up: new Array(n-1).fill(25),
      overlap_down: new Array(n-1).fill(20),
      avg_delay_down: new Array(n-1).fill(15),
      max_delay_down: new Array(n-1).fill(25),
      corridorBW_up: 30,
      corridorBW_down: 30
    };

    const optimizedRes = {
      status: "Optimal",
      offsets: Array.from({length: n}, () => Math.floor(Math.random() * 90)),
      objective_value: 150,
      overlap_up: new Array(n-1).fill(25),
      avg_delay_up: new Array(n-1).fill(10),
      max_delay_up: new Array(n-1).fill(20),
      overlap_down: new Array(n-1).fill(25),
      avg_delay_down: new Array(n-1).fill(10),
      max_delay_down: new Array(n-1).fill(20),
      corridorBW_up: 40,
      corridorBW_down: 40
    };

    const response = {
      baseline_results: baselineRes,
      optimized_results: optimizedRes,
      db_result: {
        status: "Success",
        message: "Function invoked successfully"
      }
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
