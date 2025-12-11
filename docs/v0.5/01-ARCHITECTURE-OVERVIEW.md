# Meta Content Engine v0.5 - Architecture Overview

> **Document Version:** 1.0
> **Created:** December 10, 2024
> **Last Updated:** December 10, 2024

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  React 19 + Vite 7 SPA                                                      │
│  ├── apps/geteducated/          (Tenant-specific client app)                │
│  ├── libs/shared/ui/            (Reusable UI components)                    │
│  ├── libs/shared/hooks/         (Shared React hooks)                        │
│  └── libs/shared/types/         (TypeScript definitions)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE LIBRARIES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  libs/core/generation/                                                       │
│  ├── providers/                 (AI provider adapters)                       │
│  │   ├── grok.ts               (xAI Grok - primary drafting)                │
│  │   ├── claude.ts             (Anthropic Claude - refinement)              │
│  │   └── stealthgpt.ts         (StealthGPT - humanization)                  │
│  ├── generation.ts             (Pipeline orchestration)                      │
│  ├── voice-analysis.ts         (Contributor voice matching)                  │
│  └── types.ts                  (Generation interfaces)                       │
│                                                                              │
│  libs/core/quality/                                                          │
│  ├── quality.ts                (Comprehensive quality scoring)               │
│  └── (planned) risk-assessment.ts                                            │
│                                                                              │
│  libs/core/publishing/                                                       │
│  ├── publishing.ts             (WordPress REST API client)                   │
│  └── types.ts                  (Publishing interfaces)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE EDGE FUNCTIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  supabase/functions/                                                         │
│  ├── generate-article/         (Full pipeline execution)                     │
│  ├── analyze-brand/            (Brand DNA extraction)                        │
│  ├── create-tenant/            (Tenant onboarding)                          │
│  └── get-api-key/              (Secure key retrieval)                       │
│                                                                              │
│  (Planned Edge Functions)                                                    │
│  ├── sync-site-catalog/        (Import existing articles)                   │
│  ├── publish-scheduled/        (Auto-publish scheduler)                     │
│  ├── process-queue/            (Generation queue worker)                    │
│  └── keyword-research/         (DataForSEO integration)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE DATABASE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL with Row-Level Security (RLS)                                    │
│                                                                              │
│  Tenant Infrastructure:         Content Tables:                              │
│  ├── tenants                   ├── articles                                 │
│  ├── tenant_users              ├── contributors                             │
│  ├── tenant_settings           ├── categories                               │
│  ├── tenant_api_keys           ├── tags                                     │
│  └── app_secrets               ├── content_ideas                            │
│                                ├── content_clusters                         │
│  Internal Linking:             └── media                                    │
│  ├── tenant_site_catalog                                                    │
│  └── article_internal_links    Pipeline & Analytics:                        │
│                                ├── pipeline_runs                            │
│  Compliance:                   ├── ai_usage                                 │
│  ├── tenant_domain_rules       ├── wp_connections                           │
│  ├── tenant_banned_phrases     ├── webhooks                                 │
│  └── tenant_writing_samples    └── activity_log                             │
│                                                                              │
│  Monetization:                                                               │
│  ├── tenant_monetization_categories                                          │
│  └── tenant_content_levels                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  AI Providers:                  Publishing:                                  │
│  ├── xAI Grok API              ├── WordPress REST API                       │
│  ├── Anthropic Claude API      └── (Multiple WordPress sites)               │
│  └── StealthGPT API                                                          │
│                                 Analytics (Planned):                         │
│  Research (Planned):           ├── Google Analytics                          │
│  ├── DataForSEO API            └── Custom event tracking                     │
│  └── BLS Statistics API                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Content Generation Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ ContentForge│────▶│ generate-    │────▶│ Grok Provider   │
│ UI          │     │ article      │     │ (Draft Content) │
└─────────────┘     │ Edge Function│     └────────┬────────┘
                    └──────┬───────┘              │
                           │                      ▼
                           │            ┌─────────────────┐
                           │            │ Claude Provider │
                           │            │ (Refinement)    │
                           │            └────────┬────────┘
                           │                     │
                           │                     ▼
                           │            ┌─────────────────┐
                           │            │ StealthGPT      │
                           │            │ (Humanization)  │
                           │            └────────┬────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────────────────────┐
                    │        Quality Scoring        │
                    │ (Readability, SEO, Humanness) │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │      Internal Link Injection  │
                    │    (Site Catalog Matching)    │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │      Risk Assessment          │
                    │ (AI Detection, Compliance)    │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │     articles table UPDATE     │
                    │  (Status: 'review' or 'ready')│
                    └──────────────────────────────┘
