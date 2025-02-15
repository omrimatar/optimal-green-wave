
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

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
    const { data, weights } = await req.json();
    console.log('Received request with data:', { data, weights });
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: dbResult, error: dbError } = await supabaseClient
      .rpc('invoke_optimize_function', { data: { data, weights } });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Database result:', dbResult);
    
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

    return new Response(
      JSON.stringify({
        baseline_results: baselineRes,
        optimized_results: optimizedRes,
        db_result: dbResult
      }),
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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});

