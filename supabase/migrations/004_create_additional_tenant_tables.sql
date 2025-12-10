-- Migration: Create Additional Tenant Tables
-- Version: 1.0
-- Description: Site catalog, monetization categories, writing samples, content levels

-- ============================================
-- TENANT SITE CATALOG (for internal linking)
-- ============================================

CREATE TABLE public.tenant_site_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  -- Content identifiers
  url TEXT NOT NULL,
  slug TEXT,
  wp_post_id INTEGER,

  -- Content
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT,
  content_text TEXT,

  -- Metadata
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_name TEXT,
  category_name TEXT,
  published_at TIMESTAMPTZ,
  word_count INTEGER,

  -- Linking stats
  times_linked_to INTEGER DEFAULT 0,
  times_linked_from INTEGER DEFAULT 0,
  relevance_score DECIMAL(5,2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_pillar BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending, synced, error
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, url)
);

CREATE INDEX idx_site_catalog_tenant ON tenant_site_catalog(tenant_id);
CREATE INDEX idx_site_catalog_tenant_active ON tenant_site_catalog(tenant_id, is_active);
CREATE INDEX idx_site_catalog_tenant_topics ON tenant_site_catalog USING GIN(topics);
CREATE INDEX idx_site_catalog_tenant_keywords ON tenant_site_catalog USING GIN(keywords);
CREATE INDEX idx_site_catalog_url ON tenant_site_catalog(url);

ALTER TABLE tenant_site_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_site_catalog
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- TENANT MONETIZATION CATEGORIES
-- ============================================

CREATE TABLE public.tenant_monetization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  -- Category hierarchy
  category TEXT NOT NULL,
  category_id TEXT NOT NULL,
  sub_category TEXT,
  sub_category_id TEXT,

  -- Shortcode configuration
  shortcode_template TEXT,
  shortcode_params JSONB DEFAULT '{}'::jsonb,

  -- Matching configuration
  keyword_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  topic_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority INTEGER DEFAULT 0,

  -- Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, category_id, sub_category_id)
);

CREATE INDEX idx_monetization_tenant ON tenant_monetization_categories(tenant_id);
CREATE INDEX idx_monetization_active ON tenant_monetization_categories(tenant_id, is_active);

ALTER TABLE tenant_monetization_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_monetization_categories
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- TENANT CONTENT LEVELS (degree levels, tiers, etc.)
-- ============================================

CREATE TABLE public.tenant_content_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,

  -- Hierarchy
  parent_id UUID REFERENCES tenant_content_levels(id),
  level_order INTEGER DEFAULT 0,

  -- Mapping
  external_ids JSONB DEFAULT '{}'::jsonb, -- For mapping to external systems

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_content_levels_tenant ON tenant_content_levels(tenant_id);

ALTER TABLE tenant_content_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_content_levels
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- TENANT WRITING SAMPLES (for voice analysis)
-- ============================================

CREATE TABLE public.tenant_writing_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contributor_id UUID REFERENCES contributors(id) ON DELETE SET NULL,

  -- Content
  title TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'manual', -- manual, url, file, wordpress
  content_text TEXT NOT NULL,
  content_html TEXT,
  word_count INTEGER,

  -- Analysis results (populated by AI)
  voice_analysis JSONB DEFAULT '{
    "tone": [],
    "complexity_level": null,
    "typical_sentence_length": null,
    "vocabulary_patterns": [],
    "personality_traits": [],
    "target_audience": null,
    "seo_approach": null
  }'::jsonb,

  extracted_phrases JSONB DEFAULT '{
    "signature_phrases": [],
    "transition_words": [],
    "intro_patterns": [],
    "conclusion_patterns": []
  }'::jsonb,

  style_metrics JSONB DEFAULT '{
    "avg_sentence_length": null,
    "avg_paragraph_length": null,
    "passive_voice_ratio": null,
    "question_ratio": null,
    "exclamation_ratio": null
  }'::jsonb,

  -- Processing status
  analysis_status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed
  analysis_error TEXT,
  analyzed_at TIMESTAMPTZ,
  analysis_model TEXT, -- Which AI model analyzed this

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_writing_samples_tenant ON tenant_writing_samples(tenant_id);
CREATE INDEX idx_writing_samples_contributor ON tenant_writing_samples(contributor_id);
CREATE INDEX idx_writing_samples_status ON tenant_writing_samples(analysis_status);

