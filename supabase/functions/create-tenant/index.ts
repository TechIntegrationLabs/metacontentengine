/**
 * Edge Function: create-tenant
 *
 * Creates a new tenant with initial configuration.
 * This is typically called during onboarding.
 *
 * Usage:
 *   POST /functions/v1/create-tenant
 *   Body: {
 *     "name": "Company Name",
 *     "slug": "company-slug",
 *     "appName": "My Content Engine",
 *     "primaryDomain": "example.com",
 *     "adminEmail": "admin@example.com",
 *     "adminPassword": "secure-password"
 *   }
 *
 * Returns: { "tenantId": "uuid", "userId": "uuid" }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAdminClient,
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/supabase-client.ts'

interface CreateTenantRequest {
  name: string
  slug: string
  appName?: string
  primaryDomain?: string
  primaryColor?: string
  plan?: string
  adminEmail: string
  adminPassword: string
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
    const body: CreateTenantRequest = await req.json()

    // Validate required fields
    if (!body.name || !body.slug || !body.adminEmail || !body.adminPassword) {
      return errorResponse('Missing required fields: name, slug, adminEmail, adminPassword')
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return errorResponse('Slug must be lowercase alphanumeric with hyphens only')
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.adminEmail)) {
      return errorResponse('Invalid email format')
    }

    // Validate password strength
    if (body.adminPassword.length < 8) {
      return errorResponse('Password must be at least 8 characters')
    }

    const admin = createAdminClient()

    // Check if slug already exists
    const { data: existingTenant } = await admin
      .from('tenants')
      .select('id')
      .eq('slug', body.slug)
      .single()

    if (existingTenant) {
      return errorResponse('Tenant with this slug already exists', 409)
    }

    // Create the tenant
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .insert({
        name: body.name,
        slug: body.slug,
        app_name: body.appName || 'Content Engine',
        primary_domain: body.primaryDomain,
        primary_color: body.primaryColor || '#6366f1',
        plan: body.plan || 'starter',
        status: 'active',
        features: {
          maxContributors: body.plan === 'pro' ? 10 : 3,
          maxArticlesPerMonth: body.plan === 'pro' ? 500 : 50,
          aiGenerationEnabled: true,
          advancedAnalytics: body.plan === 'pro',
        },
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Failed to create tenant:', tenantError)
      return errorResponse('Failed to create tenant', 500)
    }

    // Create the admin user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: body.adminEmail,
      password: body.adminPassword,
      email_confirm: true,
      app_metadata: {
        tenant_id: tenant.id,
        role: 'owner',
      },
    })

    if (authError) {
      // Rollback tenant creation
      await admin.from('tenants').delete().eq('id', tenant.id)
      console.error('Failed to create user:', authError)
      return errorResponse('Failed to create admin user: ' + authError.message, 500)
    }

    // Create tenant_users record
    const { error: membershipError } = await admin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: authData.user.id,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      })

    if (membershipError) {
      console.error('Failed to create membership:', membershipError)
      // Don't rollback - user and tenant exist, just log the error
    }

    // Create default settings
    const defaultSettings = [
      {
        tenant_id: tenant.id,
        key: 'generation',
        value: {
          defaultWordCount: 2000,
          minWordCount: 1500,
          maxWordCount: 2500,
          qualityThreshold: 85,
          maxFixAttempts: 3,
        },
      },
      {
        tenant_id: tenant.id,
        key: 'humanization',
        value: {
          primaryProvider: 'stealthgpt',
          fallbackProvider: 'claude',
          detectionThreshold: 25,
        },
      },
      {
        tenant_id: tenant.id,
        key: 'publishing',
        value: {
          autoPublishEnabled: false,
          defaultPostStatus: 'draft',
          requireReview: true,
        },
      },
    ]

    await admin.from('tenant_settings').insert(defaultSettings)

    // Create default contributor
    await admin.from('contributors').insert({
      tenant_id: tenant.id,
      name: 'Default Author',
      display_name: 'Default Author',
      is_active: true,
      is_default: true,
      voice_profile: {
        formalityScale: 5,
        description: 'A professional, knowledgeable writer with a clear and accessible style.',
        guidelines: 'Write clearly and professionally. Be informative and helpful.',
        signaturePhrases: [],
        phrasesToAvoid: [],
      },
    })

    // Log activity
    await admin.from('activity_log').insert({
      tenant_id: tenant.id,
      user_id: authData.user.id,
      action: 'tenant_created',
      entity_type: 'tenant',
      entity_id: tenant.id,
      details: {
        name: body.name,
        slug: body.slug,
        plan: body.plan || 'starter',
      },
    })

    return jsonResponse({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      userId: authData.user.id,
      message: 'Tenant created successfully',
    })

  } catch (err) {
    console.error('Error:', err)
    return errorResponse('Internal server error', 500)
  }
})
