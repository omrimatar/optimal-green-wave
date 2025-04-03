
-- Create the ip_visits table for tracking visitor IPs
CREATE TABLE IF NOT EXISTS public.ip_visits (
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
CREATE POLICY IF NOT EXISTS "Allow select access for admin users only" 
  ON public.ip_visits 
  FOR SELECT 
  TO authenticated
  USING (auth.jwt() ->> 'app_metadata' ? 'is_admin' AND (auth.jwt() ->> 'app_metadata')::jsonb ->> 'is_admin' = 'true');

-- Allow the service role to insert
CREATE POLICY IF NOT EXISTS "Allow insert from service_role" 
  ON public.ip_visits 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS ip_visits_ip_idx ON public.ip_visits (ip);
CREATE INDEX IF NOT EXISTS ip_visits_created_at_idx ON public.ip_visits (created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
DROP TRIGGER IF EXISTS update_ip_visits_updated_at ON public.ip_visits;
CREATE TRIGGER update_ip_visits_updated_at
BEFORE UPDATE ON public.ip_visits
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();
