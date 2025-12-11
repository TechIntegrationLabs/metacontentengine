# Meta Content Engine v0.5 - Database Migrations Plan

> **Document Version:** 1.1
> **Created:** December 10, 2024
> **Updated:** December 10, 2024

---

## ⚠️ CRITICAL SECURITY FIX REQUIRED

**Migration 016 MUST be run FIRST** - it fixes a multi-tenant isolation vulnerability in junction tables (`article_categories`, `article_tags`). These tables were missing `tenant_id` columns and RLS policies.

See `08-MULTI-TENANT-ARCHITECTURE.md` for full details.

---

## Overview

This document outlines all database migrations required for v0.5 features. Current migrations are numbered 001-009. New migrations will continue from 010.

### Current Migration Files
```
supabase/migrations/
├── 001_create_tenant_infrastructure.sql
├── 002_create_content_tables.sql
├── 003_create_pipeline_tables.sql
├── 004_create_additional_tenant_tables.sql
├── 005_create_custom_access_token_hook.sql
├── 006_create_storage_policies.sql
├── 007_create_api_key_functions.sql
├── 008_create_storage_rls_policies.sql
└── 009_create_app_secrets_table.sql
```

---

## New Migrations Required

### 010_add_risk_assessment_fields.sql

**Purpose:** Add risk scoring fields to articles table for Feature 5

```sql
-- Migration: 010_add_risk_assessment_fields.sql
-- Description: Add risk assessment fields to articles table
-- Feature: Risk Assessment System (Tier 1, Feature 5)

-- Add risk assessment columns to articles
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS risk_score INTEGER,
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS risk_factors JSONB,
  ADD COLUMN IF NOT EXISTS auto_publish_eligible BOOLEAN DEFAULT false;

-- Add review tracking for auto-publish
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_window JSONB;

-- Create index for risk-based queries
CREATE INDEX IF NOT EXISTS idx_articles_risk_level
  ON articles(tenant_id, risk_level);

CREATE INDEX IF NOT EXISTS idx_articles_auto_publish
  ON articles(tenant_id, auto_publish_eligible, scheduled_at)
  WHERE status = 'scheduled';

-- Add constraint for risk level values
ALTER TABLE articles
  ADD CONSTRAINT chk_risk_level
  CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

COMMENT ON COLUMN articles.risk_score IS 'Calculated risk score 0-100';
COMMENT ON COLUMN articles.risk_level IS 'Risk level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN articles.risk_factors IS 'Breakdown of risk factors as JSONB';
COMMENT ON COLUMN articles.auto_publish_eligible IS 'Whether article meets auto-publish criteria';
COMMENT ON COLUMN articles.reviewed_by IS 'User who reviewed for auto-publish';
COMMENT ON COLUMN articles.reviewed_at IS 'When article was reviewed';
```

---

### 011_add_keyword_research_tables.sql

**Purpose:** Add keyword research storage for Feature 8

```sql
-- Migration: 011_add_keyword_research_tables.sql
-- Description: Add keyword research tables for DataForSEO integration
-- Feature: Keyword Research & DataForSEO Integration (Tier 2, Feature 8)

-- Create keyword research table
CREATE TABLE IF NOT EXISTS keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc DECIMAL(10,2),
  competition VARCHAR(20),
  trend_data JSONB,
  related_keywords TEXT[],
  serp_features TEXT[],
  is_starred BOOLEAN DEFAULT false,
  cluster_id UUID REFERENCES content_clusters(id) ON DELETE SET NULL,
  source VARCHAR(50) DEFAULT 'manual', -- manual, dataforseo, import
  researched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_tenant_keyword UNIQUE(tenant_id, keyword),
  CONSTRAINT chk_competition CHECK (
    competition IS NULL OR competition IN ('low', 'medium', 'high')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_keyword_research_tenant
  ON keyword_research(tenant_id);

CREATE INDEX IF NOT EXISTS idx_keyword_research_starred
  ON keyword_research(tenant_id, is_starred)
  WHERE is_starred = true;

CREATE INDEX IF NOT EXISTS idx_keyword_research_cluster
  ON keyword_research(cluster_id);

CREATE INDEX IF NOT EXISTS idx_keyword_research_volume
  ON keyword_research(tenant_id, search_volume DESC NULLS LAST);

-- Enable RLS
ALTER TABLE keyword_research ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY keyword_research_tenant_isolation ON keyword_research
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Update trigger
CREATE TRIGGER keyword_research_updated_at
  BEFORE UPDATE ON keyword_research
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE keyword_research IS 'Stored keyword research data from DataForSEO or manual entry';
```

