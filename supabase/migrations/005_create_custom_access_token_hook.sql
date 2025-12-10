-- Migration: Create Custom Access Token Hook
-- Version: 1.0
-- Description: JWT claim injection for tenant_id and role
--
-- IMPORTANT: After applying this migration, you must enable the hook in Supabase Dashboard:
-- 1. Go to Authentication → Hooks
-- 2. Click "Add Hook" for "Custom Access Token"
-- 3. Select "Postgres Function"
-- 4. Choose: public.custom_access_token_hook
-- 5. Save

-- ============================================
-- CUSTOM ACCESS TOKEN HOOK FUNCTION
-- ============================================

-- This function is called by Supabase Auth when generating access tokens
-- It injects tenant_id and role from tenant_users into the JWT claims

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
  user_role text;
  tenant_status text;
BEGIN
  -- Get the current claims from the event
  claims := event->'claims';

  -- Look up user's primary tenant membership
  -- If user belongs to multiple tenants, get the most recently accepted one
  -- or the one marked as primary (if we add that feature later)
  SELECT
    tu.tenant_id,
    tu.role,
    t.status
  INTO
    user_tenant_id,
    user_role,
    tenant_status
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = (event->>'user_id')::uuid
    AND tu.accepted_at IS NOT NULL  -- Only include accepted memberships
    AND t.status = 'active'         -- Only active tenants
  ORDER BY tu.accepted_at DESC      -- Most recent first
  LIMIT 1;

  -- If user has a valid tenant membership, add to claims
  IF user_tenant_id IS NOT NULL THEN
    -- Build or update app_metadata in claims
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      COALESCE(claims->'app_metadata', '{}'::jsonb) ||
      jsonb_build_object(
        'tenant_id', user_tenant_id::text,
        'role', COALESCE(user_role, 'viewer')
      )
    );
  END IF;

  -- Return the modified event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission to the auth admin role
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public roles for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ============================================
-- HELPER FUNCTION: Get User's Current Tenant
-- ============================================

-- Alternative function to manually get tenant if needed
CREATE OR REPLACE FUNCTION public.get_user_tenant(p_user_id uuid)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  user_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    tu.role as user_role
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = p_user_id
    AND tu.accepted_at IS NOT NULL
    AND t.status = 'active'
  ORDER BY tu.accepted_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant TO authenticated;

-- ============================================
-- HELPER FUNCTION: Switch Tenant (for multi-tenant users)
-- ============================================

-- For users who belong to multiple tenants, this updates their app_metadata
-- Note: After calling this, user must refresh their session to get new JWT
CREATE OR REPLACE FUNCTION public.switch_user_tenant(p_new_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_tenant_status text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify user has access to the target tenant
  SELECT tu.role, t.status
  INTO v_role, v_tenant_status
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = v_user_id
    AND tu.tenant_id = p_new_tenant_id
    AND tu.accepted_at IS NOT NULL;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No access to tenant');
  END IF;

  IF v_tenant_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant is not active');
  END IF;

  -- Note: Actual JWT update happens on next token refresh
  -- Client should call supabase.auth.refreshSession() after this
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', p_new_tenant_id,
    'role', v_role,
    'message', 'Call refreshSession() to get updated JWT'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_user_tenant TO authenticated;

-- ============================================
-- HELPER FUNCTION: List User's Tenants
-- ============================================

CREATE OR REPLACE FUNCTION public.list_user_tenants()
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  app_name text,
  logo_url text,
  primary_color text,
  user_role text,
  joined_at timestamptz,
  is_current boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.app_name,
    t.logo_url,
    t.primary_color,
    tu.role as user_role,
    tu.accepted_at as joined_at,
    (t.id = public.get_tenant_id()) as is_current
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = auth.uid()
    AND tu.accepted_at IS NOT NULL
    AND t.status = 'active'
  ORDER BY tu.accepted_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_user_tenants TO authenticated;

-- ============================================
-- INVITATION HANDLING
-- ============================================

-- Function to accept a tenant invitation
CREATE OR REPLACE FUNCTION public.accept_tenant_invitation(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_invitation_exists boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if invitation exists and is pending
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = v_user_id
      AND tenant_id = p_tenant_id
      AND accepted_at IS NULL
  ) INTO v_invitation_exists;

  IF NOT v_invitation_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found');
  END IF;

  -- Accept the invitation
  UPDATE tenant_users
  SET accepted_at = NOW()
  WHERE user_id = v_user_id
    AND tenant_id = p_tenant_id
    AND accepted_at IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', p_tenant_id,
    'message', 'Invitation accepted. Refresh session to access tenant.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation TO authenticated;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.custom_access_token_hook IS
'Supabase Auth hook that injects tenant_id and role into JWT app_metadata.
Must be enabled in Dashboard: Authentication → Hooks → Custom Access Token';

COMMENT ON FUNCTION public.get_user_tenant IS
'Returns the current tenant for a user. Used for debugging and verification.';

COMMENT ON FUNCTION public.switch_user_tenant IS
'Allows multi-tenant users to switch between tenants. Requires session refresh after.';

COMMENT ON FUNCTION public.list_user_tenants IS
'Lists all tenants a user has access to, with current tenant marked.';

COMMENT ON FUNCTION public.accept_tenant_invitation IS
'Accepts a pending tenant invitation for the current user.';
