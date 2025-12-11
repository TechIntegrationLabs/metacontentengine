-- Article Revision Tracking System
-- Migration: Article Revisions Table with RLS

-- Create article_revisions table
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Content snapshot
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,

  -- Metadata snapshot (stored as JSONB for flexibility)
  metadata JSONB DEFAULT '{}',

  -- Change tracking
  change_type TEXT NOT NULL CHECK (change_type IN ('auto', 'manual', 'publish', 'restore')),
  change_summary TEXT,
  word_count_delta INTEGER DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Constraints
  CONSTRAINT unique_article_version UNIQUE (article_id, version),
  CONSTRAINT positive_version CHECK (version > 0)
);

-- Indexes for performance
CREATE INDEX idx_article_revisions_article ON article_revisions(article_id, version DESC);
CREATE INDEX idx_article_revisions_tenant ON article_revisions(tenant_id);
CREATE INDEX idx_article_revisions_created_at ON article_revisions(created_at DESC);
CREATE INDEX idx_article_revisions_change_type ON article_revisions(change_type);

-- RLS Policies
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view revisions for articles in their tenant
CREATE POLICY "Users can view revisions in their tenant"
  ON article_revisions
  FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Policy: Users can create revisions for articles in their tenant
CREATE POLICY "Users can create revisions in their tenant"
  ON article_revisions
  FOR INSERT
  WITH CHECK (
    tenant_id = auth.tenant_id() AND
    created_by = auth.uid()
  );

-- Policy: Revisions cannot be updated (immutable)
-- No UPDATE policy - revisions are append-only

-- Policy: Revisions cannot be deleted by users (only cascade on article delete)
-- No DELETE policy - prevents accidental deletion

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION get_next_revision_version(p_article_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO v_max_version
  FROM article_revisions
  WHERE article_id = p_article_id;

  RETURN v_max_version + 1;
END;
$$;

-- Function to create revision with auto-incrementing version
CREATE OR REPLACE FUNCTION create_article_revision(
  p_article_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_excerpt TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_change_type TEXT DEFAULT 'manual',
  p_change_summary TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS article_revisions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_version INTEGER;
  v_word_count_delta INTEGER;
  v_new_revision article_revisions;
BEGIN
  -- Get tenant_id from article
  SELECT tenant_id INTO v_tenant_id
  FROM articles
  WHERE id = p_article_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;

  -- Verify user has access to this tenant
  IF v_tenant_id != auth.tenant_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get next version number
  v_version := get_next_revision_version(p_article_id);

  -- Calculate word count delta
  IF v_version > 1 THEN
    SELECT
      (LENGTH(p_content) - LENGTH(REPLACE(p_content, ' ', ''))) -
      (LENGTH(content) - LENGTH(REPLACE(content, ' ', '')))
    INTO v_word_count_delta
    FROM article_revisions
    WHERE article_id = p_article_id
    ORDER BY version DESC
    LIMIT 1;
  ELSE
    v_word_count_delta := LENGTH(p_content) - LENGTH(REPLACE(p_content, ' ', ''));
  END IF;

  -- Insert new revision
  INSERT INTO article_revisions (
    tenant_id,
    article_id,
    version,
    title,
    content,
    excerpt,
    metadata,
    change_type,
    change_summary,
    word_count_delta,
    created_by
  ) VALUES (
    v_tenant_id,
    p_article_id,
    v_version,
    p_title,
    p_content,
    p_excerpt,
    p_metadata,
    p_change_type,
    p_change_summary,
    v_word_count_delta,
    COALESCE(p_created_by, auth.uid())
  )
  RETURNING * INTO v_new_revision;

  RETURN v_new_revision;
END;
$$;

-- Function to restore article to a specific revision
CREATE OR REPLACE FUNCTION restore_article_revision(
  p_article_id UUID,
  p_revision_id UUID,
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS article_revisions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revision article_revisions;
  v_new_revision article_revisions;
  v_tenant_id UUID;
BEGIN
  -- Get the revision to restore
  SELECT * INTO v_revision
  FROM article_revisions
  WHERE id = p_revision_id;

  IF v_revision IS NULL THEN
    RAISE EXCEPTION 'Revision not found';
  END IF;

  -- Verify article exists and get tenant
  SELECT tenant_id INTO v_tenant_id
  FROM articles
  WHERE id = p_article_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;

  -- Verify user has access
  IF v_tenant_id != auth.tenant_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update the article with revision content
  UPDATE articles
  SET
    title = v_revision.title,
    content = v_revision.content,
    excerpt = v_revision.excerpt,
    updated_at = NOW(),
    updated_by = COALESCE(p_created_by, auth.uid())
  WHERE id = p_article_id;

  -- Create a new revision marking this as a restore
  SELECT * INTO v_new_revision
  FROM create_article_revision(
    p_article_id,
    v_revision.title,
    v_revision.content,
    v_revision.excerpt,
    v_revision.metadata,
    'restore',
    'Restored to version ' || v_revision.version,
    p_created_by
  );

  RETURN v_new_revision;
END;
$$;

-- Trigger to auto-create revision on article publish
CREATE OR REPLACE FUNCTION auto_create_publish_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create revision when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    PERFORM create_article_revision(
      NEW.id,
      NEW.title,
      NEW.content,
      NEW.excerpt,
      jsonb_build_object(
        'seoTitle', NEW.seo->>'metaTitle',
        'seoDescription', NEW.seo->>'metaDescription',
        'primaryKeyword', NEW.primary_keyword,
        'featuredImageUrl', NEW.featured_image_url
      ),
      'publish',
      'Article published',
      NEW.updated_by
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on articles table
DROP TRIGGER IF EXISTS trigger_auto_publish_revision ON articles;
CREATE TRIGGER trigger_auto_publish_revision
  AFTER UPDATE OF status ON articles
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION auto_create_publish_revision();

-- Grant permissions
GRANT SELECT, INSERT ON article_revisions TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_revision_version TO authenticated;
GRANT EXECUTE ON FUNCTION create_article_revision TO authenticated;
GRANT EXECUTE ON FUNCTION restore_article_revision TO authenticated;

-- Comments for documentation
COMMENT ON TABLE article_revisions IS 'Stores immutable snapshots of article versions for revision tracking';
COMMENT ON COLUMN article_revisions.version IS 'Auto-incrementing version number per article';
COMMENT ON COLUMN article_revisions.change_type IS 'Type of change: auto (auto-save), manual (user save), publish (published), restore (restored from previous)';
COMMENT ON COLUMN article_revisions.word_count_delta IS 'Change in word count compared to previous version';
COMMENT ON COLUMN article_revisions.metadata IS 'Snapshot of article metadata including SEO, categories, tags';
COMMENT ON FUNCTION create_article_revision IS 'Creates a new article revision with auto-incrementing version';
COMMENT ON FUNCTION restore_article_revision IS 'Restores article to a previous revision and creates a new restore revision';