---

### 012_add_generation_queue_table.sql

**Purpose:** Add generation queue for Feature 9

```sql
-- Migration: 012_add_generation_queue_table.sql
-- Description: Add generation queue table for bulk operations
-- Feature: Generation Queue Management (Tier 2, Feature 9)

-- Create generation queue table
CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  error_details JSONB,
  scheduled_for TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT chk_queue_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT chk_queue_has_source CHECK (
    content_idea_id IS NOT NULL OR article_id IS NOT NULL
  )
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_generation_queue_tenant_status
  ON generation_queue(tenant_id, status);

-- Index for finding next item to process (pending items by priority)
CREATE INDEX IF NOT EXISTS idx_generation_queue_pending
  ON generation_queue(tenant_id, priority DESC, created_at ASC)
  WHERE status = 'pending';

-- Index for scheduled items
CREATE INDEX IF NOT EXISTS idx_generation_queue_scheduled
  ON generation_queue(scheduled_for)
  WHERE status = 'pending' AND scheduled_for IS NOT NULL;

-- Enable RLS
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY generation_queue_tenant_isolation ON generation_queue
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Function to get next queue item for processing
CREATE OR REPLACE FUNCTION get_next_queue_item(p_tenant_id UUID)
RETURNS generation_queue AS $$
DECLARE
  v_item generation_queue;
BEGIN
  -- Get next pending item, ordered by priority then creation time
  SELECT * INTO v_item
  FROM generation_queue
  WHERE tenant_id = p_tenant_id
    AND status = 'pending'
    AND (scheduled_for IS NULL OR scheduled_for <= NOW())
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Mark as processing
  IF v_item.id IS NOT NULL THEN
    UPDATE generation_queue
    SET status = 'processing',
        processing_started_at = NOW()
    WHERE id = v_item.id;
  END IF;

  RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats(p_tenant_id UUID)
RETURNS TABLE (
  pending_count BIGINT,
  processing_count BIGINT,
  completed_count BIGINT,
  failed_count BIGINT,
  avg_processing_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'processing'),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    AVG(completed_at - processing_started_at) FILTER (WHERE status = 'completed')
  FROM generation_queue
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE generation_queue IS 'Queue for bulk content generation operations';
```

---

### 013_add_revision_tracking.sql

**Purpose:** Add revision history for Feature 18

```sql
-- Migration: 013_add_revision_tracking.sql
-- Description: Add revision tracking for articles
-- Feature: Revision Tracking & AI Training (Tier 4, Feature 18)

-- Create article revisions table
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  content_before TEXT,
  content_after TEXT,
  change_type VARCHAR(50) NOT NULL,
  change_reason TEXT,
  change_summary TEXT,
  changed_by UUID REFERENCES auth.users(id),
  include_in_training BOOLEAN DEFAULT false,
  training_exported_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_change_type CHECK (
    change_type IN ('ai_generation', 'human_edit', 'auto_fix', 'humanization', 'rollback')
  ),
  CONSTRAINT uq_article_revision UNIQUE(article_id, revision_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_revisions_article
  ON article_revisions(article_id, revision_number DESC);

CREATE INDEX IF NOT EXISTS idx_revisions_training
  ON article_revisions(include_in_training, training_exported_at)
  WHERE include_in_training = true;

CREATE INDEX IF NOT EXISTS idx_revisions_changed_by
  ON article_revisions(changed_by, created_at DESC);

-- Enable RLS (revisions inherit article's tenant_id)
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy - join with articles to check tenant
CREATE POLICY article_revisions_tenant_isolation ON article_revisions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_revisions.article_id
        AND articles.tenant_id = public.get_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_revisions.article_id
        AND articles.tenant_id = public.get_tenant_id()
    )
  );

-- Function to create revision
CREATE OR REPLACE FUNCTION create_article_revision(
  p_article_id UUID,
  p_content_before TEXT,
  p_content_after TEXT,
  p_change_type VARCHAR(50),
  p_change_reason TEXT DEFAULT NULL,
  p_changed_by UUID DEFAULT NULL
) RETURNS article_revisions AS $$
DECLARE
  v_revision article_revisions;
  v_next_number INTEGER;
BEGIN
  -- Get next revision number
  SELECT COALESCE(MAX(revision_number), 0) + 1
  INTO v_next_number
  FROM article_revisions
  WHERE article_id = p_article_id;

  -- Create revision
  INSERT INTO article_revisions (
    article_id, revision_number, content_before, content_after,
    change_type, change_reason, changed_by
  ) VALUES (
    p_article_id, v_next_number, p_content_before, p_content_after,
    p_change_type, p_change_reason, COALESCE(p_changed_by, auth.uid())
  )
  RETURNING * INTO v_revision;

  RETURN v_revision;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export training data
CREATE OR REPLACE FUNCTION export_training_data(p_tenant_id UUID)
RETURNS TABLE (
  revision_id UUID,
  article_title TEXT,
  content_before TEXT,
  content_after TEXT,
  change_type VARCHAR(50),
  change_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    a.title,
    r.content_before,
    r.content_after,
    r.change_type,
    r.change_reason
  FROM article_revisions r
  JOIN articles a ON a.id = r.article_id
  WHERE a.tenant_id = p_tenant_id
    AND r.include_in_training = true
    AND r.training_exported_at IS NULL;

  -- Mark as exported
  UPDATE article_revisions r
  SET training_exported_at = NOW()
  FROM articles a
  WHERE a.id = r.article_id
    AND a.tenant_id = p_tenant_id
    AND r.include_in_training = true
    AND r.training_exported_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE article_revisions IS 'Tracks all content changes for history and AI training';
```

