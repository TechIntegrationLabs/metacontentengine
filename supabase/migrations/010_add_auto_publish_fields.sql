-- Migration: 010_add_auto_publish_fields.sql
-- Description: Add auto-publish scheduling fields and tenant configuration
-- Feature: Auto-Publish Scheduling (Tier 2, Feature 6)
-- Date: December 10, 2024

-- ============================================
-- Add risk and scheduling fields to articles
-- ============================================

-- Risk assessment columns
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS risk_score INTEGER,
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS risk_factors JSONB,
  ADD COLUMN IF NOT EXISTS auto_publish_eligible BOOLEAN DEFAULT false;

-- Review tracking
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_publish_at TIMESTAMPTZ;

-- Risk level constraint
ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS chk_risk_level;
ALTER TABLE articles
  ADD CONSTRAINT chk_risk_level
  CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Indexes for auto-publish queries
CREATE INDEX IF NOT EXISTS idx_articles_risk_level
  ON articles(tenant_id, risk_level);

CREATE INDEX IF NOT EXISTS idx_articles_auto_publish
  ON articles(tenant_id, auto_publish_eligible, auto_publish_at)
  WHERE status = 'ready' AND auto_publish_eligible = true;

CREATE INDEX IF NOT EXISTS idx_articles_scheduled
  ON articles(tenant_id, scheduled_at)
  WHERE status = 'scheduled';

-- ============================================
-- Add auto-publish configuration to tenant_settings
-- ============================================

-- First check if tenant_settings exists, if not, rely on tenant_api_keys approach
-- Add columns to tenants table for settings
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS auto_publish_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_publish_config JSONB DEFAULT '{
    "defaultDaysAfterReady": 3,
    "requireHumanReview": true,
    "minimumQualityScore": 75,
    "maximumRiskLevel": "LOW",
    "notifyBeforePublish": true,
    "notifyHoursBeforePublish": 24,
    "publishingWindows": [
      {"dayOfWeek": 1, "startHour": 9, "endHour": 17},
      {"dayOfWeek": 2, "startHour": 9, "endHour": 17},
      {"dayOfWeek": 3, "startHour": 9, "endHour": 17},
      {"dayOfWeek": 4, "startHour": 9, "endHour": 17},
      {"dayOfWeek": 5, "startHour": 9, "endHour": 17}
    ],
    "timezone": "America/New_York"
  }'::jsonb;

-- ============================================
-- Create scheduled publish log table
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  wp_post_id INTEGER,
  published_url TEXT,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_publish_log_status CHECK (
    status IN ('pending', 'publishing', 'published', 'failed', 'cancelled')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_publish_log_tenant_status
  ON scheduled_publish_log(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_publish_log_scheduled
  ON scheduled_publish_log(scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_publish_log_article
  ON scheduled_publish_log(article_id);

-- Enable RLS
ALTER TABLE scheduled_publish_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS scheduled_publish_log_tenant_isolation ON scheduled_publish_log;
CREATE POLICY scheduled_publish_log_tenant_isolation ON scheduled_publish_log
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- ============================================
-- Create function to check auto-publish eligibility
-- ============================================

CREATE OR REPLACE FUNCTION check_auto_publish_eligibility(
  p_article_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_article RECORD;
  v_tenant RECORD;
  v_config JSONB;
BEGIN
  -- Get article
  SELECT * INTO v_article FROM articles WHERE id = p_article_id;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Get tenant config
  SELECT * INTO v_tenant FROM tenants WHERE id = v_article.tenant_id;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Check if auto-publish is enabled
  IF NOT COALESCE(v_tenant.auto_publish_enabled, false) THEN
    RETURN false;
  END IF;

  v_config := COALESCE(v_tenant.auto_publish_config, '{}'::jsonb);

  -- Check minimum quality score
  IF v_article.quality_score IS NULL OR
     v_article.quality_score < COALESCE((v_config->>'minimumQualityScore')::int, 75) THEN
    RETURN false;
  END IF;

  -- Check maximum risk level
  IF v_article.risk_level IS NOT NULL THEN
    CASE v_article.risk_level
      WHEN 'CRITICAL' THEN RETURN false;
      WHEN 'HIGH' THEN RETURN false;
      WHEN 'MEDIUM' THEN
        IF COALESCE(v_config->>'maximumRiskLevel', 'LOW') = 'LOW' THEN
          RETURN false;
        END IF;
      ELSE NULL;
    END CASE;
  END IF;

  -- Check if human review is required and completed
  IF COALESCE((v_config->>'requireHumanReview')::boolean, true) THEN
    IF v_article.reviewed_at IS NULL THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create function to calculate auto-publish date
-- ============================================

CREATE OR REPLACE FUNCTION calculate_auto_publish_date(
  p_article_id UUID
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_article RECORD;
  v_tenant RECORD;
  v_config JSONB;
  v_days_after INTEGER;
  v_publish_date TIMESTAMPTZ;
BEGIN
  -- Get article
  SELECT * INTO v_article FROM articles WHERE id = p_article_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Get tenant config
  SELECT * INTO v_tenant FROM tenants WHERE id = v_article.tenant_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_config := COALESCE(v_tenant.auto_publish_config, '{}'::jsonb);
  v_days_after := COALESCE((v_config->>'defaultDaysAfterReady')::int, 3);

  -- Calculate base publish date
  v_publish_date := COALESCE(v_article.updated_at, NOW()) + (v_days_after || ' days')::interval;

  -- TODO: Adjust for publishing windows (would need more complex logic)

  RETURN v_publish_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create trigger to update auto-publish eligibility
-- ============================================

CREATE OR REPLACE FUNCTION update_auto_publish_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if article is in ready status
  IF NEW.status = 'ready' THEN
    NEW.auto_publish_eligible := check_auto_publish_eligibility(NEW.id);

    -- Calculate auto-publish date if eligible and not already set
    IF NEW.auto_publish_eligible AND NEW.auto_publish_at IS NULL THEN
      NEW.auto_publish_at := calculate_auto_publish_date(NEW.id);
    END IF;
  ELSE
    NEW.auto_publish_eligible := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS articles_auto_publish_check ON articles;
CREATE TRIGGER articles_auto_publish_check
  BEFORE INSERT OR UPDATE OF status, quality_score, risk_level, reviewed_at
  ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_publish_eligibility();

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN articles.risk_score IS 'Calculated risk score 0-100 (higher = more risky)';
COMMENT ON COLUMN articles.risk_level IS 'Risk level: LOW (0-25), MEDIUM (26-50), HIGH (51-75), CRITICAL (76-100)';
COMMENT ON COLUMN articles.risk_factors IS 'Breakdown of risk factors as JSONB {aiDetectionRisk, complianceViolations, qualityDeficits, structuralIssues}';
COMMENT ON COLUMN articles.auto_publish_eligible IS 'Whether article meets all auto-publish criteria';
COMMENT ON COLUMN articles.reviewed_by IS 'User who approved the article for publishing';
COMMENT ON COLUMN articles.reviewed_at IS 'When article was approved';
COMMENT ON COLUMN articles.auto_publish_at IS 'Scheduled date for automatic publishing';
COMMENT ON COLUMN tenants.auto_publish_enabled IS 'Whether auto-publish feature is enabled for this tenant';
COMMENT ON COLUMN tenants.auto_publish_config IS 'Auto-publish configuration JSONB';
COMMENT ON TABLE scheduled_publish_log IS 'Log of scheduled and completed auto-publish operations';
