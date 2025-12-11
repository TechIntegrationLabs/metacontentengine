# Meta Content Engine v0.5 - Tier 2 Feature Specifications

> **Document Version:** 1.0
> **Created:** December 10, 2024
> **Priority:** HIGH - Major Features

---

## Overview

Tier 2 features are major functionality that significantly enhances the platform but aren't strictly required for basic content generation.

| Feature | Current State | Enables |
|---------|---------------|---------|
| 6. Auto-Publish Scheduling | 20% | Automation workflows |
| 7. Content Ideas Management | 30% | Idea pipeline |
| 8. Keyword Research (DataForSEO) | 15% | SEO-driven content |
| 9. Generation Queue | 10% | Bulk operations |
| 10. Monetization System | 25% | Revenue generation |

---

## Feature 6: Auto-Publish Scheduling

### Current State
- **Database:** `scheduled_at`, `published_at` fields exist
- **Service:** WordPress publishing supports `status: 'future'`
- **UI:** NOT IMPLEMENTED
- **Automation:** NOT IMPLEMENTED

### Requirements

#### 6.1 Auto-Publish Configuration

```typescript
interface AutoPublishConfig {
  enabled: boolean;
  defaultDaysAfterReady: number;      // Default: 3 days
  requireHumanReview: boolean;        // Default: true
  minimumQualityScore: number;        // Default: 75
  maximumRiskLevel: 'LOW' | 'MEDIUM'; // Default: 'LOW'
  publishWindow: {
    startHour: number;                // Default: 9 (9 AM)
    endHour: number;                  // Default: 17 (5 PM)
    timezone: string;                 // Default: 'America/New_York'
    excludeWeekends: boolean;         // Default: true
  };
  notifications: {
    beforePublish: boolean;
    hoursBeforePublish: number;       // Default: 24
    onPublish: boolean;
    onFailure: boolean;
  };
}
```

#### 6.2 Auto-Publish Service

```typescript
// libs/core/publishing/src/lib/auto-publish.ts

interface ScheduledArticle {
  articleId: string;
  scheduledFor: Date;
  autoPublishEligible: boolean;
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface AutoPublishService {
  // Schedule an article for auto-publish
  scheduleArticle(
    articleId: string,
    publishDate?: Date  // If not provided, uses default days after ready
  ): Promise<ScheduledArticle>;

  // Get all scheduled articles
  getScheduledArticles(): Promise<ScheduledArticle[]>;

  // Cancel scheduled publish
  cancelSchedule(articleId: string): Promise<void>;

  // Mark as reviewed (enables auto-publish)
  markAsReviewed(articleId: string, reviewerId: string): Promise<void>;

  // Check eligibility and process due articles
  processScheduledArticles(): Promise<{
    published: string[];
    skipped: string[];
    failed: { id: string; reason: string }[];
  }>;

  // Get publish deadline for an article
  getPublishDeadline(articleId: string): Promise<Date | null>;
}
```

#### 6.3 Edge Function: process-scheduled

```typescript
// supabase/functions/process-scheduled/index.ts

// Triggered by Supabase cron or external scheduler
// Runs every hour

async function processScheduledArticles() {
  const now = new Date();

  // Get articles scheduled for now or earlier
  const dueArticles = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now.toISOString())
    .eq('auto_publish_eligible', true);

  for (const article of dueArticles) {
    // Verify still eligible
    const riskAssessment = await assessRisk(article);
    if (!riskAssessment.autoPublishEligible) {
      await updateArticle(article.id, {
        status: 'review',
        notes: 'Auto-publish cancelled: risk assessment changed',
      });
      continue;
    }

    // Check publish window
    if (!isWithinPublishWindow(now, article.tenant_id)) {
      continue; // Will be picked up in next run
    }

    // Publish to WordPress
    const result = await publishToWordPress(article);
    if (result.success) {
      await updateArticle(article.id, {
        status: 'published',
        published_at: now,
        wp_post_id: result.postId,
        wp_url: result.url,
      });
      await logActivity('auto_publish_success', article.id);
    } else {
      await logActivity('auto_publish_failed', article.id, {
        error: result.error,
      });
    }
  }
}
```

