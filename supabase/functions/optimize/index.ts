
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
    
    // אתחול תוצאות בסיס (מצב נוכחי) - כל ההיסטים הם 0
    const baselineResults = {
      status: "Success",
      offsets: new Array(data.intersections.length).fill(0),
      objective_value: null,
      corridorBW_up: 0,
      corridorBW_down: 0,
      avg_delay_up: [0],
      avg_delay_down: [0],
      max_delay_up: [0],
      max_delay_down: [0]
    };

    // TODO: כאן תבוא הלוגיקה של האופטימיזציה האמיתית
    const optimizedResults = {
      status: "Success",
      offsets: new Array(data.intersections.length).fill(0), // יוחלף בחישוב אמיתי
      objective_value: null,
      corridorBW_up: 0,
      corridorBW_down: 0,
      avg_delay_up: [0],
      avg_delay_down: [0],
      max_delay_up: [0],
      max_delay_down: [0]
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
