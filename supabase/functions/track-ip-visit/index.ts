
// Follow this setup guide to integrate the Supabase client side SDK: https://supabase.com/docs/guides/getting-started/quickstarts/typescript

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  source?: string;
  action?: string;
}

// Create a new table called 'ip_visits'
// You can run this SQL in the Supabase SQL Editor:
/*
CREATE TABLE public.ip_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip TEXT NOT NULL,
  user_agent TEXT,
  source TEXT,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ip_visits ENABLE ROW LEVEL SECURITY;

-- Only allow read access to admin users
CREATE POLICY "Allow select access for admin users only" 
  ON public.ip_visits 
  FOR SELECT 
  TO authenticated
  USING (auth.jwt() ->> 'app_metadata' ? 'is_admin' AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'is_admin' = 'true');

-- Allow the service role to insert
CREATE POLICY "Allow insert from service_role" 
  ON public.ip_visits 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX ip_visits_ip_idx ON public.ip_visits (ip);
CREATE INDEX ip_visits_created_at_idx ON public.ip_visits (created_at);
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get IP address from request headers
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Parse request body
    let body: RequestBody = {}
    try {
      body = await req.json()
    } catch (e) {
      // If JSON parsing fails, use empty body
      console.error('Error parsing request body:', e)
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Insert visit into ip_visits table
    const { data, error } = await supabaseClient
      .from('ip_visits')
      .insert([
        { 
          ip, 
          user_agent: userAgent, 
          source: body.source || 'green-wave-app', 
          action: body.action || 'visit'
        }
      ])
      .select()

    if (error) {
      console.error('Error inserting visit:', error)
      throw error
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Visit tracked' }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200
      }
    )
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400
      }
    )
  }
})
