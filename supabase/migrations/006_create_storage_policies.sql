-- Migration: Storage Helper Functions and Media Integration
-- Version: 1.1
-- Description: Storage helper functions for tenant-isolated file storage
--
-- IMPORTANT: Storage bucket and RLS policies MUST be created via Supabase Dashboard.
-- This migration only creates helper functions and updates the media table.
--
-- Dashboard Setup Required:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket named "content-assets" (private)
-- 3. Set file size limit: 50MB
-- 4. Set allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml, application/pdf
-- 5. Add the following RLS policies on storage.objects:
--
--    Policy: tenant_read_own_files (SELECT)
--    USING: bucket_id = 'content-assets' AND (storage.foldername(name))[1] = public.get_tenant_id()::text
--
--    Policy: tenant_upload_own_files (INSERT)
--    WITH CHECK: bucket_id = 'content-assets' AND (storage.foldername(name))[1] = public.get_tenant_id()::text
--
--    Policy: tenant_update_own_files (UPDATE)
--    USING: bucket_id = 'content-assets' AND (storage.foldername(name))[1] = public.get_tenant_id()::text
--
--    Policy: tenant_admin_delete_files (DELETE)
--    USING: bucket_id = 'content-assets' AND (storage.foldername(name))[1] = public.get_tenant_id()::text AND public.get_user_role() IN ('owner', 'admin')

-- ============================================
-- STORAGE HELPER FUNCTIONS
-- ============================================

-- Function to generate a tenant-prefixed storage path
CREATE OR REPLACE FUNCTION public.tenant_storage_path(p_path text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CONCAT(public.get_tenant_id()::text, '/', p_path);
$$;

GRANT EXECUTE ON FUNCTION public.tenant_storage_path TO authenticated;

-- Function to get the public URL for a tenant file
-- Note: For private buckets, you'd use signed URLs instead
CREATE OR REPLACE FUNCTION public.get_tenant_file_url(p_bucket text, p_path text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CONCAT(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    p_bucket,
    '/',
    public.get_tenant_id()::text,
    '/',
    p_path
  );
$$;

-- ============================================
-- MEDIA TABLE INTEGRATION
-- ============================================

-- Update media table to include storage path
ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS bucket_id TEXT DEFAULT 'content-assets';

-- Trigger to auto-set storage path on media insert
CREATE OR REPLACE FUNCTION set_media_storage_path()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.storage_path IS NULL THEN
    NEW.storage_path := CONCAT(NEW.tenant_id::text, '/', NEW.filename);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS media_set_storage_path ON media;
CREATE TRIGGER media_set_storage_path
  BEFORE INSERT ON media
  FOR EACH ROW
  EXECUTE FUNCTION set_media_storage_path();

-- ============================================
-- STORAGE FOLDER STRUCTURE DOCUMENTATION
-- ============================================

-- Expected folder structure within content-assets bucket:
--
-- content-assets/
-- ├── {tenant-uuid-1}/
-- │   ├── logos/
-- │   │   ├── logo-light.svg
-- │   │   └── logo-dark.svg
-- │   ├── article-images/
-- │   │   ├── {article-uuid}/
-- │   │   │   ├── featured.jpg
-- │   │   │   └── inline-1.png
-- │   ├── contributor-avatars/
-- │   │   └── {contributor-uuid}.jpg
-- │   ├── writing-samples/
-- │   │   └── {sample-uuid}.txt
-- │   └── exports/
-- │       └── {export-uuid}.pdf
-- ├── {tenant-uuid-2}/
-- │   └── ...
-- └── ...

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.tenant_storage_path IS
'Returns a tenant-prefixed path for storage operations';
