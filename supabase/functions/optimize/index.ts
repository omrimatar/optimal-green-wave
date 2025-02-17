
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Received request:', parsedBody);

    // בשלב זה, נחזיר תוצאות דמו בסיסיות לבדיקת התקשורת
    const demoResults = {
      baseline_results: {
        status: "Success",
        offsets: [0, 0],
        objective_value: 0,
        corridorBW_up: 0,
        corridorBW_down: 0,
        chain_corridorBW_up: 0,
        chain_corridorBW_down: 0,
        local_up: [],
        local_down: [],
        overlap_up: [],
        overlap_down: [],
        avg_delay_up: [],
        avg_delay_down: [],
        max_delay_up: [],
        max_delay_down: []
      },
      optimized_results: {
        status: "Success",
        offsets: [0, 20],
        objective_value: 10,
        corridorBW_up: 30,
        corridorBW_down: 30,
        chain_corridorBW_up: 30,
        chain_corridorBW_down: 30,
        local_up: [30],
        local_down: [30],
        overlap_up: [30],
        overlap_down: [30],
        avg_delay_up: [0],
        avg_delay_down: [0],
        max_delay_up: [0],
        max_delay_down: [0]
      }
    };

    console.log('Sending demo results:', demoResults);

    return new Response(JSON.stringify(demoResults), {
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