```

### 2. Multi-Tenant Data Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Authentication                       │
│  Supabase Auth → JWT with app_metadata.tenant_id                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Access Token Hook                      │
│  custom_access_token_hook() injects:                            │
│  - tenant_id from tenant_users table                            │
│  - user_role (owner, admin, editor, viewer)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Row-Level Security (RLS)                      │
│                                                                  │
│  Every query automatically filtered by:                          │
│  WHERE tenant_id = public.get_tenant_id()                       │
│                                                                  │
│  get_tenant_id() extracts from:                                 │
│  auth.jwt() -> 'app_metadata' -> 'tenant_id'                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Workflow State Machine

```
                    ┌─────────┐
                    │  idea   │
                    └────┬────┘
                         │ Start Generation
                         ▼
                    ┌─────────┐
                    │ outline │
                    └────┬────┘
                         │ Outline Approved
                         ▼
                    ┌──────────┐
                    │ drafting │◄──────────────┐
                    └────┬─────┘               │
                         │ Draft Complete      │ Revision Needed
                         ▼                     │
                    ┌────────────┐             │
                    │ humanizing │─────────────┘
                    └─────┬──────┘
                          │ Humanization Complete
                          ▼
                    ┌──────────┐
                    │  review  │◄──────────────┐
                    └────┬─────┘               │
                         │ QA Passed           │ QA Failed
                         ▼                     │
                    ┌─────────┐                │
                    │  ready  │────────────────┘
                    └────┬────┘
                         │ Publish Triggered
                         ├──────────────┐
                         ▼              ▼
                    ┌───────────┐  ┌───────────┐
                    │ scheduled │  │ published │
                    └─────┬─────┘  └───────────┘
                          │ Publish Date Reached
                          ▼
                    ┌───────────┐
                    │ published │
                    └───────────┘
