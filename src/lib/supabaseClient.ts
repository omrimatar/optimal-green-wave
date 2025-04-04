
import { createClient } from '@supabase/supabase-js';

// Using hardcoded Supabase URL and anon key (for demo purposes only)
// In a production environment, these should be environment variables
const supabaseUrl = "https://hpdsonaiwqjitzdxfnrp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZHNvbmFpd3FqaXR6ZHhmbnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYxOTYzMTUsImV4cCI6MTkzMTc3MjMxNX0.RQZ_QbZ2fJqj5ct-m3KCy1rYCkOKtclSCmzZ4l0DpUA";

// Create and export Supabase client with error handling
let supabaseInstance;
try {
  console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 12) + '...');
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        // For debugging network issues
        console.log('Supabase fetch:', typeof url === 'string' ? url : 'Request object');
        return fetch(url, options);
      }
    }
  });
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Create a minimal mock client for fallback
  supabaseInstance = {
    from: () => ({
      insert: async () => ({ error: new Error('Supabase client failed to initialize') })
    }),
    rpc: async () => ({ 
      data: null, 
      error: new Error('Supabase client failed to initialize') 
    })
  };
}

export const supabase = supabaseInstance;

/**
 * Gets or creates a unique visitor fingerprint and stores it in localStorage.
 * @returns The visitor fingerprint (UUID string).
 */
export function getOrCreateVisitorFingerprint(): string {
  const storageKey = 'visitor_fp';
  let fingerprint = localStorage.getItem(storageKey);

  if (!fingerprint) {
    fingerprint = crypto.randomUUID(); // Creates a standard UUID v4
    try {
      localStorage.setItem(storageKey, fingerprint);
    } catch (error) {
      // In case localStorage is not available
      console.warn("Could not save fingerprint to localStorage:", error);
    }
  }
  return fingerprint;
}