---

### 014_add_article_comments.sql

**Purpose:** Add comment system for Feature 19

```sql
-- Migration: 014_add_article_comments.sql
-- Description: Add structured feedback/comment system for articles
-- Feature: Comment System (Tier 4, Feature 19)

-- Create article comments table
CREATE TABLE IF NOT EXISTS article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  selection_start INTEGER,
  selection_end INTEGER,
  selected_text TEXT,
  comment_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'minor',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  CONSTRAINT chk_comment_category CHECK (
    category IN ('accuracy', 'tone', 'seo', 'structure', 'grammar', 'general', 'compliance')
  ),
  CONSTRAINT chk_comment_severity CHECK (
    severity IN ('minor', 'moderate', 'major', 'critical')
  ),
  CONSTRAINT chk_comment_status CHECK (
    status IN ('pending', 'addressed', 'dismissed', 'wont_fix')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_article_comments_article
  ON article_comments(article_id, status);

CREATE INDEX IF NOT EXISTS idx_article_comments_created_by
  ON article_comments(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_comments_pending
  ON article_comments(article_id)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy - join with articles to check tenant
CREATE POLICY article_comments_tenant_isolation ON article_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_comments.article_id
        AND articles.tenant_id = public.get_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_comments.article_id
        AND articles.tenant_id = public.get_tenant_id()
    )
  );

-- Update trigger
CREATE TRIGGER article_comments_updated_at
  BEFORE UPDATE ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get comment statistics for an article
CREATE OR REPLACE FUNCTION get_article_comment_stats(p_article_id UUID)
RETURNS TABLE (
  total_count BIGINT,
  pending_count BIGINT,
  critical_count BIGINT,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'pending'),
    jsonb_object_agg(category, category_count)
  FROM (
    SELECT category, COUNT(*) as category_count
    FROM article_comments
    WHERE article_id = p_article_id
    GROUP BY category
  ) cat_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE article_comments IS 'Structured feedback comments on article content';
```

---

### 015_add_auto_publish_config.sql

**Purpose:** Add auto-publish configuration for Feature 6

```sql
-- Migration: 015_add_auto_publish_config.sql
-- Description: Add auto-publish configuration to tenant settings
-- Feature: Auto-Publish Scheduling (Tier 2, Feature 6)

-- Add auto-publish configuration type
CREATE TYPE auto_publish_config AS (
  enabled BOOLEAN,
  default_days_after_ready INTEGER,
  require_human_review BOOLEAN,
  minimum_quality_score INTEGER,
  maximum_risk_level VARCHAR(20),
  publish_window_start_hour INTEGER,
  publish_window_end_hour INTEGER,
  publish_window_timezone TEXT,
  exclude_weekends BOOLEAN,
  notify_before_publish BOOLEAN,
  notify_hours_before INTEGER
);

-- Add scheduled publish log table
CREATE TABLE IF NOT EXISTS scheduled_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  actual_publish_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  auto_eligible BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  publish_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_publish_log_status CHECK (
    status IN ('pending', 'published', 'cancelled', 'failed', 'skipped')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_publish_log_pending
  ON scheduled_publish_log(tenant_id, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_publish_log_article
  ON scheduled_publish_log(article_id);

-- Enable RLS
ALTER TABLE scheduled_publish_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY scheduled_publish_log_tenant_isolation ON scheduled_publish_log
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Function to get articles due for auto-publish
CREATE OR REPLACE FUNCTION get_due_auto_publish_articles(p_tenant_id UUID)
RETURNS TABLE (
  article_id UUID,
  scheduled_for TIMESTAMPTZ,
  log_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    spl.article_id,
    spl.scheduled_for,
    spl.id as log_id
  FROM scheduled_publish_log spl
  JOIN articles a ON a.id = spl.article_id
  WHERE spl.tenant_id = p_tenant_id
    AND spl.status = 'pending'
    AND spl.scheduled_for <= NOW()
    AND a.auto_publish_eligible = true
    AND a.status IN ('ready', 'scheduled')
  ORDER BY spl.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE scheduled_publish_log IS 'Log of scheduled and completed auto-publish events';
```

