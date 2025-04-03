
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Tracks a user visit by calling the Supabase Edge Function
 * @returns Promise that resolves when tracking is complete
 */
export async function trackVisit(): Promise<void> {
  try {
    // Skip tracking if we're in development mode
    if (import.meta.env.DEV) {
      console.log('Skipping visit tracking in development mode');
      return;
    }
    
    // Skip if supabase keys are not configured
    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase configuration missing, skipping visit tracking');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('track-ip-visit', {
      method: 'POST',
      body: { source: 'green-wave-app', action: 'visit' }
    });

    if (error) {
      console.error('Error tracking visit:', error);
      return;
    }

    console.log('Visit tracked successfully:', data);
  } catch (err) {
    console.error('Failed to track visit:', err);
  }
}
