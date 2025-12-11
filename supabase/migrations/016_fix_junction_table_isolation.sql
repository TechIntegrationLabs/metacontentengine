-- Migration: 016_fix_junction_table_isolation.sql
-- Description: CRITICAL SECURITY FIX - Add tenant isolation to junction tables
-- Date: December 10, 2024
-- Priority: MUST RUN BEFORE PRODUCTION

-- ============================================
-- FIX article_categories
-- ============================================

-- Step 1: Add tenant_id column
ALTER TABLE article_categories
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 2: Populate tenant_id from articles table
UPDATE article_categories ac
SET tenant_id = a.tenant_id
FROM articles a
WHERE ac.article_id = a.id
  AND ac.tenant_id IS NULL;

-- Step 3: Make tenant_id NOT NULL (after population)
ALTER TABLE article_categories
  ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE article_categories
  ADD CONSTRAINT fk_article_categories_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 5: Enable RLS
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
DROP POLICY IF EXISTS article_categories_tenant_isolation ON article_categories;
CREATE POLICY article_categories_tenant_isolation ON article_categories
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Step 7: Add index for performance
CREATE INDEX IF NOT EXISTS idx_article_categories_tenant
  ON article_categories(tenant_id);

-- ============================================
-- FIX article_tags
-- ============================================

-- Step 1: Add tenant_id column
ALTER TABLE article_tags
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 2: Populate tenant_id from articles table
UPDATE article_tags at
SET tenant_id = a.tenant_id
FROM articles a
WHERE at.article_id = a.id
  AND at.tenant_id IS NULL;

-- Step 3: Make tenant_id NOT NULL (after population)
ALTER TABLE article_tags
  ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE article_tags
  ADD CONSTRAINT fk_article_tags_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 5: Enable RLS
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
DROP POLICY IF EXISTS article_tags_tenant_isolation ON article_tags;
CREATE POLICY article_tags_tenant_isolation ON article_tags
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Step 7: Add index for performance
CREATE INDEX IF NOT EXISTS idx_article_tags_tenant
  ON article_tags(tenant_id);

-- ============================================
-- Create trigger to auto-populate tenant_id on INSERT
-- ============================================

-- Function to set tenant_id from article
CREATE OR REPLACE FUNCTION set_junction_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get tenant_id from the article being linked
  SELECT tenant_id INTO NEW.tenant_id
  FROM articles
  WHERE id = NEW.article_id;

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot determine tenant_id for junction record - article not found';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for article_categories
DROP TRIGGER IF EXISTS article_categories_set_tenant ON article_categories;
CREATE TRIGGER article_categories_set_tenant
  BEFORE INSERT ON article_categories
  FOR EACH ROW
  WHEN (NEW.tenant_id IS NULL)
  EXECUTE FUNCTION set_junction_tenant_id();

-- Trigger for article_tags
DROP TRIGGER IF EXISTS article_tags_set_tenant ON article_tags;
CREATE TRIGGER article_tags_set_tenant
  BEFORE INSERT ON article_tags
  FOR EACH ROW
  WHEN (NEW.tenant_id IS NULL)
  EXECUTE FUNCTION set_junction_tenant_id();

-- ============================================
-- Verification queries (run manually to confirm)
-- ============================================

-- Check article_categories isolation
-- SELECT COUNT(*) FROM article_categories WHERE tenant_id IS NULL;
-- Should return 0

-- Check article_tags isolation
-- SELECT COUNT(*) FROM article_tags WHERE tenant_id IS NULL;
-- Should return 0

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('article_categories', 'article_tags');
-- Both should show rowsecurity = true

COMMENT ON TABLE article_categories IS 'Junction table for article-category relationships - tenant isolated';
COMMENT ON TABLE article_tags IS 'Junction table for article-tag relationships - tenant isolated';
