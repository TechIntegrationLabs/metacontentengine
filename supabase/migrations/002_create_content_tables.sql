-- Migration: Create Content Tables
-- Version: 1.0

-- CONTRIBUTORS TABLE (AI Personas/Authors)
CREATE TABLE public.contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_contributors_tenant ON contributors(tenant_id);
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON contributors FOR ALL USING (tenant_id = public.get_tenant_id());

-- CATEGORIES TABLE
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  wp_category_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON categories FOR ALL USING (tenant_id = public.get_tenant_id());

-- TAGS TABLE
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  wp_tag_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_tags_tenant ON tags(tenant_id);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tags FOR ALL USING (tenant_id = public.get_tenant_id());

-- CONTENT CLUSTERS TABLE
CREATE TABLE public.content_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_clusters_tenant ON content_clusters(tenant_id);
ALTER TABLE content_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON content_clusters FOR ALL USING (tenant_id = public.get_tenant_id());

-- ARTICLES TABLE
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_articles_tenant ON articles(tenant_id);
CREATE INDEX idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX idx_articles_tenant_created ON articles(tenant_id, created_at DESC);
CREATE INDEX idx_articles_contributor ON articles(contributor_id);
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON articles FOR ALL USING (tenant_id = public.get_tenant_id());

-- ARTICLE CATEGORIES JUNCTION
CREATE TABLE public.article_categories (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- ARTICLE TAGS JUNCTION
CREATE TABLE public.article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- CONTENT IDEAS TABLE
CREATE TABLE public.content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_ideas_tenant ON content_ideas(tenant_id);
CREATE INDEX idx_ideas_status ON content_ideas(tenant_id, status);
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON content_ideas FOR ALL USING (tenant_id = public.get_tenant_id());

-- MEDIA TABLE
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_media_tenant ON media(tenant_id);
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON media FOR ALL USING (tenant_id = public.get_tenant_id());

-- Triggers for updated_at
CREATE TRIGGER update_contributors_updated_at
  BEFORE UPDATE ON contributors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clusters_updated_at
  BEFORE UPDATE ON content_clusters FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
