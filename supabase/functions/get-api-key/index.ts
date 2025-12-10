/**
 * Edge Function: get-api-key
 *
 * Securely retrieves decrypted API keys for the authenticated user's tenant.
 * This keeps API keys server-side and never exposes them to the client.
 *
 * Usage:
 *   POST /functions/v1/get-api-key
 *   Body: { "service": "grok" | "claude" | "stealthgpt" | "dataforseo" }
 *   Returns: { "key": "decrypted-api-key" } or { "error": "..." }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createUserClient,
  createAdminClient,
  getTenantContext,
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/supabase-client.ts'

// Allowed services that can be requested
const ALLOWED_SERVICES = ['grok', 'claude', 'stealthgpt', 'dataforseo', 'wordpress']

interface RequestBody {
  service: string
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    // Get tenant context
    const context = await getTenantContext(req)
    if (!context) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body: RequestBody = await req.json()

    if (!body.service) {
      return errorResponse('Service parameter is required')
    }

    if (!ALLOWED_SERVICES.includes(body.service)) {
      return errorResponse(`Invalid service. Allowed: ${ALLOWED_SERVICES.join(', ')}`)
    }

    // Get the decrypted API key
    const admin = createAdminClient()

    // Call the decrypt function
    // Note: This requires the get_decrypted_api_key function to exist in the database
    const { data, error } = await admin.rpc('get_decrypted_api_key', {
      p_tenant_id: context.tenantId,
      p_service: body.service,
    })

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to retrieve API key', 500)
    }

    if (!data) {
      return errorResponse(`No API key configured for ${body.service}`, 404)
    }

    // Update last_used_at
    await admin
      .from('tenant_api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: admin.rpc('increment_usage_count'),
      })
      .eq('tenant_id', context.tenantId)
      .eq('service', body.service)

    // Return the key (only accessible server-side via this function)
    return jsonResponse({ key: data })

  } catch (err) {
    console.error('Error:', err)
    return errorResponse('Internal server error', 500)
  }
})