```

---

## Component Architecture

### React Application Structure

```
apps/geteducated/src/
├── app/
│   ├── app.tsx                    # Root component with routing
│   ├── pages/
│   │   ├── Dashboard.tsx          # Home dashboard
│   │   ├── Articles.tsx           # Article list (+ Kanban view)
│   │   ├── ArticleEditor.tsx      # Full article editor
│   │   ├── ContentForge.tsx       # Generation pipeline UI
│   │   ├── Contributors.tsx       # Contributor management
│   │   ├── Analytics.tsx          # Analytics dashboard
│   │   ├── Settings.tsx           # Configuration
│   │   ├── MagicSetup.tsx         # Onboarding wizard
│   │   │
│   │   │  (PLANNED PAGES)
│   │   ├── ContentIdeas.tsx       # Idea management
│   │   ├── Keywords.tsx           # Keyword research
│   │   ├── SiteCatalog.tsx        # Internal link catalog
│   │   └── Automation.tsx         # Queue management
│   │
│   └── components/
│       ├── AppLayout.tsx          # Main layout wrapper
│       ├── Sidebar.tsx            # Navigation sidebar
│       │
│       │  (EXISTING)
│       ├── ArticlesList.tsx       # Table view of articles
│       ├── PipelineVisualizer.tsx # Generation progress
│       │
│       │  (PLANNED COMPONENTS)
│       ├── KanbanBoard.tsx        # Drag-drop workflow board
│       ├── ArticleCard.tsx        # Card for Kanban
│       ├── InternalLinkSuggester.tsx
│       ├── LinkComplianceChecker.tsx
│       ├── RiskLevelDisplay.tsx
│       ├── HumanizationPanel.tsx
│       ├── ShortcodeInspector.tsx
│       ├── MonetizationPreview.tsx
│       ├── QualityScoreBreakdown.tsx
│       └── ...
│
├── lib/
│   └── supabase.ts                # Supabase client
│
└── styles.css                     # Global styles (Tailwind)
```

### Library Structure

```
libs/
├── shared/
│   ├── config/                    # @content-engine/config
│   │   └── src/lib/
│   │       ├── env.ts            # Environment variable access
│   │       └── validation.ts     # Env validation
│   │
│   ├── ui/                        # @content-engine/ui
│   │   └── src/lib/
│   │       ├── Button.tsx
│   │       ├── GlassCard.tsx
│   │       ├── Input.tsx
│   │       └── ...               # 20+ components
│   │
│   ├── types/                     # @content-engine/types
│   │   └── src/lib/
│   │       ├── tenant.ts
│   │       ├── content.ts
│   │       ├── contributor.ts
│   │       └── ...
│   │
│   └── hooks/                     # @content-engine/hooks
│       └── src/lib/
│           ├── useApiKeys.ts
│           ├── useTenant.ts
│           └── ...
│
└── core/
    ├── generation/                # @content-engine/generation
    │   └── src/lib/
    │       ├── generation.ts     # Pipeline orchestrator
    │       ├── types.ts
    │       ├── voice-analysis.ts
    │       ├── providers/
    │       │   ├── grok.ts
    │       │   ├── claude.ts
    │       │   └── stealthgpt.ts
    │       │
    │       │  (PLANNED)
    │       ├── internal-linking.ts
    │       ├── link-compliance.ts
    │       └── monetization.ts
    │
    ├── quality/                   # @content-engine/quality
    │   └── src/lib/
    │       ├── quality.ts        # Comprehensive scoring
    │       │
    │       │  (PLANNED)
    │       └── risk-assessment.ts
    │
    └── publishing/                # @content-engine/publishing
        └── src/lib/
            ├── publishing.ts     # WordPress client
            └── types.ts
