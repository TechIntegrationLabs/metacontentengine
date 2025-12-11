import { createClient } from '@supabase/supabase-js';
import { env, validateEnv } from '@content-engine/config';

// Validate environment on import
validateEnv();

/**
 * Supabase client for PCC (Polynesian Cultural Center) app
 *
 * This client uses the centralized config from @content-engine/config
 * which loads environment variables in this order:
 *
 * 1. Root .env (defaults)
 * 2. Root .env.local (shared secrets - gitignored)
 * 3. App .env.local (app-specific overrides - gitignored)
 *
 * Required environment variables:
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous/public key
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
