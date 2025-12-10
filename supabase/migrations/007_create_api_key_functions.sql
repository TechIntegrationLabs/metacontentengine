-- Migration: API Key Encryption/Decryption Functions
-- Version: 1.0
-- Description: Secure storage and retrieval of tenant API keys using pgcrypto

-- ============================================
-- ENCRYPTION KEY CONFIGURATION
-- ============================================

-- The encryption key should be set as a database config parameter
-- Run this in production (replace with your actual key):
-- ALTER DATABASE postgres SET app.encryption_key = 'your-32-byte-hex-key';
-- SELECT pg_reload_conf();

-- For local development, you can set it temporarily:
-- SET app.encryption_key = 'your-32-byte-hex-key';

-- ============================================
-- STORE ENCRYPTED API KEY
-- ============================================

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
  -- Get encryption key from config
  v_encryption_key := current_setting('app.encryption_key', true);

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Encryption key not configured. Set app.encryption_key in database config.'
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

-- Only allow authenticated users to store keys for their own tenant
-- (Admin check is done via RLS on tenant_api_keys table)

-- ============================================
-- GET DECRYPTED API KEY
-- ============================================

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
  -- Get encryption key from config
  v_encryption_key := current_setting('app.encryption_key', true);

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
-- DELETE API KEY
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_api_key(
  p_tenant_id UUID,
  p_service TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM tenant_api_keys
  WHERE tenant_id = p_tenant_id
    AND service = p_service;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'API key not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'service', p_service
  );
END;
$$;

-- ============================================
-- LIST API KEYS (hints only, not actual keys)
-- ============================================

CREATE OR REPLACE FUNCTION public.list_tenant_api_keys(p_tenant_id UUID)
RETURNS TABLE (
  service TEXT,
  key_hint TEXT,
  is_active BOOLEAN,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    service,
    key_hint,
    is_active,
    last_used_at,
    usage_count,
    created_at
  FROM tenant_api_keys
  WHERE tenant_id = p_tenant_id
  ORDER BY service;
$$;

-- ============================================
-- INCREMENT USAGE COUNT
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_api_key_usage(
  p_tenant_id UUID,
  p_service TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tenant_api_keys
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND service = p_service;
END;
$$;

-- ============================================
-- RLS POLICIES FOR API KEYS
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "admins_can_manage_api_keys" ON tenant_api_keys;

-- Only admins and owners can manage API keys
CREATE POLICY "admins_can_manage_api_keys" ON tenant_api_keys
  FOR ALL
  USING (
    tenant_id = public.get_tenant_id()
    AND public.get_user_role() IN ('owner', 'admin')
  );

-- ============================================
-- GRANTS
-- ============================================

-- Edge Functions (service role) can call these functions
GRANT EXECUTE ON FUNCTION public.store_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.get_decrypted_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.list_tenant_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_key_usage TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.store_api_key IS
'Encrypts and stores an API key for a tenant service. Requires app.encryption_key to be set.';

COMMENT ON FUNCTION public.get_decrypted_api_key IS
'Retrieves and decrypts an API key. Should only be called from Edge Functions (service role).';

COMMENT ON FUNCTION public.delete_api_key IS
'Removes an API key for a tenant service.';

COMMENT ON FUNCTION public.list_tenant_api_keys IS
'Lists all API keys for a tenant with hints (not actual keys).';
