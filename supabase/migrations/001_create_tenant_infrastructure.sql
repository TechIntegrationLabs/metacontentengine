-- Migration: Create Multi-Tenant Infrastructure
-- Version: 1.1

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to get current tenant_id from JWT (in public schema)
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    NULL
  )
$func$;

-- Function to get current user role within tenant (in public schema)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'viewer'
  )
$func$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- TENANTS TABLE
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  app_name TEXT DEFAULT 'Content Engine',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f97316',
  primary_domain TEXT,
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  blocked_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  features JSONB DEFAULT '{"maxContributors": 3, "maxArticlesPerMonth": 50, "aiGenerationEnabled": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_tenant" ON tenants
  FOR SELECT USING (id = public.get_tenant_id());

CREATE POLICY "admins_can_update_own_tenant" ON tenants
  FOR UPDATE USING (id = public.get_tenant_id() AND public.get_user_role() IN ('owner', 'admin'));

-- TENANT USERS TABLE
CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_memberships" ON tenant_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_read_tenant_memberships" ON tenant_users
  FOR SELECT USING (tenant_id = public.get_tenant_id());

-- TENANT SETTINGS TABLE
CREATE TABLE public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_tenant_settings_tenant_key ON tenant_settings(tenant_id, key);
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_settings FOR ALL USING (tenant_id = public.get_tenant_id());

-- TENANT API KEYS TABLE
CREATE TABLE public.tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_hint TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, service)
);

CREATE INDEX idx_tenant_api_keys_tenant ON tenant_api_keys(tenant_id);
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