```

---

## Database Schema Relationships

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   tenants   │──────<│   tenant_users   │>──────│    users    │
│             │       │                  │       │  (auth.users)│
│  id (PK)    │       │ tenant_id (FK)   │       └─────────────┘
│  name       │       │ user_id (FK)     │
│  slug       │       │ role             │
│  branding   │       └──────────────────┘
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TENANT-SCOPED TABLES                         │
│  (All have tenant_id FK + RLS policy)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐         │
│  │  articles   │───<│ article_tags │>───│    tags    │         │
│  │             │    └──────────────┘    └────────────┘         │
│  │ id          │                                                │
│  │ tenant_id   │    ┌──────────────────┐    ┌────────────┐     │
│  │ title       │───<│article_categories│>───│ categories │     │
│  │ content     │    └──────────────────┘    └────────────┘     │
│  │ status      │                                                │
│  │ contributor │────────────────────────────┐                   │
│  │ _id         │                            │                   │
│  └──────┬──────┘                            ▼                   │
│         │                          ┌──────────────┐             │
│         │                          │ contributors │             │
│         │                          │              │             │
│         │                          │ voice_profile│             │
│         │                          │ expertise    │             │
│         │                          └──────────────┘             │
│         │                                                       │
│         │ 1:N                                                   │
│         ▼                                                       │
│  ┌──────────────────────┐                                       │
│  │ article_internal_    │                                       │
│  │ links                │                                       │
│  │                      │───────────┐                           │
│  │ source_article_id    │           │                           │
│  │ target_catalog_id    │           ▼                           │
│  │ anchor_text          │    ┌─────────────────┐               │
│  │ relevance_score      │    │tenant_site_     │               │
│  └──────────────────────┘    │catalog          │               │
│                              │                 │               │
│                              │ url, title      │               │
│                              │ topics[]        │               │
│                              │ keywords[]      │               │
│                              │ times_linked_to │               │
│                              └─────────────────┘               │
│                                                                 │
│  ┌─────────────────┐    ┌───────────────────┐                  │
│  │ content_ideas   │───>│ content_clusters  │                  │
│  │                 │    │                   │                  │
│  │ primary_keyword │    │ core_keywords[]   │                  │
│  │ status          │    │ pillar_article_id │                  │
│  └─────────────────┘    └───────────────────┘                  │
│                                                                 │
│  ┌─────────────────────┐    ┌────────────────────────┐         │
│  │ tenant_domain_rules │    │ tenant_banned_phrases  │         │
│  │                     │    │                        │         │
│  │ domain              │    │ phrase                 │         │
│  │ rule_type           │    │ phrase_type            │         │
│  │ (blocked/allowed)   │    │ severity               │         │
│  └─────────────────────┘    └────────────────────────┘         │
│                                                                 │
│  ┌───────────────────────────┐    ┌─────────────────┐          │
│  │tenant_monetization_       │    │ tenant_content_ │          │
│  │categories                 │    │ levels          │          │
│  │                           │    │                 │          │
│  │ shortcode_template        │    │ name            │          │
│  │ shortcode_params (JSONB)  │    │ display_order   │          │
│  │ keyword_patterns[]        │    │ external_id     │          │
│  └───────────────────────────┘    └─────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    OPERATIONAL TABLES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌───────────────┐                       │
│  │  pipeline_runs  │───>│   ai_usage    │                       │
│  │                 │    │               │                       │
│  │ article_id      │    │ provider      │                       │
│  │ stage           │    │ input_tokens  │                       │
│  │ progress        │    │ output_tokens │                       │
│  │ error_log       │    │ cost          │                       │
│  └─────────────────┘    └───────────────┘                       │
│                                                                  │
│  ┌─────────────────┐    ┌───────────────┐                       │
│  │  wp_connections │    │  activity_log │                       │
│  │                 │    │               │                       │
│  │ site_url        │    │ action        │                       │
│  │ credentials     │    │ entity_type   │                       │
│  │ cached_cats[]   │    │ entity_id     │                       │
│  └─────────────────┘    │ details       │                       │
│                         └───────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────┐
│  User   │───>│ Supabase    │───>│ Auth Hook    │───>│ Database  │
│ Browser │    │ Auth        │    │ (JWT Claims) │    │ (RLS)     │
└─────────┘    └─────────────┘    └──────────────┘    └───────────┘

1. User signs in via Supabase Auth
2. custom_access_token_hook() runs:
   - Looks up user's tenant_id from tenant_users
   - Looks up user's role (owner/admin/editor/viewer)
   - Injects into JWT app_metadata
3. All database queries filtered by RLS:
   - tenant_id = get_tenant_id() from JWT
   - Role-based permissions per table
```

### API Key Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Key Storage                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Client requests API key via RPC:                            │
│     SELECT get_api_key('grok')                                  │
│                                                                  │
│  2. Edge Function retrieves:                                     │
│     - Encrypted key from tenant_api_keys                        │
│     - Decryption key from app_secrets                           │
│                                                                  │
│  3. Decryption happens server-side only                         │
│     - Keys never exposed to client                              │
│     - AES-256-GCM encryption                                    │
│                                                                  │
│  4. Decrypted key used for AI provider call                     │
│     - Then immediately discarded                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Matrix

| Role | Articles | Contributors | Settings | Analytics | Billing |
|------|----------|--------------|----------|-----------|---------|
| viewer | Read | Read | - | Read | - |
| editor | CRUD | Read | - | Read | - |
| admin | CRUD | CRUD | Read/Write | Read | - |
| owner | CRUD | CRUD | CRUD | CRUD | CRUD |

---

## Performance Considerations

### Caching Strategy

