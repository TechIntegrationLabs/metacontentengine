/**
 * Supabase Client
 *
 * Centralized Supabase client instance for the GetEducated app.
 * Uses environment configuration from @content-engine/config.
 *
 * @module supabase
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@content-engine/config';

// Validate required configuration
if (!env.supabaseUrl || !env.supabaseAnonKey) {
  if (env.isDevelopment) {
    console.warn(
      '[Supabase] Environment variables not set. Using mock mode.\n' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in root .env.local'
    );
  } else {
    throw new Error(
      'Supabase configuration is required in production. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
}

/**
 * Supabase client instance
 *
 * Configured with:
 * - Persistent sessions (survives page refresh)
 * - Auto token refresh (handles JWT expiry)
 * - Session detection from URL (for OAuth callbacks)
 */
export const supabase = createClient(
  env.supabaseUrl || '',
  env.supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
