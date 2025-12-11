# Meta Content Engine v0.5 - Multi-Tenant Architecture

> **Document Version:** 1.0
> **Created:** December 10, 2024
> **Status:** CRITICAL - Contains Security Fixes Required

---

## Executive Summary

This document addresses the multi-tenant architecture to ensure each tenant instance has completely isolated:
- Database records (articles, categories, contributors, etc.)
- Site catalog (their own published content for internal linking)
- Configuration (domain rules, banned phrases, monetization)
- API keys and WordPress connections
- Storage files

**Critical Finding:** Junction tables `article_categories` and `article_tags` are missing tenant isolation and require immediate migration.

---

## 1. Tenant Isolation Model

### 1.1 How Isolation Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LOGIN                                │
│                            │                                     │
│                            ▼                                     │
│                ┌─────────────────────┐                          │
│                │  Supabase Auth      │                          │
│                │  custom_access_     │                          │
│                │  token_hook()       │                          │
│                └──────────┬──────────┘                          │
│                           │                                      │
│                           ▼                                      │
│                ┌─────────────────────┐                          │
│                │  JWT with claims:   │                          │
│                │  {                  │                          │
│                │    tenant_id: uuid, │                          │
│                │    role: "admin"    │                          │
│                │  }                  │                          │
│                └──────────┬──────────┘                          │
│                           │                                      │
│                           ▼                                      │
│     ┌─────────────────────────────────────────────────┐         │
│     │              ROW LEVEL SECURITY                  │         │
│     │  WHERE tenant_id = public.get_tenant_id()       │         │
│     │                                                  │         │
│     │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │         │
│     │  │Tenant A │ │Tenant B │ │Tenant C │           │         │
│     │  │ Data    │ │ Data    │ │ Data    │           │         │
│     │  └─────────┘ └─────────┘ └─────────┘           │         │
│     │       ↑                                         │         │
│     │       │ User can ONLY see their tenant's data   │         │
│     └───────┴─────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Per-Tenant Data Ownership

| Data Category | Table(s) | Isolation Method |
|---------------|----------|------------------|
| **Content** | articles, content_ideas, media | tenant_id + RLS |
| **Organization** | categories, tags, content_clusters | tenant_id + RLS |
| **People** | contributors | tenant_id + RLS |
| **Site Catalog** | tenant_site_catalog | tenant_id + RLS |
| **Internal Links** | article_internal_links | tenant_id + RLS |
| **Configuration** | tenant_settings, tenant_domain_rules, tenant_banned_phrases | tenant_id + RLS |
| **Monetization** | tenant_monetization_categories, tenant_content_levels | tenant_id + RLS |
| **Operations** | pipeline_runs, ai_usage, activity_log | tenant_id + RLS |
| **Integrations** | wp_connections, webhooks, tenant_api_keys | tenant_id + RLS |
| **Storage** | content-assets bucket | Folder path = tenant_id |

---

## 2. CRITICAL: Security Fix Required

### 2.1 Junction Table Vulnerability

**Issue:** `article_categories` and `article_tags` tables do NOT have tenant_id columns or RLS policies.

**Risk:** Malicious queries could potentially access article-category relationships across tenants.

**Required Migration:**

```sql
-- 016_fix_junction_table_isolation.sql
-- CRITICAL: Fix tenant isolation for junction tables

-- ============================================
-- FIX article_categories
-- ============================================

-- Step 1: Add tenant_id column
ALTER TABLE article_categories
  ADD COLUMN tenant_id UUID;

-- Step 2: Populate tenant_id from articles table
UPDATE article_categories ac
SET tenant_id = a.tenant_id
FROM articles a
WHERE ac.article_id = a.id;

-- Step 3: Make tenant_id NOT NULL
ALTER TABLE article_categories
  ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE article_categories
  ADD CONSTRAINT fk_article_categories_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 5: Enable RLS
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
CREATE POLICY article_categories_tenant_isolation ON article_categories
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Step 7: Add index for performance
CREATE INDEX idx_article_categories_tenant
  ON article_categories(tenant_id);

-- ============================================
-- FIX article_tags
-- ============================================

-- Step 1: Add tenant_id column
ALTER TABLE article_tags
  ADD COLUMN tenant_id UUID;

-- Step 2: Populate tenant_id from articles table
UPDATE article_tags at
SET tenant_id = a.tenant_id
FROM articles a
WHERE at.article_id = a.id;

-- Step 3: Make tenant_id NOT NULL
ALTER TABLE article_tags
  ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE article_tags
  ADD CONSTRAINT fk_article_tags_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 5: Enable RLS
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
CREATE POLICY article_tags_tenant_isolation ON article_tags
  FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

-- Step 7: Add index for performance
CREATE INDEX idx_article_tags_tenant
  ON article_tags(tenant_id);

-- ============================================
-- Add trigger to auto-populate tenant_id
-- ============================================

CREATE OR REPLACE FUNCTION set_junction_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get tenant_id from the article being linked
  SELECT tenant_id INTO NEW.tenant_id
  FROM articles
  WHERE id = NEW.article_id;

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot determine tenant_id for junction record';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_categories_set_tenant
  BEFORE INSERT ON article_categories
  FOR EACH ROW
  EXECUTE FUNCTION set_junction_tenant_id();

CREATE TRIGGER article_tags_set_tenant
  BEFORE INSERT ON article_tags
  FOR EACH ROW
  EXECUTE FUNCTION set_junction_tenant_id();
```