```
┌───────────────────────────────────────────────────────────────┐
│                    Caching Layers                              │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  1. React Query (TanStack Query)                              │
│     - Client-side cache with stale-while-revalidate           │
│     - Optimistic updates for mutations                        │
│     - Cache invalidation on related mutations                 │
│                                                                │
│  2. Supabase Realtime (Future)                                │
│     - Subscribe to article status changes                     │
│     - Live Kanban board updates                               │
│     - Pipeline progress streaming                             │
│                                                                │
│  3. Edge Function Caching (Future)                            │
│     - Cache site catalog for internal linking                 │
│     - Cache domain rules for compliance checking              │
│     - TTL: 5 minutes for frequently accessed data             │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Database Indexing

```sql
-- Critical indexes for performance
CREATE INDEX idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX idx_articles_tenant_created ON articles(tenant_id, created_at DESC);
CREATE INDEX idx_site_catalog_tenant_active ON tenant_site_catalog(tenant_id, is_active);
CREATE INDEX idx_site_catalog_keywords ON tenant_site_catalog USING GIN(keywords);
CREATE INDEX idx_site_catalog_topics ON tenant_site_catalog USING GIN(topics);
CREATE INDEX idx_pipeline_runs_tenant_status ON pipeline_runs(tenant_id, status);
CREATE INDEX idx_content_ideas_tenant_status ON content_ideas(tenant_id, status);
```

---

## Deployment Architecture

### Netlify Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    Netlify Platform                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Per-Tenant Site                                     │        │
│  │                                                      │        │
│  │  Site: geteducated.netlify.app                      │        │
│  │  Build: npx nx build geteducated --prod             │        │
│  │  Env: VITE_TENANT_ID=geteducated-uuid               │        │
│  │                                                      │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │        │
│  │  │ index.html  │  │ assets/*.js │  │ assets/*.css│  │        │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │        │
│  │                                                      │        │
│  │  SPA Routing: /* → /index.html (200)               │        │
│  │  Asset Caching: 1 year, immutable                   │        │
│  │  Security Headers: CSP, XSS, etc.                   │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  (Repeat for each tenant/client)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Supabase Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Project                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PostgreSQL Database                                             │
│  ├── 30+ tables with RLS                                        │
│  ├── 10+ custom functions                                       │
│  └── Automated backups                                          │
│                                                                  │
│  Edge Functions                                                  │
│  ├── generate-article (heavy compute)                           │
│  ├── analyze-brand                                              │
│  ├── create-tenant                                              │
│  └── (planned functions)                                        │
│                                                                  │
│  Storage Buckets                                                 │
│  ├── media (tenant-isolated)                                    │
│  └── exports (tenant-isolated)                                  │
│                                                                  │
│  Auth                                                            │
│  ├── Email/password                                             │
│  ├── Magic links                                                │
│  └── Custom JWT claims hook                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### External API Contracts

#### StealthGPT API
```typescript
// Request
POST https://stealthgpt.ai/api/stealthify
{
  "prompt": "content to humanize",
  "tone": "College",           // HighSchool, College, PhD
  "mode": "high",              // low, medium, high
  "business": false
}

// Response
{
  "result": "humanized content"
}
```

#### DataForSEO API (Planned)
```typescript
// Keyword Data Request
POST https://api.dataforseo.com/v3/keywords_data/google/search_volume/live
{
  "keywords": ["keyword1", "keyword2"],
  "location_code": 2840,  // United States
  "language_code": "en"
}
```

#### WordPress REST API
```typescript
// Create Post
POST {site_url}/wp-json/wp/v2/posts
Authorization: Basic {base64(username:app_password)}
{
  "title": "Article Title",
  "content": "<p>Content...</p>",
  "status": "publish",  // draft, publish, future
  "date": "2024-12-15T10:00:00",  // for scheduled
  "categories": [1, 2],
  "tags": [5, 6],
  "meta": {
    "_yoast_wpseo_title": "SEO Title",
    "_yoast_wpseo_metadesc": "Meta description"
  }
}
```

---

*This architecture document will be updated as the system evolves.*
