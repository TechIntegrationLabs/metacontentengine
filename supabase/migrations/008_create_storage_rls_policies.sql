-- Migration: Create Storage RLS Policies
-- Version: 1.0
-- Description: RLS policies for content-assets storage bucket
-- NOTE: Run AFTER creating the storage bucket via Dashboard

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Policy: Authenticated users can read files in their tenant's folder
CREATE POLICY "tenant_read_own_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-assets'
  AND (storage.foldername(name))[1] = public.get_tenant_id()::text
);

-- Policy: Authenticated users can upload to their tenant's folder
CREATE POLICY "tenant_upload_own_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-assets'
  AND (storage.foldername(name))[1] = public.get_tenant_id()::text
);

-- Policy: Authenticated users can update files in their tenant's folder
CREATE POLICY "tenant_update_own_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-assets'
  AND (storage.foldername(name))[1] = public.get_tenant_id()::text
);

-- Policy: Admin/Owner can delete files in their tenant's folder
CREATE POLICY "tenant_admin_delete_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-assets'
  AND (storage.foldername(name))[1] = public.get_tenant_id()::text
  AND public.get_user_role() IN ('owner', 'admin')
);