**This migration MUST be run before production deployment.**

---

## 3. Tenant Lifecycle

### 3.1 Creating a New Tenant

When `create-tenant` edge function is called, it creates:

| Created | Details |
|---------|---------|
| `tenants` row | Name, slug, branding, plan, features |
| `auth.users` row | Admin user with email/password |
| `tenant_users` row | Links admin to tenant with 'owner' role |
| `contributors` row | "Default Author" contributor |
| `tenant_settings` rows | Default generation, humanization, publishing settings |

**What is NOT created (starts empty):**
- Domain rules (tenant configures their competitors)
- Banned phrases (tenant configures their rules)
- Monetization categories (tenant configures or disables)
- Content levels (tenant configures their hierarchy)
- Site catalog (tenant syncs from their WordPress)
- Categories (tenant creates their own)
- Tags (tenant creates their own)

### 3.2 Tenant Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEW TENANT ONBOARDING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: CREATE TENANT                                          │
│  └── POST /functions/v1/create-tenant                           │
│      └── Creates: tenant, admin user, default contributor       │
│                                                                  │
│  Step 2: CONFIGURE BRAND (Magic Setup)                          │
│  └── Brand DNA extraction from URL                              │
│  └── Stores: branding colors, voice tone, industry              │
│                                                                  │
│  Step 3: CONNECT WORDPRESS                                       │
│  └── Settings > Integrations > WordPress                        │
│  └── Enter: site URL, username, app password                    │
│  └── Test connection                                            │
│  └── Stores: wp_connections record                              │
│                                                                  │
│  Step 4: SYNC SITE CATALOG                                      │
│  └── POST /functions/v1/sync-site-catalog                       │
│  └── Fetches all published posts from WordPress                 │
│  └── Stores: tenant_site_catalog records                        │
│  └── Enables: Internal linking suggestions                      │
│                                                                  │
│  Step 5: CONFIGURE DOMAIN RULES (Optional)                      │
│  └── Settings > Content > Domain Rules                          │
│  └── Add blocked competitors                                    │
│  └── Add allowed external sources                               │
│  └── Stores: tenant_domain_rules records                        │
│                                                                  │
│  Step 6: CREATE CATEGORIES                                       │
│  └── Content > Categories                                       │
│  └── Create category hierarchy for content organization         │
│  └── Stores: categories records                                 │
│                                                                  │
│  Step 7: CREATE CONTRIBUTORS                                     │
│  └── Contributors page                                          │
│  └── Create AI personas with voice profiles                     │
│  └── Stores: contributors records                               │
│                                                                  │
│  Step 8: CONFIGURE MONETIZATION (Optional)                      │
│  └── Settings > Monetization                                    │
│  └── Define shortcode templates and categories                  │
│  └── Stores: tenant_monetization_categories records             │
│                                                                  │
│  ✅ TENANT READY TO GENERATE CONTENT                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Default Settings per Tenant

Created by `create-tenant` function:

```typescript
// Generation settings
{
  key: 'generation',
  value: {
    defaultWordCount: 1500,
    minWordCount: 800,
    maxWordCount: 3000,
    qualityThreshold: 75,
    humanizationMode: 'medium',
    internalLinkTarget: 3,
    externalLinkTarget: 1
  }
}

// Humanization settings
{
  key: 'humanization',
  value: {
    provider: 'stealthgpt',
    mode: 'medium',
    tone: 'College',
    detectionThreshold: 25,
    maxIterations: 3
  }
}

// Publishing settings
{
  key: 'publishing',
  value: {
    autoPublishEnabled: false,
    autoPublishDays: 3,
    requireReview: true,
    minimumQualityScore: 80,
    maximumRiskLevel: 'LOW'
  }
}
```

---

## 4. Per-Tenant Data Flows

### 4.1 Site Catalog (Internal Linking)

**Each tenant has their own site catalog:**

