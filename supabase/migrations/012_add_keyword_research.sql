-- Migration: 012_add_keyword_research.sql
-- Description: Add keyword research tables for DataForSEO integration
-- Feature: Keyword Research & DataForSEO (Tier 2, Feature 8)
-- Date: December 10, 2024

-- ============================================
-- Create keyword research table
-- ============================================

CREATE TABLE IF NOT EXISTS keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Keyword data
  keyword VARCHAR(500) NOT NULL,
  search_volume INTEGER,
  keyword_difficulty INTEGER,  -- 0-100 scale
  cpc DECIMAL(10, 2),          -- Cost per click in USD
  competition VARCHAR(20),     -- low, medium, high
  competition_level DECIMAL(5, 4), -- 0-1 scale

  -- Trend data
  trend_data JSONB,            -- Monthly search volumes
  seasonality JSONB,           -- Seasonal patterns

  -- SERP data
  serp_features JSONB,         -- Featured snippets, PAA, etc.
  serp_difficulty INTEGER,     -- How hard to rank

  -- Organization
  is_starred BOOLEAN DEFAULT false,
  cluster_id UUID,             -- For topic clustering
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,

  -- Source tracking
  source VARCHAR(50) DEFAULT 'manual', -- manual, dataforseo, import
  dataforseo_id VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'active',
  last_updated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_keyword_status CHECK (
    status IN ('active', 'archived', 'converted')
  ),
  CONSTRAINT chk_keyword_competition CHECK (
    competition IS NULL OR competition IN ('low', 'medium', 'high')
  )
);

-- Unique constraint per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_tenant_unique
  ON keyword_research(tenant_id, LOWER(keyword));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_keyword_tenant
  ON keyword_research(tenant_id);

CREATE INDEX IF NOT EXISTS idx_keyword_volume
  ON keyword_research(tenant_id, search_volume DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_keyword_difficulty
  ON keyword_research(tenant_id, keyword_difficulty);

CREATE INDEX IF NOT EXISTS idx_keyword_starred
  ON keyword_research(tenant_id, is_starred)
  WHERE is_starred = true;

CREATE INDEX IF NOT EXISTS idx_keyword_cluster
  ON keyword_research(cluster_id)
  WHERE cluster_id IS NOT NULL;

-- Full text search on keyword
CREATE INDEX IF NOT EXISTS idx_keyword_search
  ON keyword_research USING gin(to_tsvector('english', keyword));

-- Enable RLS
ALTER TABLE keyword_research ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS keyword_research_tenant_isolation ON keyword_research;
CREATE POLICY keyword_research_tenant_isolation ON keyword_research
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- ============================================
-- Create keyword clusters table
-- ============================================

CREATE TABLE IF NOT EXISTS keyword_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Metrics (aggregated from keywords)
  total_volume INTEGER DEFAULT 0,
  avg_difficulty INTEGER,
  keyword_count INTEGER DEFAULT 0,

  -- Organization
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cluster_tenant
  ON keyword_clusters(tenant_id);

-- Enable RLS
ALTER TABLE keyword_clusters ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS keyword_clusters_tenant_isolation ON keyword_clusters;
CREATE POLICY keyword_clusters_tenant_isolation ON keyword_clusters
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- ============================================
-- Create DataForSEO API usage tracking
-- ============================================

CREATE TABLE IF NOT EXISTS dataforseo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Request info
  endpoint VARCHAR(100) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  keywords_requested INTEGER DEFAULT 0,

  -- Cost tracking
  credits_used DECIMAL(10, 4) DEFAULT 0,
  cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- Response info
  status VARCHAR(20),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dataforseo_tenant_date
  ON dataforseo_usage(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE dataforseo_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS dataforseo_usage_tenant_isolation ON dataforseo_usage;
CREATE POLICY dataforseo_usage_tenant_isolation ON dataforseo_usage
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- ============================================
-- Helper functions
-- ============================================

-- Update cluster aggregates when keywords change
CREATE OR REPLACE FUNCTION update_cluster_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the cluster's aggregate values
  IF NEW.cluster_id IS NOT NULL THEN
    UPDATE keyword_clusters
    SET
      total_volume = (
        SELECT COALESCE(SUM(search_volume), 0)
        FROM keyword_research
        WHERE cluster_id = NEW.cluster_id
      ),
      avg_difficulty = (
        SELECT COALESCE(AVG(keyword_difficulty), 0)::INTEGER
        FROM keyword_research
        WHERE cluster_id = NEW.cluster_id
      ),
      keyword_count = (
        SELECT COUNT(*)
        FROM keyword_research
        WHERE cluster_id = NEW.cluster_id
      ),
      updated_at = NOW()
    WHERE id = NEW.cluster_id;
  END IF;

  -- Also update old cluster if keyword was moved
  IF OLD IS NOT NULL AND OLD.cluster_id IS NOT NULL AND OLD.cluster_id != NEW.cluster_id THEN
    UPDATE keyword_clusters
    SET
      total_volume = (
        SELECT COALESCE(SUM(search_volume), 0)
        FROM keyword_research
        WHERE cluster_id = OLD.cluster_id
      ),
      avg_difficulty = (
        SELECT COALESCE(AVG(keyword_difficulty), 0)::INTEGER
        FROM keyword_research
        WHERE cluster_id = OLD.cluster_id
      ),
      keyword_count = (
        SELECT COUNT(*)
        FROM keyword_research
        WHERE cluster_id = OLD.cluster_id
      ),
      updated_at = NOW()
    WHERE id = OLD.cluster_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS keyword_cluster_update ON keyword_research;
CREATE TRIGGER keyword_cluster_update
  AFTER INSERT OR UPDATE OF cluster_id, search_volume, keyword_difficulty OR DELETE
  ON keyword_research
  FOR EACH ROW
  EXECUTE FUNCTION update_cluster_aggregates();

-- ============================================
-- Timestamp update trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_keyword_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS keyword_research_updated ON keyword_research;
CREATE TRIGGER keyword_research_updated
  BEFORE UPDATE ON keyword_research
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_timestamp();

DROP TRIGGER IF EXISTS keyword_clusters_updated ON keyword_clusters;
CREATE TRIGGER keyword_clusters_updated
  BEFORE UPDATE ON keyword_clusters
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_timestamp();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE keyword_research IS 'Keyword research data with DataForSEO integration';
COMMENT ON COLUMN keyword_research.search_volume IS 'Monthly search volume';
COMMENT ON COLUMN keyword_research.keyword_difficulty IS 'Ranking difficulty 0-100 (higher = harder)';
COMMENT ON COLUMN keyword_research.cpc IS 'Cost per click in USD';
COMMENT ON COLUMN keyword_research.trend_data IS 'Monthly search volume history as JSONB array';
COMMENT ON COLUMN keyword_research.serp_features IS 'SERP features present for this keyword';
COMMENT ON TABLE keyword_clusters IS 'Groups of related keywords for topic clusters';
COMMENT ON TABLE dataforseo_usage IS 'Track DataForSEO API usage and costs per tenant';