#### 6.4 UI Components

**SchedulePublishModal.tsx:**
```
┌─────────────────────────────────────────────┐
│  📅 Schedule Publication                    │
├─────────────────────────────────────────────┤
│                                             │
│  Publish Date:                              │
│  ┌─────────────────────────────────────┐   │
│  │  December 15, 2024    [📅]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Publish Time:                              │
│  ┌─────────────────────────────────────┐   │
│  │  10:00 AM EST         [🕐]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ☑️ Send notification 24 hours before      │
│  ☐ Require manual review before publish    │
│                                             │
│  Eligibility Check:                         │
│  ✅ Quality score: 82% (min: 75%)          │
│  ✅ Risk level: LOW (max: MEDIUM)          │
│  ✅ No compliance violations               │
│                                             │
│  [Cancel]           [Schedule Publication] │
│                                             │
└─────────────────────────────────────────────┘
```

**ScheduledArticlesView.tsx:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📅 Scheduled Publications                      [+ Schedule New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  This Week:                                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Dec 12 │ Best Online Nursing Programs     │ AUTO  │ 10AM │    │
│  │        │ Quality: 85% | Risk: LOW         │       │      │    │
│  │        │                      [Edit] [Cancel Schedule]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Dec 13 │ MBA vs MHA: Which Degree?        │ REVIEW│ 2PM  │    │
│  │        │ Quality: 78% | Risk: MEDIUM      │ NEEDED│      │    │
│  │        │                      [Review] [Edit] [Cancel]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Next Week:                                                      │
│  ...                                                             │
│                                                                  │
│  Calendar View:                                                  │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                 │
│  │Mon│Tue│Wed│Thu│Fri│Sat│Sun│                                 │
│  ├───┼───┼───┼───┼───┼───┼───┤                                 │
│  │   │ 2 │   │ 1 │ 1 │   │   │                                 │
│  └───┴───┴───┴───┴───┴───┴───┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.5 Files to Create

| File | Description |
|------|-------------|
| `libs/core/publishing/src/lib/auto-publish.ts` | Auto-publish service |
| `apps/geteducated/src/app/components/SchedulePublishModal.tsx` | Scheduling UI |
| `apps/geteducated/src/app/components/ScheduledArticlesView.tsx` | Calendar view |
| `supabase/functions/process-scheduled/index.ts` | Cron handler |

#### 6.6 Database Migration

```sql
-- Already exists: scheduled_at, published_at on articles
-- Add:
ALTER TABLE articles ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE articles ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN publish_window JSONB;
```

#### 6.7 Acceptance Criteria

- [ ] Schedule publication date/time via UI
- [ ] Calendar view of scheduled articles
- [ ] Eligibility checks displayed
- [ ] Human review toggle working
- [ ] Notifications sent before publish
- [ ] Auto-publish process runs reliably
- [ ] Failed publishes logged and retried

---

## Feature 7: Content Ideas Management UI

### Current State
- **Database:** `content_ideas` table - COMPLETE
- **Types:** Defined in `libs/shared/types/src/lib/content.ts`
- **UI:** NOT IMPLEMENTED

### Requirements

#### 7.1 Content Ideas Service

```typescript
interface ContentIdeasService {
  // CRUD operations
  createIdea(idea: CreateIdeaInput): Promise<ContentIdea>;
  updateIdea(id: string, updates: Partial<ContentIdea>): Promise<ContentIdea>;
  deleteIdea(id: string): Promise<void>;
  getIdea(id: string): Promise<ContentIdea>;

  // Listing and filtering
  listIdeas(filters: IdeaFilters): Promise<PaginatedResult<ContentIdea>>;

  // Workflow operations
  approveIdea(id: string): Promise<ContentIdea>;
  rejectIdea(id: string, reason: string): Promise<ContentIdea>;
  assignIdea(id: string, userId: string, contributorId?: string): Promise<ContentIdea>;

  // Conversion
  convertToArticle(ideaId: string): Promise<Article>;

  // Bulk operations
  bulkApprove(ids: string[]): Promise<void>;
  bulkReject(ids: string[], reason: string): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;

  // Import
  importFromCSV(csvData: string): Promise<{ created: number; errors: string[] }>;
}

interface IdeaFilters {
  status?: IdeaStatus[];
  priority?: Priority[];
  source?: IdeaSource[];
  assignedTo?: string;
  clusterId?: string;
  search?: string;
  dateRange?: { start: Date; end: Date };
}
```

#### 7.2 UI Components

**ContentIdeasPage.tsx:**
```
┌─────────────────────────────────────────────────────────────────┐
│  💡 Content Ideas                                  [+ New Idea]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filters:                                                        │
│  [All Status ▼] [All Priority ▼] [All Sources ▼] [Search...  ] │
│                                                                  │
│  ☐ Select All    [Approve Selected] [Reject Selected] [Delete] │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☐ │ Title                    │ Keyword      │ Status    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☐ │ Best Online MBA Programs │ online mba   │ 🟡 pending │   │
│  │   │ SV: 12,400 | KD: 67      │ Rankings     │ Priority: H│   │
│  │   │                          │        [View] [Approve] [X]│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☐ │ Nursing Career Paths     │ nursing jobs │ 🟢 approved│   │
│  │   │ SV: 8,100 | KD: 45       │ Career Guide │ Priority: M│   │
│  │   │                  [View] [Convert to Article] [Archive]│   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ☐ │ PhD vs EdD Comparison    │ phd vs edd   │ 🔴 rejected│   │
│  │   │ SV: 1,200 | KD: 23       │ Degree Guide │ Priority: L│   │
│  │   │ Reason: Too niche                 [Restore] [Delete] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Showing 1-20 of 147 ideas         [< Prev] [1] [2] [3] [Next >]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**CreateIdeaModal.tsx:**
```
┌─────────────────────────────────────────────────────────────┐
│  Create Content Idea                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Title *                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Best Online MBA Programs for Working Professionals  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Primary Keyword *                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ online mba programs                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Research Keyword]  SV: -- | KD: --                       │
│                                                             │
│  Category            │  Content Type                        │
│  [Rankings        ▼] │  [Listicle           ▼]             │
│                                                             │
│  Priority            │  Assign To                           │
│  [High            ▼] │  [Tony Huffman       ▼]             │
│                                                             │
│  Notes                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Focus on AACSB accredited programs. Include cost    │   │
│  │ comparison and ROI data.                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Content Cluster                                            │
│  [MBA Pillar Content                               ▼]      │
│                                                             │
│  [Cancel]                        [Save as Draft] [Submit]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 7.3 Files to Create

