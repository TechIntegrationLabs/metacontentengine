-- ============================================
-- COMBINED MIGRATIONS FOR META CONTENT ENGINE
-- ============================================
--
-- This file combines all migrations for manual execution in Supabase SQL Editor.
-- Run this if you cannot use the Supabase CLI.
--
-- Order: 001 → 002 → 003 → 004 → 005 → 007 (006 requires bucket to exist first)
--
-- After running this, you must manually:
-- 1. Create storage bucket 'content-assets' in Dashboard
-- 2. Enable Custom Access Token Hook in Authentication → Hooks
-- 3. Set APP_ENCRYPTION_KEY: ALTER DATABASE postgres SET app.encryption_key = 'your-key';
-- 4. Run the seed file: supabase/seed/001_seed_geteducated.sql
--
-- ============================================

-- ============================================
-- MIGRATION 001: TENANT INFRASTRUCTURE
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to get current tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    NULL
  )
$func$;

-- Function to get current user role within tenant
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'viewer'
  )
$func$;

-- TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  app_name TEXT DEFAULT 'Content Engine',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f97316',
  primary_domain TEXT,
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  blocked_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  features JSONB DEFAULT '{"maxContributors": 3, "maxArticlesPerMonth": 50, "aiGenerationEnabled": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_read_own_tenant" ON tenants;
CREATE POLICY "users_can_read_own_tenant" ON tenants
  FOR SELECT USING (id = auth.tenant_id());

DROP POLICY IF EXISTS "admins_can_update_own_tenant" ON tenants;
CREATE POLICY "admins_can_update_own_tenant" ON tenants
  FOR UPDATE USING (id = auth.tenant_id() AND auth.user_role() IN ('owner', 'admin'));

-- TENANT USERS TABLE
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_read_own_memberships" ON tenant_users;
CREATE POLICY "users_can_read_own_memberships" ON tenant_users
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_can_read_tenant_memberships" ON tenant_users;
CREATE POLICY "users_can_read_tenant_memberships" ON tenant_users
  FOR SELECT USING (tenant_id = auth.tenant_id());

-- TENANT SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_key ON tenant_settings(tenant_id, key);
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_settings;
CREATE POLICY "tenant_isolation" ON tenant_settings FOR ALL USING (tenant_id = auth.tenant_id());

-- TENANT API KEYS TABLE
CREATE TABLE IF NOT EXISTS public.tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_hint TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, service)
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant ON tenant_api_keys(tenant_id);
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_tenant_settings_updated_at ON tenant_settings;
CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATION 002: CONTENT TABLES
-- ============================================

-- CONTRIBUTORS TABLE (AI Personas/Authors)
CREATE TABLE IF NOT EXISTS public.contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  wp_author_id INTEGER,
  wp_author_slug TEXT,
  style_proxy TEXT,
  style_proxy_description TEXT,
  voice_profile JSONB DEFAULT '{
    "formalityScale": 5,
    "description": "",
    "guidelines": "",
    "signaturePhrases": [],
    "transitionWords": [],
    "phrasesToAvoid": [],
    "topicsToAvoid": []
  }'::jsonb,
  expertise_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  content_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  article_count INTEGER DEFAULT 0,
  average_quality_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributors_tenant ON contributors(tenant_id);
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON contributors;
CREATE POLICY "tenant_isolation" ON contributors FOR ALL USING (tenant_id = auth.tenant_id());

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  wp_category_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON categories;
CREATE POLICY "tenant_isolation" ON categories FOR ALL USING (tenant_id = auth.tenant_id());

-- TAGS TABLE
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  wp_tag_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tags;
CREATE POLICY "tenant_isolation" ON tags FOR ALL USING (tenant_id = auth.tenant_id());

-- CONTENT CLUSTERS TABLE
CREATE TABLE IF NOT EXISTS public.content_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pillar_article_id UUID,
  core_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  secondary_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clusters_tenant ON content_clusters(tenant_id);
ALTER TABLE content_clusters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON content_clusters;
CREATE POLICY "tenant_isolation" ON content_clusters FOR ALL USING (tenant_id = auth.tenant_id());

-- ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'draft',
  contributor_id UUID REFERENCES contributors(id),
  wp_author_id INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  schema_markup JSONB,
  primary_keyword TEXT,
  cluster_id UUID REFERENCES content_clusters(id),
  quality_score INTEGER,
  readability_score INTEGER,
  seo_score INTEGER,
  human_score INTEGER,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0,
  featured_image_url TEXT,
  featured_image_alt TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  wp_post_id INTEGER,
  published_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_articles_tenant ON articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_articles_tenant_created ON articles(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_contributor ON articles(contributor_id);
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON articles;
CREATE POLICY "tenant_isolation" ON articles FOR ALL USING (tenant_id = auth.tenant_id());

-- ARTICLE CATEGORIES JUNCTION
CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- ARTICLE TAGS JUNCTION
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- CONTENT IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'manual',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  primary_keyword TEXT,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  assigned_contributor_id UUID REFERENCES contributors(id),
  assigned_user_id UUID REFERENCES auth.users(id),
  cluster_id UUID REFERENCES content_clusters(id),
  article_id UUID REFERENCES articles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ideas_tenant ON content_ideas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON content_ideas(tenant_id, status);
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON content_ideas;
CREATE POLICY "tenant_isolation" ON content_ideas FOR ALL USING (tenant_id = auth.tenant_id());

-- MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  wp_media_id INTEGER,
  storage_path TEXT,
  bucket_id TEXT DEFAULT 'content-assets',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_media_tenant ON media(tenant_id);
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON media;
CREATE POLICY "tenant_isolation" ON media FOR ALL USING (tenant_id = auth.tenant_id());

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_contributors_updated_at ON contributors;
CREATE TRIGGER update_contributors_updated_at
  BEFORE UPDATE ON contributors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_clusters_updated_at ON content_clusters;
CREATE TRIGGER update_clusters_updated_at
  BEFORE UPDATE ON content_clusters FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_ideas_updated_at ON content_ideas;
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATION 003: PIPELINE TABLES
-- ============================================

-- PIPELINE RUNS TABLE
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  primary_keyword TEXT,
  content_type TEXT NOT NULL,
  contributor_id UUID REFERENCES contributors(id),
  stage TEXT DEFAULT 'IDLE',
  progress INTEGER DEFAULT 0,
  error TEXT,
  article_id UUID REFERENCES articles(id),
  generated_content TEXT,
  outline JSONB,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,4) DEFAULT 0,
  duration INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant ON pipeline_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant_status ON pipeline_runs(tenant_id, stage);
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON pipeline_runs;
CREATE POLICY "tenant_isolation" ON pipeline_runs FOR ALL USING (tenant_id = auth.tenant_id());

-- AI USAGE TABLE
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost DECIMAL(10,6) NOT NULL,
  operation TEXT NOT NULL,
  pipeline_run_id UUID REFERENCES pipeline_runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at DESC);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON ai_usage;
CREATE POLICY "tenant_isolation" ON ai_usage FOR ALL USING (tenant_id = auth.tenant_id());

-- WORDPRESS CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.wp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  site_url TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  cached_categories JSONB,
  cached_tags JSONB,
  cached_authors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, site_url)
);

CREATE INDEX IF NOT EXISTS idx_wp_connections_tenant ON wp_connections(tenant_id);
ALTER TABLE wp_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_can_manage_wp" ON wp_connections;
CREATE POLICY "admins_can_manage_wp" ON wp_connections
  FOR ALL USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('owner', 'admin')
  );

-- WEBHOOKS TABLE
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON webhooks;
CREATE POLICY "tenant_isolation" ON webhooks FOR ALL USING (tenant_id = auth.tenant_id());

-- ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant_date ON activity_log(tenant_id, created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON activity_log;
CREATE POLICY "tenant_isolation" ON activity_log FOR ALL USING (tenant_id = auth.tenant_id());

-- Trigger for wp_connections updated_at
DROP TRIGGER IF EXISTS update_wp_connections_updated_at ON wp_connections;
CREATE TRIGGER update_wp_connections_updated_at
  BEFORE UPDATE ON wp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATION 004: ADDITIONAL TENANT TABLES
-- ============================================

-- TENANT SITE CATALOG (for internal linking)
CREATE TABLE IF NOT EXISTS public.tenant_site_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  slug TEXT,
  wp_post_id INTEGER,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT,
  content_text TEXT,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_name TEXT,
  category_name TEXT,
  published_at TIMESTAMPTZ,
  word_count INTEGER,
  times_linked_to INTEGER DEFAULT 0,
  times_linked_from INTEGER DEFAULT 0,
  relevance_score DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_pillar BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, url)
);

CREATE INDEX IF NOT EXISTS idx_site_catalog_tenant ON tenant_site_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_catalog_tenant_active ON tenant_site_catalog(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_site_catalog_tenant_topics ON tenant_site_catalog USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_site_catalog_tenant_keywords ON tenant_site_catalog USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_site_catalog_url ON tenant_site_catalog(url);

ALTER TABLE tenant_site_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_site_catalog;
CREATE POLICY "tenant_isolation" ON tenant_site_catalog
  FOR ALL USING (tenant_id = auth.tenant_id());

-- TENANT MONETIZATION CATEGORIES
CREATE TABLE IF NOT EXISTS public.tenant_monetization_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  category_id TEXT NOT NULL,
  sub_category TEXT,
  sub_category_id TEXT,
  shortcode_template TEXT,
  shortcode_params JSONB DEFAULT '{}'::jsonb,
  keyword_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  topic_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, category_id, sub_category_id)
);