ALTER TABLE tenant_writing_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_writing_samples
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- TENANT DOMAIN RULES
-- ============================================

CREATE TABLE public.tenant_domain_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  domain TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- blocked, allowed, competitor, trusted
  reason TEXT,

  -- Matching
  match_subdomains BOOLEAN DEFAULT true,
  pattern TEXT, -- Optional regex pattern

  -- Stats
  times_blocked INTEGER DEFAULT 0,
  times_allowed INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(tenant_id, domain, rule_type)
);

CREATE INDEX idx_domain_rules_tenant ON tenant_domain_rules(tenant_id);
CREATE INDEX idx_domain_rules_type ON tenant_domain_rules(tenant_id, rule_type);

ALTER TABLE tenant_domain_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_domain_rules
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- TENANT BANNED PHRASES
-- ============================================

CREATE TABLE public.tenant_banned_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  phrase TEXT NOT NULL,
  phrase_type TEXT DEFAULT 'exact', -- exact, contains, regex
  severity TEXT DEFAULT 'warning', -- warning, error, critical
  replacement TEXT, -- Suggested replacement
  reason TEXT,

  -- Stats
  times_detected INTEGER DEFAULT 0,
  last_detected_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, phrase)
);

CREATE INDEX idx_banned_phrases_tenant ON tenant_banned_phrases(tenant_id);

ALTER TABLE tenant_banned_phrases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_banned_phrases
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- ARTICLE INTERNAL LINKS (tracking)
-- ============================================

CREATE TABLE public.article_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  source_article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  target_catalog_id UUID REFERENCES tenant_site_catalog(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,

  anchor_text TEXT NOT NULL,
  context_text TEXT, -- Surrounding sentence
  position_in_article INTEGER, -- Order of appearance

  -- Link quality
  is_natural BOOLEAN DEFAULT true,
  relevance_score DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'ai' -- ai, manual
);

CREATE INDEX idx_internal_links_source ON article_internal_links(source_article_id);
CREATE INDEX idx_internal_links_target ON article_internal_links(target_catalog_id);
CREATE INDEX idx_internal_links_tenant ON article_internal_links(tenant_id);

ALTER TABLE article_internal_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON article_internal_links
  FOR ALL USING (tenant_id = public.get_tenant_id());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_site_catalog_updated_at
  BEFORE UPDATE ON tenant_site_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_monetization_updated_at
  BEFORE UPDATE ON tenant_monetization_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get tenant's blocked domains as array
CREATE OR REPLACE FUNCTION get_tenant_blocked_domains(p_tenant_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    ARRAY_AGG(domain),
    ARRAY[]::TEXT[]
  )
  FROM tenant_domain_rules
  WHERE tenant_id = p_tenant_id
    AND rule_type = 'blocked'
    AND is_active = true;
$$;

-- Function to get tenant's allowed domains as array
CREATE OR REPLACE FUNCTION get_tenant_allowed_domains(p_tenant_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    ARRAY_AGG(domain),
    ARRAY[]::TEXT[]
  )
  FROM tenant_domain_rules
  WHERE tenant_id = p_tenant_id
    AND rule_type = 'allowed'
    AND is_active = true;
$$;

-- Function to check if a domain is blocked for tenant
CREATE OR REPLACE FUNCTION is_domain_blocked(p_tenant_id UUID, p_domain TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_domain_rules
    WHERE tenant_id = p_tenant_id
      AND rule_type = 'blocked'
      AND is_active = true
      AND (
        domain = p_domain
        OR (match_subdomains AND p_domain LIKE '%.' || domain)
      )
  );
$$;

-- Function to increment site catalog link count
CREATE OR REPLACE FUNCTION increment_link_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tenant_site_catalog
  SET times_linked_to = times_linked_to + 1
  WHERE id = NEW.target_catalog_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_catalog_link_count
  AFTER INSERT ON article_internal_links
  FOR EACH ROW
  WHEN (NEW.target_catalog_id IS NOT NULL)
  EXECUTE FUNCTION increment_link_count();
