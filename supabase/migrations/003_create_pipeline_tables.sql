-- Migration: Create Pipeline and AI Usage Tables
-- Version: 1.0

-- PIPELINE RUNS TABLE
CREATE TABLE public.pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_pipeline_runs_tenant ON pipeline_runs(tenant_id);
CREATE INDEX idx_pipeline_runs_tenant_status ON pipeline_runs(tenant_id, stage);
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON pipeline_runs FOR ALL USING (tenant_id = public.get_tenant_id());

-- AI USAGE TABLE
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_ai_usage_tenant ON ai_usage(tenant_id);
CREATE INDEX idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at DESC);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON ai_usage FOR ALL USING (tenant_id = public.get_tenant_id());

-- WORDPRESS CONNECTIONS TABLE
CREATE TABLE public.wp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_wp_connections_tenant ON wp_connections(tenant_id);
ALTER TABLE wp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_manage_wp" ON wp_connections
  FOR ALL USING (
    tenant_id = public.get_tenant_id() 
    AND public.get_user_role() IN ('owner', 'admin')
  );

-- WEBHOOKS TABLE
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON webhooks FOR ALL USING (tenant_id = public.get_tenant_id());

-- ACTIVITY LOG TABLE
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX idx_activity_log_tenant_date ON activity_log(tenant_id, created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON activity_log FOR ALL USING (tenant_id = public.get_tenant_id());

-- Trigger for wp_connections updated_at
CREATE TRIGGER update_wp_connections_updated_at
  BEFORE UPDATE ON wp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
