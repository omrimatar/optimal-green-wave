
-- Create table for tracking IP visits
CREATE TABLE IF NOT EXISTS public.ip_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address TEXT NOT NULL,
  page TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  user_agent TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on ip_address for faster queries
CREATE INDEX IF NOT EXISTS idx_ip_visits_ip_address ON public.ip_visits (ip_address);

-- Create index on visited_at for date range queries
CREATE INDEX IF NOT EXISTS idx_ip_visits_visited_at ON public.ip_visits (visited_at);

-- Add RLS policies
ALTER TABLE public.ip_visits ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to insert
CREATE POLICY "Service role can insert ip_visits" 
  ON public.ip_visits FOR INSERT 
  TO service_role 
  USING (true);

-- Only allow authenticated users with admin access to view data
CREATE POLICY "Admins can select ip_visits" 
  ON public.ip_visits FOR SELECT 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');