| File | Description |
|------|-------------|
| `libs/shared/hooks/src/lib/useContentIdeas.ts` | Data hooks |
| `apps/geteducated/src/app/pages/ContentIdeas.tsx` | Main page |
| `apps/geteducated/src/app/components/CreateIdeaModal.tsx` | Create form |
| `apps/geteducated/src/app/components/IdeaCard.tsx` | List item |

#### 7.4 Acceptance Criteria

- [ ] Create/edit/delete ideas
- [ ] Filter by status, priority, source
- [ ] Search across titles and keywords
- [ ] Approve/reject workflow with reasons
- [ ] Bulk operations (select multiple)
- [ ] Convert approved idea to article
- [ ] Import from CSV
- [ ] Pagination and sorting

---

## Feature 8: Keyword Research & DataForSEO Integration

### Current State
- **Database:** Keyword fields on content_ideas, articles
- **API Integration:** NOT IMPLEMENTED
- **UI:** NOT IMPLEMENTED

### Requirements

#### 8.1 DataForSEO Client

```typescript
// libs/core/generation/src/lib/dataforseo-client.ts

interface KeywordData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  competition: 'low' | 'medium' | 'high';
  trendData: { month: string; volume: number }[];
  relatedKeywords: string[];
}

interface DataForSEOClient {
  // Single keyword lookup
  getKeywordData(keyword: string): Promise<KeywordData>;

  // Batch lookup (more efficient)
  getBatchKeywordData(keywords: string[]): Promise<KeywordData[]>;

  // Get related keywords
  getRelatedKeywords(
    seedKeyword: string,
    limit?: number
  ): Promise<KeywordData[]>;

  // Get keyword suggestions
  getSuggestions(
    seedKeyword: string,
    includeQuestions?: boolean
  ): Promise<string[]>;

  // Competitor keyword analysis
  getCompetitorKeywords(domain: string): Promise<KeywordData[]>;
}
```

