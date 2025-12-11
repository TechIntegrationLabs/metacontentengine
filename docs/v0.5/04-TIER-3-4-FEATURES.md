# Meta Content Engine v0.5 - Tier 3 & 4 Feature Specifications

> **Document Version:** 1.0
> **Created:** December 10, 2024
> **Priority:** MEDIUM to LOW

---

## Tier 3 - Medium Priority (Important but Can Ship Without)

### Feature 11: Quality Assurance Integration

**Current State:** Library complete (`libs/core/quality/`), not wired to UI

#### Requirements

Wire the existing quality scoring library to:

1. **ContentForge Pipeline** - Run quality check after humanization
2. **ArticleEditor** - Show detailed quality breakdown in sidebar
3. **Auto-fix Loop** - Allow up to 3 Claude passes to fix issues

```typescript
// Integration points
interface QualityIntegration {
  // Run quality check and update article
  runQualityCheck(articleId: string): Promise<QualityResult>;

  // Auto-fix issues via Claude
  autoFixIssues(
    articleId: string,
    issues: QualityIssue[],
    maxPasses?: number
  ): Promise<{ fixed: string[]; remaining: string[] }>;

  // Block publishing if below threshold
  checkPublishEligibility(articleId: string): Promise<{
    eligible: boolean;
    blockingIssues: string[];
  }>;
}
```

#### UI Component: QualityScoreBreakdown.tsx
```
┌─────────────────────────────────────────────┐
│  📊 Quality Analysis                        │
├─────────────────────────────────────────────┤
│                                             │
│  Overall: 82/100 ████████░░                │
│                                             │
│  Breakdown:                                 │
│  ├─ Readability: 85 ████████░░             │
│  │  Flesch-Kincaid: Grade 10              │
│  │  Gunning Fog: 12.3                     │
│  │                                         │
│  ├─ SEO: 78 ███████░░░                    │
│  │  Keyword density: 1.8% ✓               │
│  │  H2/H3 structure: Good                 │
│  │  Meta description: Missing ⚠️          │
│  │                                         │
│  ├─ Humanness: 88 █████████░              │
│  │  Sentence variety: Good                │
│  │  Contractions: 3.2% ✓                  │
│  │                                         │
│  └─ Structure: 80 ████████░░              │
│     Intro: Present ✓                       │
│     Conclusion: Present ✓                  │
│     Lists: 2 found ✓                       │
│                                             │
│  Issues (3):                                │
│  • Missing meta description                │
│  • Intro could be stronger                 │
│  • Consider adding FAQ section             │
│                                             │
│  [Auto-Fix Issues]                         │
│                                             │
└─────────────────────────────────────────────┘
```

#### Files to Create/Modify

| File | Action |
|------|--------|
| `components/QualityScoreBreakdown.tsx` | CREATE |
| `pages/ContentForge.tsx` | MODIFY - Add quality stage |
| `pages/ArticleEditor.tsx` | MODIFY - Add quality sidebar |

---

### Feature 12: Webhook Publishing UI

**Current State:** Service exists but uses direct WordPress API. Simplifying to webhook-only approach.

#### Design Decision: Webhook-Only Publishing

Instead of direct WordPress REST API integration, we use a **webhook-based approach**:
- Each tenant configures a webhook URL in Settings
- Publishing sends article data as JSON payload to the webhook
- The receiving system (WordPress plugin, Zapier, Make, custom endpoint) handles the actual posting
- This provides maximum flexibility and reduces complexity

#### Requirements

1. **Settings Page** - Webhook URL configuration per tenant
2. **ArticleEditor** - Publish button with validation
3. **Webhook Service** - POST article data to configured endpoint

```typescript
interface WebhookPublishingService {
  // Configuration
  setWebhookUrl(url: string): Promise<void>;
  testWebhook(): Promise<{ success: boolean; error?: string }>;

  // Publishing
  publishArticle(articleId: string): Promise<{
    success: boolean;
    webhookResponse?: unknown;
    error?: string;
  }>;

  // Bulk publishing
  publishMultiple(articleIds: string[]): Promise<PublishResult[]>;
}

interface WebhookPayload {
  // Article content
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Metadata
  status: 'publish' | 'draft' | 'scheduled';
  scheduledFor?: string; // ISO date
  category?: string;
  tags?: string[];
  author?: string;

  // Quality metrics (for receiving system to use)
  qualityScore?: number;
  riskLevel?: string;

  // Tracking
  articleId: string;
  tenantId: string;
  publishedAt: string;
}
```