```
Tenant A (GetEducated)                 Tenant B (PCC)
┌─────────────────────────┐           ┌─────────────────────────┐
│ tenant_site_catalog     │           │ tenant_site_catalog     │
├─────────────────────────┤           ├─────────────────────────┤
│ tenant_id: geteducated  │           │ tenant_id: pcc          │
│ url: /best-online-mba   │           │ url: /luau-experience   │
│ url: /nursing-programs  │           │ url: /polynesian-culture│
│ url: /education-degrees │           │ url: /visitor-guide     │
│ ... 1000+ articles      │           │ ... 200+ articles       │
└─────────────────────────┘           └─────────────────────────┘
         │                                      │
         │ InternalLinkSuggester                │
         │ ONLY sees their catalog              │
         ▼                                      ▼
   GetEducated articles                   PCC articles
   link to GetEducated                    link to PCC
   pages ONLY                             pages ONLY
```

**Service Implementation:**
```typescript
// CORRECT: Query tenant's catalog only
async function getSuggestions(articleContent: string) {
  const { data: catalog } = await supabase
    .from('tenant_site_catalog')
    // RLS automatically filters by tenant_id from JWT
    .select('*')
    .eq('is_active', true);

  // Score and return suggestions from tenant's own catalog
  return scoreCatalogEntries(catalog, articleContent);
}
```

### 4.2 Domain Rules (Link Compliance)

**Each tenant defines their own competitors:**

```
Tenant A (GetEducated)                 Tenant B (PCC)
┌─────────────────────────┐           ┌─────────────────────────┐
│ tenant_domain_rules     │           │ tenant_domain_rules     │
├─────────────────────────┤           ├─────────────────────────┤
│ BLOCKED:                │           │ BLOCKED:                │
│ - usnews.com            │           │ - tripadvisor.com       │
│ - niche.com             │           │ - yelp.com              │
│ - bestcolleges.com      │           │ - viator.com            │
│ - ... (17 domains)      │           │ - ... (competitors)     │
│                         │           │                         │
│ ALLOWED:                │           │ ALLOWED:                │
│ - bls.gov               │           │ - hawaii.gov            │
│ - ed.gov                │           │ - gohawaii.com          │
│ - chea.org              │           │ - nps.gov               │
└─────────────────────────┘           └─────────────────────────┘
```

**Service Implementation:**
```typescript
// CORRECT: Query tenant's rules, NOT hardcoded
async function getDomainRules() {
  const { data: rules } = await supabase
    .from('tenant_domain_rules')
    // RLS automatically filters by tenant_id from JWT
    .select('*');

  return {
    blocked: rules.filter(r => r.rule_type === 'blocked'),
    allowed: rules.filter(r => r.rule_type === 'allowed')
  };
}

// WRONG: Hardcoded domains (DON'T DO THIS)
const BLOCKED_DOMAINS = ['usnews.com', ...];  // ❌ NOT tenant-aware
```

### 4.3 Categories & Tags

**Each tenant has their own taxonomy:**

```
Tenant A (GetEducated)                 Tenant B (PCC)
┌─────────────────────────┐           ┌─────────────────────────┐
│ categories              │           │ categories              │
├─────────────────────────┤           ├─────────────────────────┤
│ - Rankings              │           │ - Shows                 │
│ - Degree Guides         │           │ - Experiences           │
│ - Career Guides         │           │ - Culture               │
│ - Financial Aid         │           │ - Dining                │
│ - Online Learning       │           │ - Events                │
└─────────────────────────┘           └─────────────────────────┘
```

### 4.4 Contributors

**Each tenant has their own AI personas:**

```
Tenant A (GetEducated)                 Tenant B (PCC)
┌─────────────────────────┐           ┌─────────────────────────┐
│ contributors            │           │ contributors            │
├─────────────────────────┤           ├─────────────────────────┤
│ - Tony Huffman          │           │ - Keoni Makua           │
│   Expert: MBA, Business │           │   Expert: Hawaiian hist │
│   Tone: Professional    │           │   Tone: Warm, cultural  │
│                         │           │                         │
│ - Sarah Chen            │           │ - Dr. Lahela            │
│   Expert: Nursing       │           │   Expert: Polynesian art│
│   Tone: Caring          │           │   Tone: Academic        │
└─────────────────────────┘           └─────────────────────────┘
```

### 4.5 Monetization (Optional per Tenant)

**Each tenant can configure or disable monetization:**

```
Tenant A (GetEducated)                 Tenant B (PCC)
┌─────────────────────────┐           ┌─────────────────────────┐
│ tenant_monetization_    │           │ tenant_monetization_    │
│ categories              │           │ categories              │
├─────────────────────────┤           ├─────────────────────────┤
│ - MBA Programs          │           │ (EMPTY - not using      │
│ - Nursing Programs      │           │  monetization)          │
│ - Education Degrees     │           │                         │
│ - ... 155 categories    │           │                         │
│                         │           │                         │
│ Shortcodes:             │           │                         │
│ [degree_table ...]      │           │                         │
│ [degree_offer ...]      │           │                         │
└─────────────────────────┘           └─────────────────────────┘
```

