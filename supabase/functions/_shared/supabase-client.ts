/**
 * Shared Supabase Client for Edge Functions
 *
 * This module provides authenticated Supabase clients for Edge Functions
 * with proper tenant context handling.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
export interface TenantContext {
  tenantId: string
  userId: string
  role: string
}

/**
 * Create a Supabase client with the user's JWT for RLS enforcement
 */
export function createUserClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization')

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader ?? '' },
      },
    }
  )
}

/**
 * Create a Supabase admin client (bypasses RLS)
 * Use with caution - only for operations that need full access
 */
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Extract tenant context from the request JWT
 */
export async function getTenantContext(req: Request): Promise<TenantContext | null> {
  const client = createUserClient(req)

  const { data: { user }, error } = await client.auth.getUser()

  if (error || !user) {
    console.error('Failed to get user:', error)
    return null
  }

  const tenantId = user.app_metadata?.tenant_id
  const role = user.app_metadata?.role ?? 'viewer'

  if (!tenantId) {
    console.error('User has no tenant_id in app_metadata')
    return null
  }

  return {
    tenantId,
    userId: user.id,
    role,
  }
}

/**
 * Verify the request has valid authentication
 */
export async function verifyAuth(req: Request): Promise<boolean> {
  const context = await getTenantContext(req)
  return context !== null
}

/**
 * Get the tenant's encrypted API key for a service
 */
export async function getTenantApiKey(
  tenantId: string,
  service: string
): Promise<string | null> {
  const admin = createAdminClient()

  // Use pgcrypto to decrypt the key
  const { data, error } = await admin.rpc('get_decrypted_api_key', {
    p_tenant_id: tenantId,
    p_service: service,
  })

  if (error) {
    console.error(`Failed to get API key for ${service}:`, error)
    return null
  }

  return data
}

/**
 * Standard CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}