#### UI Component: WebhookSettings.tsx
```
┌─────────────────────────────────────────────────────────────┐
│  Publishing Webhook                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Webhook URL:                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ https://hooks.example.com/publish-article           │    │
│  └─────────────────────────────────────────────────────┘    │
│  Articles will be POSTed to this URL as JSON.               │
│                                                              │
│  Authentication (optional):                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Bearer: ••••••••••••••••                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Status: ✅ Webhook responding                              │
│  Last publish: 2 hours ago                                  │
│                                                              │
│  [Test Webhook]  [View Payload Schema]                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### UI Component: PublishButton.tsx
```
┌─────────────────────────────────────────────┐
│  [Publish ▼]                                │
├─────────────────────────────────────────────┤
│  ○ Publish Now                              │
│  ○ Schedule for Later                       │
│  ○ Save as Draft                            │
├─────────────────────────────────────────────┤
│  Pre-publish Checklist:                     │
│  ✅ Quality score above 75%                │
│  ✅ Risk level: LOW                        │
│  ✅ No compliance violations               │
│  ✅ Webhook configured                     │
│  ⚠️ No featured image set                 │
├─────────────────────────────────────────────┤
│  [Cancel]              [Publish]           │
└─────────────────────────────────────────────┘
```

#### Webhook Integration Examples

**WordPress (via plugin or functions.php):**
```php
// Receive webhook and create post
add_action('rest_api_init', function() {
  register_rest_route('content-engine/v1', '/publish', [
    'methods' => 'POST',
    'callback' => 'handle_content_engine_publish',
    'permission_callback' => 'verify_webhook_token'
  ]);
});
```

**Zapier/Make:** Configure webhook trigger, map fields to WordPress action

**Custom Endpoint:** Any system that can receive JSON POST

---

### Feature 13: Contributor Assignment Scoring

**Current State:** Basic dropdown selection, no scoring

#### Requirements

Implement automatic contributor assignment based on:
- Expertise match (50 points)
- Content type match (30 points)
- Keyword match (20 points)

```typescript
interface ContributorScoring {
  // Calculate scores for all contributors
  scoreContributors(
    article: { category: string; contentType: string; keywords: string[] }
  ): Promise<ScoredContributor[]>;

  // Get best match
  getBestContributor(
    article: { category: string; contentType: string; keywords: string[] }
  ): Promise<{ contributor: Contributor; score: number; reasoning: string }>;

  // Auto-assign during generation
  autoAssign(articleId: string): Promise<void>;
}

interface ScoredContributor {
  contributor: Contributor;
  totalScore: number;
  breakdown: {
    expertiseScore: number;   // 0-50
    contentTypeScore: number; // 0-30
    keywordScore: number;     // 0-20
  };
  reasoning: string;
}
```

#### UI Enhancement
In ContentForge contributor selection:
```
┌─────────────────────────────────────────────┐
│  Contributor Selection                      │
├─────────────────────────────────────────────┤
│  ● Tony Huffman (Score: 92/100)            │
│    Expert in: MBA, Business | 📊 Rankings  │
│    Match: Expertise (50), Type (30), KW(12)│
│                                             │
│  ○ Kayleigh Gilbert (Score: 67/100)        │
│    Expert in: Nursing, Healthcare          │
│                                             │
│  ○ Sara Chen (Score: 45/100)               │
│    Expert in: Education, Teaching          │
│                                             │
│  [Auto-Select Best Match]                  │
└─────────────────────────────────────────────┘
```

---

### Feature 14: Settings Persistence

**Current State:** API Keys save, other settings don't

#### Requirements

Wire save handlers for all settings sections:

```typescript
interface SettingsSections {
  general: {
    workspaceName: string;
    language: string;
    timezone: string;
    dateFormat: string;
  };
  brand: {
    brandName: string;
    industry: string;
    targetAudience: string;
    voiceTone: number; // 1-10
    brandDescription: string;
  };
  generation: {
    defaultWordCount: number;
    qualityThreshold: number;
    humanizationMode: string;
    internalLinkTarget: number;
    externalLinkTarget: number;
  };
  automation: {
    autoPublishEnabled: boolean;
    autoPublishDays: number;
    requireReview: boolean;
    maxConcurrentGeneration: number;
  };
  notifications: {
    emailOnPublish: boolean;
    emailOnFailure: boolean;
    slackWebhook: string;
  };
}
```

**Implementation:**
- Use `tenant_settings` table (key-value JSONB)
- Create `useSettings` hook with optimistic updates
- Add save confirmation toast

---

### Feature 15: Analytics Dashboard (Real Data)

**Current State:** UI complete, all data hardcoded

#### Requirements

Replace mock data with real Supabase queries:

```typescript
interface AnalyticsQueries {
  // Article metrics
  getArticlesPublishedByWeek(weeks: number): Promise<WeeklyCount[]>;
  getAverageQualityScore(): Promise<number>;
  getRiskDistribution(): Promise<RiskDistribution>;