---

## 5. Service Implementation Guidelines

### 5.1 CORRECT: Use Database Queries

```typescript
// ✅ CORRECT: Query tenant-specific data
class LinkComplianceService {
  async getBlockedDomains(): Promise<string[]> {
    const { data } = await this.supabase
      .from('tenant_domain_rules')
      .select('domain')
      .eq('rule_type', 'blocked');

    return data?.map(r => r.domain) || [];
  }

  async getAllowedDomains(): Promise<string[]> {
    const { data } = await this.supabase
      .from('tenant_domain_rules')
      .select('domain')
      .eq('rule_type', 'allowed');

    return data?.map(r => r.domain) || [];
  }
}
```

### 5.2 WRONG: Hardcoded Values

```typescript
// ❌ WRONG: Hardcoded, not tenant-aware
const BLOCKED_DOMAINS = [
  'usnews.com',
  'niche.com',
  'bestcolleges.com'
];

// This would apply GetEducated rules to ALL tenants!
```

### 5.3 Edge Function Pattern

```typescript
// ✅ CORRECT: Extract tenant context, use for all queries
export async function handler(req: Request) {
  const context = await getTenantContext(req);

  if (!context.tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // All queries automatically filtered by RLS
  const { data: articles } = await context.userClient
    .from('articles')
    .select('*');

  // Explicit tenant filter for extra safety
  const { data: rules } = await context.userClient
    .from('tenant_domain_rules')
    .select('*')
    .eq('tenant_id', context.tenantId);  // Belt AND suspenders

  // ...
}
```

---

## 6. Testing Multi-Tenant Isolation

### 6.1 Test Cases Required

```typescript
describe('Multi-Tenant Isolation', () => {
  it('Tenant A cannot see Tenant B articles', async () => {
    // Login as Tenant A user
    // Query articles
    // Assert: Only Tenant A articles returned
  });

  it('Tenant A cannot see Tenant B site catalog', async () => {
    // Login as Tenant A user
    // Query tenant_site_catalog
    // Assert: Only Tenant A catalog entries returned
  });

  it('Tenant A cannot see Tenant B domain rules', async () => {
    // Login as Tenant A user
    // Query tenant_domain_rules
    // Assert: Only Tenant A rules returned
  });

  it('Article-category junction respects tenant isolation', async () => {
    // Login as Tenant A user
    // Query article_categories
    // Assert: Only Tenant A junctions returned
  });

  it('Internal link suggestions only from same tenant', async () => {
    // Login as Tenant A user
    // Call InternalLinkSuggester
    // Assert: All suggestions are Tenant A URLs
  });

  it('Link compliance uses tenant-specific rules', async () => {
    // Login as Tenant A user
    // Call LinkComplianceService with URL blocked by Tenant A
    // Assert: URL is blocked
    // Login as Tenant B user
    // Call LinkComplianceService with same URL
    // Assert: URL is NOT blocked (different rules)
  });
});
```

---

## 7. Deployment Checklist

### Per-Tenant Deployment

Each tenant can be deployed as a separate Netlify site:

```yaml
# netlify.toml for GetEducated
[build]
  base = "content-engine"
  command = "npx nx build geteducated --configuration=production"
  publish = "dist/apps/geteducated"

[build.environment]
  VITE_TENANT_ID = "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d"
  VITE_APP_NAME = "GetEducated"

# netlify.toml for PCC (separate site)
[build]
  base = "content-engine"
  command = "npx nx build pcc --configuration=production"
  publish = "dist/apps/pcc"

[build.environment]
  VITE_TENANT_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"
  VITE_APP_NAME = "Polynesian Cultural Center"
```

### Shared Supabase Project

All tenants share the same Supabase project:
- Same database (isolated by RLS)
- Same Edge Functions (tenant context from JWT)
- Same storage bucket (isolated by folder path)

---

## 8. Summary

### What's Correctly Isolated ✅

1. **All data tables** have tenant_id + RLS
2. **JWT claims** inject tenant_id automatically
3. **Edge functions** extract and use tenant context
4. **Storage** uses tenant folder paths
5. **API keys** encrypted per tenant
6. **WordPress connections** per tenant

### What Needs Fixing ⚠️

1. **Junction tables** need migration (CRITICAL)
2. **Service implementations** must query tenant rules, not hardcode

### What Needs Documentation 📝

1. **Tenant onboarding flow** (added in this document)
2. **Service implementation guidelines** (added in this document)
3. **Testing requirements** (added in this document)

---

*This document ensures complete tenant isolation. Run migration 016 before production deployment.*
