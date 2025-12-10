-- Migration: Create App Secrets Table
-- Version: 1.0
-- Description: Secure storage for app-level secrets (encryption keys, etc.)
-- This replaces the database config approach which isn't available on hosted Supabase

-- ============================================
-- APP SECRETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service_role can access this table
ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies = no access via API (only service_role bypasses RLS)
-- This is intentional - secrets should only be accessed server-side

REVOKE ALL ON public.app_secrets FROM authenticated, anon, public;
GRANT ALL ON public.app_secrets TO service_role;

-- ============================================
-- UPDATE API KEY FUNCTIONS TO USE APP_SECRETS
-- ============================================

-- Updated store_api_key function
CREATE OR REPLACE FUNCTION public.store_api_key(
  p_tenant_id UUID,
  p_service TEXT,
  p_api_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
  v_encrypted_key TEXT;
  v_key_hint TEXT;
BEGIN
  -- Get encryption key from app_secrets table
  SELECT value INTO v_encryption_key
  FROM app_secrets
  WHERE key = 'encryption_key';

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Encryption key not configured. Add encryption_key to app_secrets table.'
    );
  END IF;

  -- Create a hint (last 4 characters)
  v_key_hint := '****' || RIGHT(p_api_key, 4);

  -- Encrypt the API key
  v_encrypted_key := encode(
    pgp_sym_encrypt(
      p_api_key,
      v_encryption_key,
      'compress-algo=1, cipher-algo=aes256'
    ),
    'base64'
  );

  -- Insert or update the key
  INSERT INTO tenant_api_keys (
    tenant_id,
    service,
    encrypted_key,
    key_hint,
    is_active,
    usage_count,
    created_at,
    updated_at
  ) VALUES (
    p_tenant_id,
    p_service,
    v_encrypted_key,
    v_key_hint,
    true,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (tenant_id, service)
  DO UPDATE SET
    encrypted_key = EXCLUDED.encrypted_key,
    key_hint = EXCLUDED.key_hint,
    is_active = true,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'service', p_service,
    'hint', v_key_hint
  );
END;
$$;

-- Updated get_decrypted_api_key function
CREATE OR REPLACE FUNCTION public.get_decrypted_api_key(
  p_tenant_id UUID,
  p_service TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
  v_encrypted_key TEXT;
  v_decrypted_key TEXT;
BEGIN
  -- Get encryption key from app_secrets table
  SELECT value INTO v_encryption_key
  FROM app_secrets
  WHERE key = 'encryption_key';

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  -- Get the encrypted key
  SELECT encrypted_key INTO v_encrypted_key
  FROM tenant_api_keys
  WHERE tenant_id = p_tenant_id
    AND service = p_service
    AND is_active = true;

  IF v_encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decrypt the key
  BEGIN
    v_decrypted_key := pgp_sym_decrypt(
      decode(v_encrypted_key, 'base64'),
      v_encryption_key
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to decrypt API key: %', SQLERRM;
  END;

  RETURN v_decrypted_key;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.app_secrets IS
'Secure storage for app-level secrets. Only accessible via service_role.';