#### 8.2 Keyword Research Service

```typescript
interface KeywordResearchService {
  // Research and store keywords
  researchKeyword(keyword: string): Promise<KeywordData>;
  researchBatch(keywords: string[]): Promise<KeywordData[]>;

  // Saved keywords management
  starKeyword(keywordId: string): Promise<void>;
  unstarKeyword(keywordId: string): Promise<void>;
  getStarredKeywords(): Promise<KeywordData[]>;

  // Clustering
  clusterKeywords(keywords: KeywordData[]): Promise<KeywordCluster[]>;
  assignToCluster(keywordId: string, clusterId: string): Promise<void>;

  // Gap analysis
  findContentGaps(
    siteKeywords: string[],
    competitorKeywords: string[]
  ): Promise<KeywordData[]>;

  // Export
  exportToCSV(keywords: KeywordData[]): string;
}
```

#### 8.3 UI Components

**KeywordsPage.tsx:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🔑 Keyword Research                          [Import CSV]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Research Keywords:                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ online mba, nursing programs, phd psychology...         │    │
│  └─────────────────────────────────────────────────────────┘    │
│  [Research Keywords]                                             │
│                                                                  │
│  ──────────────────────────────────────────────────────────────│
│                                                                  │
│  Results:                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Keyword          │ SV     │ KD  │ CPC  │ Comp   │ ⭐   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ online mba       │ 18,100 │ 72  │ $45  │ High   │ ★    │    │
│  │ nursing programs │ 12,300 │ 58  │ $28  │ Medium │ ☆    │    │
│  │ phd psychology   │  8,400 │ 45  │ $15  │ Medium │ ★    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Trend: online mba                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     📈                                                   │    │
│  │    /  \      /\                                         │    │
│  │   /    \    /  \      /                                 │    │
│  │  /      \  /    \    /                                  │    │
│  │ /        \/      \  /                                   │    │
│  │Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Create Content Idea from Selected] [Export CSV]               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**KeywordClusterView.tsx:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Topic Clusters                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MBA Programs                            Total SV: 45K  │    │
│  │  ├── online mba (18,100)                               │    │
│  │  ├── mba programs (12,400)                             │    │
│  │  ├── best mba programs (8,200)                         │    │
│  │  └── mba requirements (6,100)                          │    │
│  │                                          [Create Pillar]│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Nursing Education                       Total SV: 38K  │    │
│  │  ├── nursing programs (12,300)                         │    │
│  │  ├── online nursing degree (9,800)                     │    │
│  │  ├── bsn programs (8,500)                              │    │
│  │  └── nursing prerequisites (7,200)                     │    │
│  │                                          [Create Pillar]│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.4 Database Migration

```sql
-- 011_add_keyword_research_tables.sql

CREATE TABLE keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  keyword VARCHAR(500) NOT NULL,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc DECIMAL(10,2),
  competition VARCHAR(20),
  trend_data JSONB,
  related_keywords TEXT[],
  is_starred BOOLEAN DEFAULT false,
  cluster_id UUID REFERENCES content_clusters(id),
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, keyword)
);

CREATE INDEX idx_keyword_research_tenant ON keyword_research(tenant_id);
CREATE INDEX idx_keyword_research_starred ON keyword_research(tenant_id, is_starred);
```

#### 8.5 Files to Create

| File | Description |
|------|-------------|
| `libs/core/generation/src/lib/dataforseo-client.ts` | API client |
| `libs/shared/hooks/src/lib/useKeywordResearch.ts` | Data hooks |
| `apps/geteducated/src/app/pages/Keywords.tsx` | Main page |
| `apps/geteducated/src/app/components/KeywordResults.tsx` | Results table |
| `apps/geteducated/src/app/components/KeywordTrendChart.tsx` | Trend chart |
| `apps/geteducated/src/app/components/KeywordClusterView.tsx` | Clusters |

