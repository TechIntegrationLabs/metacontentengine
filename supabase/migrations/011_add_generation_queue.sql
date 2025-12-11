-- Migration: 011_add_generation_queue.sql
-- Description: Add generation queue for batch content processing
-- Feature: Generation Queue Management (Tier 2, Feature 9)
-- Date: December 10, 2024

-- ============================================
-- Create generation queue table
-- ============================================

CREATE TABLE IF NOT EXISTS generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- What to generate
  content_idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,

  -- Queue management
  priority INTEGER DEFAULT 0,  -- Higher = more urgent
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,

  -- Timing
  scheduled_for TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  config JSONB DEFAULT '{}',  -- Generation config overrides
  result JSONB,               -- Result data when completed

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_queue_status CHECK (
    status IN ('pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT chk_queue_source CHECK (
    content_idea_id IS NOT NULL OR article_id IS NOT NULL
  )
);

-- Indexes for efficient queue operations
CREATE INDEX IF NOT EXISTS idx_queue_tenant_status
  ON generation_queue(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_queue_pending
  ON generation_queue(priority DESC, created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_scheduled
  ON generation_queue(scheduled_for)
  WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_queue_processing
  ON generation_queue(processing_started_at)
  WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_queue_idea
  ON generation_queue(content_idea_id)
  WHERE content_idea_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_queue_article
  ON generation_queue(article_id)
  WHERE article_id IS NOT NULL;

-- Enable RLS
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS generation_queue_tenant_isolation ON generation_queue;
CREATE POLICY generation_queue_tenant_isolation ON generation_queue
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- ============================================
-- Helper functions for queue management
-- ============================================

-- Get next item to process
CREATE OR REPLACE FUNCTION get_next_queue_item(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  content_idea_id UUID,
  article_id UUID,
  priority INTEGER,
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH next_item AS (
    SELECT gq.id
    FROM generation_queue gq
    WHERE gq.status = 'pending'
      AND (p_tenant_id IS NULL OR gq.tenant_id = p_tenant_id)
      AND (gq.scheduled_for IS NULL OR gq.scheduled_for <= NOW())
    ORDER BY gq.priority DESC, gq.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE generation_queue gq
  SET
    status = 'processing',
    processing_started_at = NOW(),
    attempts = attempts + 1,
    updated_at = NOW()
  FROM next_item
  WHERE gq.id = next_item.id
  RETURNING gq.id, gq.tenant_id, gq.content_idea_id, gq.article_id, gq.priority, gq.config;
END;
$$ LANGUAGE plpgsql;

-- Mark item as completed
CREATE OR REPLACE FUNCTION complete_queue_item(
  p_item_id UUID,
  p_result JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE generation_queue
  SET
    status = 'completed',
    completed_at = NOW(),
    result = p_result,
    updated_at = NOW()
  WHERE id = p_item_id AND status = 'processing';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Mark item as failed
CREATE OR REPLACE FUNCTION fail_queue_item(
  p_item_id UUID,
  p_error TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
  v_updated BOOLEAN;
BEGIN
  SELECT * INTO v_item FROM generation_queue WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if we should retry
  IF v_item.attempts < v_item.max_attempts THEN
    -- Return to pending for retry
    UPDATE generation_queue
    SET
      status = 'pending',
      last_error = p_error,
      processing_started_at = NULL,
      updated_at = NOW()
    WHERE id = p_item_id;
  ELSE
    -- Mark as permanently failed
    UPDATE generation_queue
    SET
      status = 'failed',
      last_error = p_error,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats(p_tenant_id UUID)
RETURNS TABLE (
  pending BIGINT,
  scheduled BIGINT,
  processing BIGINT,
  completed BIGINT,
  failed BIGINT,
  avg_processing_time INTERVAL,
  items_last_hour BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
    COUNT(*) FILTER (WHERE status = 'processing') as processing,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    AVG(completed_at - processing_started_at) FILTER (WHERE status = 'completed') as avg_processing_time,
    COUNT(*) FILTER (WHERE completed_at > NOW() - INTERVAL '1 hour' AND status = 'completed') as items_last_hour
  FROM generation_queue
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger to update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generation_queue_updated ON generation_queue;
CREATE TRIGGER generation_queue_updated
  BEFORE UPDATE ON generation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_timestamp();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE generation_queue IS 'Queue for managing batch content generation jobs';
COMMENT ON COLUMN generation_queue.priority IS 'Higher values = higher priority (processed first)';
COMMENT ON COLUMN generation_queue.status IS 'pending=waiting, scheduled=delayed, processing=active, completed=done, failed=error, cancelled=user cancelled';
COMMENT ON COLUMN generation_queue.attempts IS 'Number of processing attempts (for retry logic)';
COMMENT ON COLUMN generation_queue.max_attempts IS 'Maximum retry attempts before marking as failed';
COMMENT ON COLUMN generation_queue.config IS 'Optional generation config overrides as JSONB';
COMMENT ON COLUMN generation_queue.result IS 'Generation result data when completed';
COMMENT ON FUNCTION get_next_queue_item IS 'Atomically get and lock the next queue item for processing';
COMMENT ON FUNCTION complete_queue_item IS 'Mark a queue item as successfully completed';
COMMENT ON FUNCTION fail_queue_item IS 'Mark a queue item as failed, with automatic retry logic';
COMMENT ON FUNCTION get_queue_stats IS 'Get aggregated queue statistics for a tenant';