  // Contributor metrics
  getContributorPerformance(): Promise<ContributorStats[]>;
  getTopContributors(limit: number): Promise<ContributorStats[]>;

  // Content metrics
  getCategoryBreakdown(): Promise<CategoryStats[]>;
  getStatusDistribution(): Promise<StatusCount[]>;

  // AI usage
  getTokenUsageByProvider(): Promise<ProviderUsage[]>;
  getGenerationCosts(period: 'day' | 'week' | 'month'): Promise<CostBreakdown>;
}
```

**Data Sources:**
- `articles` table - counts, status, quality scores
- `ai_usage` table - token counts, costs
- `contributors` table - performance stats
- `pipeline_runs` table - generation metrics

---

## Tier 4 - Lower Priority (Polish)

### Feature 16: AI Generation Pipeline (Async)

**Current State:** Synchronous, blocks while generating

#### Requirements

Convert to async with:
- Background processing
- Progress streaming
- Error recovery

```typescript
// Current (blocking)
const article = await generateArticle(request);

// Target (async)
const pipelineId = await startGeneration(request);
// ... user continues working
// Progress updates via Supabase realtime subscription
```

**Implementation:**
- Use generation queue (Feature 9)
- Supabase realtime for progress updates
- Webhook notifications on completion

---

### Feature 17: Missing Editor Sidebar Components

Create these sidebar components for ArticleEditor:

1. **BLSCitationHelper.tsx** - Search BLS data for citations
2. **ArticleNavigationGenerator.tsx** - Generate TOC from headings
3. **SchemaGenerator.tsx** - Create JSON-LD schema markup
4. **AITrainingPanel.tsx** - Mark revisions for training data

```
┌─────────────────────────────────────────────┐
│  📋 Table of Contents                       │
├─────────────────────────────────────────────┤
│  Generated from H2/H3 headings:             │
│                                             │
│  1. Introduction                            │
│  2. What is an Online MBA?                  │
│     2.1. Program Structure                  │
│     2.2. Accreditation                      │
│  3. Top Programs                            │
│  4. Cost Comparison                         │
│  5. Conclusion                              │
│                                             │
│  [Copy HTML]  [Insert into Content]        │
└─────────────────────────────────────────────┘
```

---

### Feature 18: Revision Tracking & AI Training

**Current State:** Not implemented

#### Requirements

Track all edits for:
- History/rollback
- RLHF training data export

```typescript
interface ArticleRevision {
  id: string;
  articleId: string;
  revisionNumber: number;
  contentBefore: string;
  contentAfter: string;
  changeType: 'ai_generation' | 'human_edit' | 'auto_fix';
  changeReason?: string;
  changedBy: string;
  includeInTraining: boolean;
  createdAt: Date;
}

interface RevisionService {
  createRevision(revision: CreateRevisionInput): Promise<ArticleRevision>;
  getRevisions(articleId: string): Promise<ArticleRevision[]>;
  rollback(articleId: string, revisionId: string): Promise<void>;
  exportTrainingData(filters?: TrainingDataFilters): Promise<TrainingData[]>;
}
```

#### Database Migration

```sql
-- 013_add_revision_tracking.sql

CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  content_before TEXT,
  content_after TEXT,
  change_type VARCHAR(50),
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  include_in_training BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revisions_article ON article_revisions(article_id, revision_number);
```

---

### Feature 19: Comment System (Structured Feedback)

**Current State:** Not implemented

#### Requirements

Allow editors to leave comments on specific text:

```typescript
interface ArticleComment {
  id: string;
  articleId: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  commentText: string;
  category: 'accuracy' | 'tone' | 'seo' | 'structure' | 'grammar' | 'general';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  status: 'pending' | 'addressed' | 'dismissed';
  createdBy: string;
  resolvedBy?: string;
  createdAt: Date;
  resolvedAt?: Date;
}
```

#### UI Enhancement
Highlight commented text, show comment popover on hover.

---

### Feature 20: Pre-Publish Validation

**Current State:** Partial checks exist

#### Requirements

Comprehensive validation before publishing:

```typescript
interface PrePublishValidation {
  runValidation(articleId: string): Promise<ValidationResult>;
}

interface ValidationResult {
  canPublish: boolean;
  checks: {
    name: string;
    passed: boolean;
    severity: 'blocking' | 'warning';
    message: string;
  }[];
}

// Checks to run:
const VALIDATION_CHECKS = [
  'linkCompliance',        // No blocked domains
  'qualityScore',          // Above threshold
  'riskLevel',             // Below threshold
  'metaDescription',       // Present
  'featuredImage',         // Set
  'authorAttribution',     // Contributor assigned
  'internalLinks',         // Minimum count met
  'bannedPhrases',         // None found
  'wordCount',             // Above minimum
];
```

---

### Feature 21: Site Catalog Management

**Current State:** Schema exists, no UI

#### Requirements

Full CRUD for `tenant_site_catalog`:

```typescript
interface SiteCatalogService {
  // CRUD
  getEntries(filters: CatalogFilters): Promise<PaginatedResult<CatalogEntry>>;
  createEntry(entry: CreateCatalogEntry): Promise<CatalogEntry>;
  updateEntry(id: string, updates: Partial<CatalogEntry>): Promise<CatalogEntry>;
  deleteEntry(id: string): Promise<void>;

  // Import
  importFromSitemap(sitemapUrl: string): Promise<ImportResult>;
  importFromCSV(csvData: string): Promise<ImportResult>;
  importFromRSS(rssUrl: string): Promise<ImportResult>;

  // Sync
  syncEntry(id: string): Promise<void>;  // Re-fetch content
  bulkSync(ids: string[]): Promise<SyncResult>;
}
```

See Feature 2 (Internal Linking) for UI mockup.

---

### Feature 22: Help/Tutorial System

**Current State:** Not implemented

#### Requirements

Contextual help for each page:

```typescript
interface HelpContent {
  pageId: string;
  title: string;
  sections: {
    heading: string;
    content: string;  // Markdown
    videoUrl?: string;
  }[];
  relatedArticles: string[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  'content-forge': {
    title: 'Content Forge Guide',
    sections: [
      { heading: 'Getting Started', content: '...' },
      { heading: 'Choosing a Contributor', content: '...' },
      { heading: 'Understanding Pipeline Stages', content: '...' },
    ],
  },
  'articles': {
    title: 'Managing Articles',
    sections: [...],
  },
  // ...
};
```

#### Components

**FloatingHelpButton.tsx** - Fixed position "?" button
**HelpModal.tsx** - Slide-out panel with page-specific content

---

## Implementation Summary

### Tier 3 Priority Order
1. Quality Integration (wire existing library)
2. Settings Persistence (foundation for other features)
3. WordPress Publishing UI (key workflow completion)
4. Analytics Real Data (visibility into performance)
5. Contributor Scoring (better content quality)

### Tier 4 Priority Order
1. Pre-Publish Validation (quality gate)
2. Site Catalog Management (supports internal linking)
3. Async Pipeline (better UX)
4. Editor Components (power user features)
5. Revision Tracking (audit trail)
6. Comment System (collaboration)
7. Help System (onboarding)

---

## Estimated Effort by Feature

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| 11. Quality Integration | Low | None |
| 12. WordPress UI | Medium | None |
| 13. Contributor Scoring | Medium | None |
| 14. Settings Persistence | Medium | None |
| 15. Analytics Real Data | Medium | None |
| 16. Async Pipeline | Medium | Generation Queue |
| 17. Editor Components | High | Various |
| 18. Revision Tracking | Medium | None |
| 19. Comment System | Medium | None |
| 20. Pre-Publish Validation | Medium | Link Compliance, Risk |
| 21. Site Catalog UI | Medium | Internal Linking |
| 22. Help System | Low | None |

---

*This completes the feature specifications. See `05-DATABASE-MIGRATIONS.md` for all required schema changes.*