#### 8.6 Acceptance Criteria

- [ ] Research individual keywords
- [ ] Batch keyword research
- [ ] Display search volume, KD, CPC
- [ ] Trend visualization chart
- [ ] Star/favorite keywords
- [ ] Auto-cluster related keywords
- [ ] Create content idea from keyword
- [ ] Import/export CSV

---

## Feature 9: Generation Queue Management

### Current State
- **Database:** `pipeline_runs` tracks individual runs
- **Processing:** Synchronous in edge function
- **Queue:** NOT IMPLEMENTED

### Requirements

#### 9.1 Queue Data Model

```typescript
interface QueueItem {
  id: string;
  tenantId: string;
  contentIdeaId?: string;
  articleId?: string;
  priority: number;          // Higher = more urgent
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledFor?: Date;       // For delayed processing
  processingStartedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  createdBy: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  estimatedWaitTime: number;
}
```

#### 9.2 Queue Service

```typescript
interface GenerationQueueService {
  // Add to queue
  enqueue(
    input: { contentIdeaId?: string; articleId?: string },
    options?: { priority?: number; scheduledFor?: Date }
  ): Promise<QueueItem>;

  // Bulk operations
  enqueueBatch(
    items: { contentIdeaId?: string; articleId?: string }[],
    options?: { priority?: number }
  ): Promise<QueueItem[]>;

  // Queue management
  getQueue(): Promise<QueueItem[]>;
  getQueueStats(): Promise<QueueStats>;
  cancelItem(itemId: string): Promise<void>;
  retryItem(itemId: string): Promise<void>;
  clearCompleted(): Promise<number>;
  clearFailed(): Promise<number>;

  // Priority management
  setPriority(itemId: string, priority: number): Promise<void>;
  moveToFront(itemId: string): Promise<void>;
  moveToBack(itemId: string): Promise<void>;

  // Processing (for edge function)
  getNextItem(): Promise<QueueItem | null>;
  markProcessing(itemId: string): Promise<void>;
  markCompleted(itemId: string, result: any): Promise<void>;
  markFailed(itemId: string, error: string): Promise<void>;
}
```

#### 9.3 UI Components

**AutomationPage.tsx (Queue View):**
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ Generation Queue                          [+ Add to Queue]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stats:                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Pending  │ │Processing│ │Completed │ │ Failed   │           │
│  │    12    │ │    2     │ │   145    │ │    3     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  Est. Wait Time: ~45 minutes                                     │
│  Processing Rate: 4 articles/hour                                │
│                                                                  │
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  Queue:                                     [Clear Completed]    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ #  │ Title                    │ Priority│ Status  │       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ 1  │ MBA vs MS: Which is Bet..│ ▲▲▲ High│ 🔄 Proc │ [⏸]   │   │
│  │ 2  │ Online Nursing Prerequ.. │ ▲▲ Med  │ 🔄 Proc │ [⏸]   │   │
│  │ 3  │ Best PhD Psychology Pro..│ ▲▲ Med  │ ⏳ Pend │ [↑][✕]│   │
│  │ 4  │ How to Choose an Accre.. │ ▲ Low   │ ⏳ Pend │ [↑][✕]│   │
│  │ 5  │ EdD Programs Online 20.. │ ▲ Low   │ ⏳ Pend │ [↑][✕]│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Failed (3):                               [Retry All] [Clear]  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Criminal Justice Careers (API timeout) [Retry] [Delete]│   │
│  │ • Healthcare Admin Guide (Rate limited)  [Retry] [Delete]│   │
│  │ • Teaching Degree Options (Invalid resp) [Retry] [Delete]│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.4 Database Migration

```sql
-- 012_add_generation_queue_table.sql

CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  content_idea_id UUID REFERENCES content_ideas(id),
  article_id UUID REFERENCES articles(id),
  priority INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT queue_has_source CHECK (
    content_idea_id IS NOT NULL OR article_id IS NOT NULL
  )
);

CREATE INDEX idx_generation_queue_tenant_status
  ON generation_queue(tenant_id, status);
CREATE INDEX idx_generation_queue_pending
  ON generation_queue(status, priority DESC, created_at)
  WHERE status = 'pending';
```