CREATE INDEX IF NOT EXISTS idx_monetization_tenant ON tenant_monetization_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monetization_active ON tenant_monetization_categories(tenant_id, is_active);

ALTER TABLE tenant_monetization_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_monetization_categories;
CREATE POLICY "tenant_isolation" ON tenant_monetization_categories
  FOR ALL USING (tenant_id = auth.tenant_id());

-- TENANT CONTENT LEVELS
CREATE TABLE IF NOT EXISTS public.tenant_content_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES tenant_content_levels(id),
  level_order INTEGER DEFAULT 0,
  external_ids JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_content_levels_tenant ON tenant_content_levels(tenant_id);

ALTER TABLE tenant_content_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_content_levels;
CREATE POLICY "tenant_isolation" ON tenant_content_levels
  FOR ALL USING (tenant_id = auth.tenant_id());

-- TENANT WRITING SAMPLES
CREATE TABLE IF NOT EXISTS public.tenant_writing_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contributor_id UUID REFERENCES contributors(id) ON DELETE SET NULL,
  title TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'manual',
  content_text TEXT NOT NULL,
  content_html TEXT,
  word_count INTEGER,
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
  analysis_status TEXT DEFAULT 'pending',
  analysis_error TEXT,
  analyzed_at TIMESTAMPTZ,
  analysis_model TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writing_samples_tenant ON tenant_writing_samples(tenant_id);
CREATE INDEX IF NOT EXISTS idx_writing_samples_contributor ON tenant_writing_samples(contributor_id);
CREATE INDEX IF NOT EXISTS idx_writing_samples_status ON tenant_writing_samples(analysis_status);

ALTER TABLE tenant_writing_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_writing_samples;
CREATE POLICY "tenant_isolation" ON tenant_writing_samples
  FOR ALL USING (tenant_id = auth.tenant_id());

-- TENANT DOMAIN RULES
CREATE TABLE IF NOT EXISTS public.tenant_domain_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  reason TEXT,
  match_subdomains BOOLEAN DEFAULT true,
  pattern TEXT,
  times_blocked INTEGER DEFAULT 0,
  times_allowed INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tenant_id, domain, rule_type)
);

CREATE INDEX IF NOT EXISTS idx_domain_rules_tenant ON tenant_domain_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domain_rules_type ON tenant_domain_rules(tenant_id, rule_type);

ALTER TABLE tenant_domain_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_domain_rules;
CREATE POLICY "tenant_isolation" ON tenant_domain_rules
  FOR ALL USING (tenant_id = auth.tenant_id());

-- TENANT BANNED PHRASES
CREATE TABLE IF NOT EXISTS public.tenant_banned_phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  phrase TEXT NOT NULL,
  phrase_type TEXT DEFAULT 'exact',
  severity TEXT DEFAULT 'warning',
  replacement TEXT,
  reason TEXT,
  times_detected INTEGER DEFAULT 0,
  last_detected_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, phrase)
);

CREATE INDEX IF NOT EXISTS idx_banned_phrases_tenant ON tenant_banned_phrases(tenant_id);

ALTER TABLE tenant_banned_phrases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON tenant_banned_phrases;
CREATE POLICY "tenant_isolation" ON tenant_banned_phrases
  FOR ALL USING (tenant_id = auth.tenant_id());

-- ARTICLE INTERNAL LINKS
CREATE TABLE IF NOT EXISTS public.article_internal_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  source_article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  target_catalog_id UUID REFERENCES tenant_site_catalog(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  context_text TEXT,
  position_in_article INTEGER,
  is_natural BOOLEAN DEFAULT true,
  relevance_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'ai'
);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON article_internal_links(source_article_id);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON article_internal_links(target_catalog_id);
CREATE INDEX IF NOT EXISTS idx_internal_links_tenant ON article_internal_links(tenant_id);

ALTER TABLE article_internal_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON article_internal_links;
CREATE POLICY "tenant_isolation" ON article_internal_links
  FOR ALL USING (tenant_id = auth.tenant_id());

-- TRIGGERS
DROP TRIGGER IF EXISTS update_site_catalog_updated_at ON tenant_site_catalog;
CREATE TRIGGER update_site_catalog_updated_at
  BEFORE UPDATE ON tenant_site_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_monetization_updated_at ON tenant_monetization_categories;
