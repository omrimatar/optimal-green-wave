
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with public anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Track user visit with IP address
 * This sends the user's IP to a Supabase Edge Function that logs it
 * No personal data is stored, only IP and timestamp
 */
export const trackVisit = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('track-ip-visits', {
      body: { 
        page: window.location.pathname,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent
      }
    });
    
    if (error) {
      console.error('Error tracking visit:', error);
    }
    
    return { success: !error, data };
  } catch (err) {
    console.error('Failed to track visit:', err);
    return { success: false, error: err };
  }
};