#### 9.5 Edge Function: process-queue

```typescript
// supabase/functions/process-queue/index.ts

// Runs on schedule (every 5 minutes) or triggered
// Processes up to N concurrent items based on tenant limits

async function processQueue() {
  const concurrencyLimit = 2; // Per tenant

  // Get tenants with pending items
  const tenantsWithWork = await getTenantsWithPendingItems();

  for (const tenantId of tenantsWithWork) {
    // Check current processing count
    const processing = await getProcessingCount(tenantId);
    if (processing >= concurrencyLimit) continue;

    // Get next item for this tenant
    const item = await getNextQueueItem(tenantId);
    if (!item) continue;

    // Mark as processing
    await markProcessing(item.id);

    // Process asynchronously
    processItem(item).catch(async (error) => {
      const attempts = item.attempts + 1;
      if (attempts >= item.maxAttempts) {
        await markFailed(item.id, error.message);
      } else {
        await markForRetry(item.id, error.message, attempts);
      }
    });
  }
}
```

#### 9.6 Files to Create

| File | Description |
|------|-------------|
| `libs/shared/hooks/src/lib/useGenerationQueue.ts` | Queue hooks |
| `apps/geteducated/src/app/pages/Automation.tsx` | Queue page |
| `apps/geteducated/src/app/components/QueueStats.tsx` | Stats cards |
| `apps/geteducated/src/app/components/QueueList.tsx` | Queue list |
| `supabase/functions/process-queue/index.ts` | Queue worker |

#### 9.7 Acceptance Criteria

- [ ] Add items to queue
- [ ] Bulk add from content ideas
- [ ] Priority ordering works
- [ ] Cancel/retry individual items
- [ ] Clear completed/failed
- [ ] Queue stats displayed
- [ ] Concurrent processing limited
- [ ] Retry logic with backoff

---

## Feature 10: Monetization System

### Current State
- **Database:** `tenant_monetization_categories` - EXISTS
- **Service:** NOT IMPLEMENTED
- **UI:** NOT IMPLEMENTED

### Requirements

#### 10.1 Monetization Engine

```typescript
// libs/core/generation/src/lib/monetization.ts

interface MonetizationCategory {
  id: string;
  category: string;
  subCategory?: string;
  shortcodeTemplate: string;
  shortcodeParams: Record<string, any>;
  keywordPatterns: string[];
  topicPatterns: string[];
  priority: number;
  usageCount: number;
}

interface ShortcodeSlot {
  position: 'after_intro' | 'mid_content' | 'before_conclusion' | 'sidebar';
  shortcode: string;
  params: Record<string, any>;
}

interface MonetizationResult {
  contentWithShortcodes: string;
  insertedSlots: ShortcodeSlot[];
  matchedCategories: MonetizationCategory[];
  estimatedRevenue?: number;
}

interface MonetizationEngine {
  // Analyze content and insert shortcodes
  monetizeContent(
    content: string,
    articleMeta: {
      category: string;
      keywords: string[];
      topics: string[];
      degreeLevel?: string;
    }
  ): Promise<MonetizationResult>;

  // Get matching categories for content
  findMatchingCategories(
    keywords: string[],
    topics: string[]
  ): Promise<MonetizationCategory[]>;

  // Generate shortcode with params
  generateShortcode(
    template: string,
    params: Record<string, any>
  ): string;

  // Validate shortcode syntax
  validateShortcode(shortcode: string): boolean;

  // Category management
  getCategories(): Promise<MonetizationCategory[]>;
  updateCategory(id: string, updates: Partial<MonetizationCategory>): Promise<void>;
}
```

#### 10.2 Shortcode Templates