CREATE TRIGGER update_monetization_updated_at
  BEFORE UPDATE ON tenant_monetization_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- HELPER FUNCTIONS
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

DROP TRIGGER IF EXISTS increment_catalog_link_count ON article_internal_links;
CREATE TRIGGER increment_catalog_link_count
  AFTER INSERT ON article_internal_links
  FOR EACH ROW
  WHEN (NEW.target_catalog_id IS NOT NULL)
  EXECUTE FUNCTION increment_link_count();

-- ============================================
-- MIGRATION 005: CUSTOM ACCESS TOKEN HOOK
-- ============================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
  user_role text;
  tenant_status text;
BEGIN
  claims := event->'claims';

  SELECT
    tu.tenant_id,
    tu.role,
    t.status
  INTO
    user_tenant_id,
    user_role,
    tenant_status
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = (event->>'user_id')::uuid
    AND tu.accepted_at IS NOT NULL
    AND t.status = 'active'
  ORDER BY tu.accepted_at DESC
  LIMIT 1;

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      COALESCE(claims->'app_metadata', '{}'::jsonb) ||
      jsonb_build_object(
        'tenant_id', user_tenant_id::text,
        'role', COALESCE(user_role, 'viewer')
      )
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

CREATE OR REPLACE FUNCTION public.get_user_tenant(p_user_id uuid)
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  user_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    tu.role as user_role
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = p_user_id
    AND tu.accepted_at IS NOT NULL
    AND t.status = 'active'
  ORDER BY tu.accepted_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant TO authenticated;

CREATE OR REPLACE FUNCTION public.switch_user_tenant(p_new_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_tenant_status text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT tu.role, t.status
  INTO v_role, v_tenant_status
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = v_user_id
    AND tu.tenant_id = p_new_tenant_id
    AND tu.accepted_at IS NOT NULL;

  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No access to tenant');
  END IF;

  IF v_tenant_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant is not active');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', p_new_tenant_id,
    'role', v_role,
    'message', 'Call refreshSession() to get updated JWT'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_user_tenant TO authenticated;

CREATE OR REPLACE FUNCTION public.list_user_tenants()
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  app_name text,
  logo_url text,
  primary_color text,
  user_role text,
  joined_at timestamptz,
  is_current boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.app_name,
    t.logo_url,
    t.primary_color,
    tu.role as user_role,
    tu.accepted_at as joined_at,
    (t.id = auth.tenant_id()) as is_current
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = auth.uid()
    AND tu.accepted_at IS NOT NULL
    AND t.status = 'active'
  ORDER BY tu.accepted_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_user_tenants TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_tenant_invitation(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_invitation_exists boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = v_user_id
      AND tenant_id = p_tenant_id
      AND accepted_at IS NULL
  ) INTO v_invitation_exists;

  IF NOT v_invitation_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending invitation found');
  END IF;

  UPDATE tenant_users
  SET accepted_at = NOW()
  WHERE user_id = v_user_id
    AND tenant_id = p_tenant_id
    AND accepted_at IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', p_tenant_id,
    'message', 'Invitation accepted. Refresh session to access tenant.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation TO authenticated;

-- ============================================
-- MIGRATION 007: API KEY FUNCTIONS
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
  v_encryption_key := current_setting('app.encryption_key', true);

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Encryption key not configured. Set app.encryption_key in database config.'
    );
  END IF;

  v_key_hint := '****' || RIGHT(p_api_key, 4);

  v_encrypted_key := encode(
    pgp_sym_encrypt(
      p_api_key,
      v_encryption_key,
      'compress-algo=1, cipher-algo=aes256'
    ),
    'base64'
  );

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
  v_encryption_key := current_setting('app.encryption_key', true);

  IF v_encryption_key IS NULL OR v_encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;

  SELECT encrypted_key INTO v_encrypted_key
  FROM tenant_api_keys
  WHERE tenant_id = p_tenant_id
    AND service = p_service
    AND is_active = true;

  IF v_encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;

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

DROP POLICY IF EXISTS "admins_can_manage_api_keys" ON tenant_api_keys;
CREATE POLICY "admins_can_manage_api_keys" ON tenant_api_keys
  FOR ALL
  USING (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('owner', 'admin')
  );

GRANT EXECUTE ON FUNCTION public.store_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.get_decrypted_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_api_key TO service_role;
GRANT EXECUTE ON FUNCTION public.list_tenant_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_key_usage TO service_role;

-- ============================================
-- COMPLETE!
-- ============================================

SELECT 'All migrations applied successfully!' as status;