---

## Migration Execution Order

```bash
# Run in this order:
supabase migration up 010_add_risk_assessment_fields
supabase migration up 011_add_keyword_research_tables
supabase migration up 012_add_generation_queue_table
supabase migration up 013_add_revision_tracking
supabase migration up 014_add_article_comments
supabase migration up 015_add_auto_publish_config
```

---

## Rollback Scripts

For each migration, create a corresponding down migration:

```sql
-- 010_add_risk_assessment_fields.down.sql
ALTER TABLE articles
  DROP COLUMN IF EXISTS risk_score,
  DROP COLUMN IF EXISTS risk_level,
  DROP COLUMN IF EXISTS risk_factors,
  DROP COLUMN IF EXISTS auto_publish_eligible,
  DROP COLUMN IF EXISTS reviewed_by,
  DROP COLUMN IF EXISTS reviewed_at,
  DROP COLUMN IF EXISTS publish_window;

DROP INDEX IF EXISTS idx_articles_risk_level;
DROP INDEX IF EXISTS idx_articles_auto_publish;
```

---

## Schema Diagram Update

After migrations, the schema adds:

```
┌─────────────────────┐
│     articles        │
├─────────────────────┤
│ + risk_score        │
│ + risk_level        │
│ + risk_factors      │
│ + auto_publish_...  │
│ + reviewed_by       │
│ + reviewed_at       │
└─────────┬───────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│ article_revisions   │     │ article_comments    │
├─────────────────────┤     ├─────────────────────┤
│ revision_number     │     │ selection_start     │
│ content_before      │     │ selection_end       │
│ content_after       │     │ comment_text        │
│ change_type         │     │ category            │
│ include_in_training │     │ severity            │
└─────────────────────┘     │ status              │
                            └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│ keyword_research    │     │ generation_queue    │
├─────────────────────┤     ├─────────────────────┤
│ keyword             │     │ priority            │
│ search_volume       │     │ status              │
│ keyword_difficulty  │     │ attempts            │
│ cpc                 │     │ scheduled_for       │
│ is_starred          │     │ last_error          │
│ cluster_id          │     │ content_idea_id     │
└─────────────────────┘     └─────────────────────┘

┌─────────────────────┐
│scheduled_publish_log│
├─────────────────────┤
│ scheduled_for       │
│ actual_publish_at   │
│ status              │
│ reviewed_by         │
└─────────────────────┘
```

---

## Data Migration Notes

### Existing Article Risk Calculation
After running migration 010, populate risk scores for existing articles:

```sql
-- Run after deploying risk assessment service
UPDATE articles
SET
  risk_score = 0,
  risk_level = 'LOW',
  auto_publish_eligible = (
    quality_score >= 75
    AND human_score >= 70
    AND status IN ('ready', 'review')
  )
WHERE risk_score IS NULL;
```

### Seeding Default Auto-Publish Config
```sql
INSERT INTO tenant_settings (tenant_id, key, value)
SELECT id, 'auto_publish', jsonb_build_object(
  'enabled', false,
  'defaultDaysAfterReady', 3,
  'requireHumanReview', true,
  'minimumQualityScore', 75,
  'maximumRiskLevel', 'LOW',
  'publishWindowStartHour', 9,
  'publishWindowEndHour', 17,
  'publishWindowTimezone', 'America/New_York',
  'excludeWeekends', true,
  'notifyBeforePublish', true,
  'notifyHoursBefore', 24
)
FROM tenants
ON CONFLICT (tenant_id, key) DO NOTHING;
```

---

*All migrations should be tested in a development environment before applying to production.*