```typescript
// Based on reference app's 155 categories

const SHORTCODE_TEMPLATES = {
  degree_table: '[degree_table program="{program}" level="{level}" accreditation="{accreditation}"]',
  degree_offer: '[degree_offer program="{program}" style="{style}"]',
  school_spotlight: '[school_spotlight school_id="{schoolId}" layout="{layout}"]',
  comparison_table: '[comparison_table programs="{programs}" metrics="{metrics}"]',
  salary_data: '[salary_data occupation="{occupation}" source="bls"]',
  accreditation_badge: '[accreditation_badge type="{type}"]',
};

// Example category mappings
const CATEGORY_MAPPINGS = [
  {
    category: 'MBA',
    subCategory: 'Online MBA',
    keywordPatterns: ['online mba', 'mba program', 'business degree'],
    shortcodeTemplate: 'degree_table',
    shortcodeParams: { program: 'mba', level: 'masters', accreditation: 'aacsb' },
  },
  {
    category: 'Nursing',
    subCategory: 'BSN Programs',
    keywordPatterns: ['nursing degree', 'bsn', 'rn to bsn'],
    shortcodeTemplate: 'degree_table',
    shortcodeParams: { program: 'nursing', level: 'bachelors', accreditation: 'ccne' },
  },
  // ... 153 more categories
];
```

#### 10.3 UI Components

**ShortcodeInspector.tsx:**
```
┌─────────────────────────────────────────────────────────────┐
│  💰 Monetization                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Detected Categories:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • MBA Programs (match: 92%)                         │   │
│  │ • Online Education (match: 78%)                     │   │
│  │ • Business Degrees (match: 65%)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Inserted Shortcodes (3):                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. [degree_table program="mba"...]                  │   │
│  │    Position: After introduction                     │   │
│  │    [Preview] [Edit] [Remove]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. [school_spotlight school_id="123"...]            │   │
│  │    Position: Mid-content                            │   │
│  │    [Preview] [Edit] [Remove]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. [degree_offer program="mba"...]                  │   │
│  │    Position: Before conclusion                      │   │
│  │    [Preview] [Edit] [Remove]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Add Shortcode]  [Auto-Insert Optimal]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**MonetizationPreview.tsx:**
```
┌─────────────────────────────────────────────────────────────┐
│  Preview: degree_table                         [Close]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │   TOP ONLINE MBA PROGRAMS                           │   │
│  │   ━━━━━━━━━━━━━━━━━━━━━━━━━                        │   │
│  │                                                      │   │
│  │   🎓 University of Example                          │   │
│  │      AACSB Accredited | 18 months | $45,000        │   │
│  │      [Request Info]                                 │   │
│  │                                                      │   │
│  │   🎓 State University Online                        │   │
│  │      AACSB Accredited | 24 months | $38,000        │   │
│  │      [Request Info]                                 │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Note: Actual display depends on WordPress theme           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 10.4 Files to Create

| File | Description |
|------|-------------|
| `libs/core/generation/src/lib/monetization.ts` | Engine service |
| `apps/geteducated/src/app/components/ShortcodeInspector.tsx` | Inspector UI |
| `apps/geteducated/src/app/components/MonetizationPreview.tsx` | Preview modal |
| `apps/geteducated/src/app/components/settings/MonetizationSettings.tsx` | Config |

#### 10.5 Acceptance Criteria

- [ ] Auto-detect matching categories
- [ ] Insert shortcodes at appropriate positions
- [ ] Preview shortcode rendering
- [ ] Edit/remove inserted shortcodes
- [ ] Manual shortcode insertion
- [ ] Category management in settings
- [ ] Usage tracking per category

---

## Implementation Priority

### Phase 2A (Weeks 6-8)
1. **Content Ideas UI** - Enables idea pipeline
2. **Generation Queue** - Enables bulk operations

### Phase 2B (Weeks 8-10)
3. **Auto-Publish Scheduling** - Completes workflow
4. **Keyword Research** - Enables SEO-driven content

### Phase 2C (Weeks 10-12)
5. **Monetization System** - Revenue integration

---

## Dependencies

| Feature | Depends On |
|---------|------------|
| Auto-Publish | Risk Assessment (Tier 1) |
| Content Ideas | None |
| Keyword Research | Content Ideas (optional) |
| Generation Queue | Content Ideas, Generation Pipeline |
| Monetization | Internal Linking (Tier 1) |

---

*This document covers Tier 2 features. See `04-TIER-3-4-FEATURES.md` for remaining specifications.*
