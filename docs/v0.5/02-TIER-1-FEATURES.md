# Meta Content Engine v0.5 - Tier 1 Feature Specifications

> **Document Version:** 1.0
> **Created:** December 10, 2024
> **Priority:** CRITICAL - Blocks Core Functionality

---

## Overview

Tier 1 features are essential for the core value proposition of the platform. Without these, the content engine cannot function as intended.

| Feature | Current State | Blocks |
|---------|---------------|--------|
| 1. StealthGPT UI Integration | 90% | AI detection bypass |
| 2. Internal Linking System | 30% | SEO value, link equity |
| 3. Link Compliance Validation | 40% | Content quality, legal |
| 4. Kanban Workflow Board | 10% | Content management UX |
| 5. Risk Assessment System | 5% | Auto-publish decisions |

---

## Feature 1: StealthGPT UI Integration

### Current State
- **Provider:** `libs/core/generation/src/lib/providers/stealthgpt.ts` - COMPLETE
- **UI Integration:** NOT IMPLEMENTED
- **Pipeline Stage:** Visual exists in `PipelineVisualizer.tsx` but not wired

### Requirements

#### 1.1 Humanization Panel Component
Create a panel that displays during/after the humanization stage:

```typescript
interface HumanizationPanelProps {
  articleId: string;
  content: string;
  onHumanize: (settings: HumanizationSettings) => Promise<void>;
  onComplete: (humanizedContent: string) => void;
}

interface HumanizationSettings {
  mode: 'low' | 'medium' | 'high';  // Bypass aggressiveness
  tone: 'HighSchool' | 'College' | 'PhD';  // Academic level
  preservePhrases: string[];  // Signature phrases to keep
  avoidPhrases: string[];     // Phrases to remove
  doublePass: boolean;        // Run twice for extra safety
}
```

#### 1.2 UI Components Needed

**HumanizationPanel.tsx:**
```
┌─────────────────────────────────────────────┐
│  🛡️ AI Humanization                        │
├─────────────────────────────────────────────┤
│                                             │
│  Bypass Mode: ○ Low  ● Medium  ○ High      │
│                                             │
│  Academic Tone: [College        ▼]         │
│                                             │
│  □ Double-pass for extra safety            │
│                                             │
│  AI Detection Risk: ████████░░ 78%         │
│                     ↓ After humanization    │
│                     ██░░░░░░░░ 15%         │
│                                             │
│  [Humanize Content]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**HumannessScoreDisplay.tsx:**
```
┌─────────────────────────────────────────────┐
│  Humanness Analysis                         │
├─────────────────────────────────────────────┤
│                                             │
│  Overall Score: 85/100 ████████░░          │
│                                             │
│  ⚠️ Issues Detected:                       │
│  • "delve" appears 3 times (AI pattern)    │
│  • Uniform sentence length detected        │
│  • Low contraction usage (2.1%)            │
│                                             │
│  ✓ Positive Signals:                       │
│  • Good paragraph variety                  │
│  • Natural transitions used                │
│  • Conversational markers present          │
│                                             │
└─────────────────────────────────────────────┘
```

#### 1.3 Integration Points

1. **ContentForge.tsx** - Add humanization stage visualization
2. **ArticleEditor.tsx** - Add "Humanize" button in toolbar
3. **generate-article Edge Function** - Already calls StealthGPT

#### 1.4 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/HumanizationPanel.tsx` | CREATE | Settings and trigger |
| `components/HumannessScoreDisplay.tsx` | CREATE | Score visualization |
| `pages/ContentForge.tsx` | MODIFY | Wire humanization stage |
| `pages/ArticleEditor.tsx` | MODIFY | Add humanize button |

#### 1.5 Acceptance Criteria

- [ ] User can select humanization mode (low/medium/high)
- [ ] User can select academic tone level
- [ ] Humanness score shown before/after
- [ ] AI pattern issues displayed with suggestions
- [ ] Double-pass option available
- [ ] Progress indicator during humanization

---

## Feature 2: Internal Linking System

### Current State
- **Database:** `tenant_site_catalog`, `article_internal_links` - EXIST
- **Service Logic:** NOT IMPLEMENTED
- **UI:** NOT IMPLEMENTED

### Requirements

#### 2.1 Site Catalog Service

```typescript
// libs/core/generation/src/lib/internal-linking.ts

interface SiteCatalogEntry {
  id: string;
  url: string;
  slug: string;
  title: string;
  excerpt: string;
  topics: string[];
  keywords: string[];
  contentType: string;
  degreeLevel: string;
  wordCount: number;
  publishedAt: Date;
  timesLinkedTo: number;
  relevanceScore?: number;  // Calculated at query time
}

interface LinkSuggestion {
  catalogEntry: SiteCatalogEntry;
  relevanceScore: number;
  suggestedAnchorTexts: string[];
  matchReason: string;  // "Topic match", "Keyword match", etc.
  insertionPoint?: {
    paragraph: number;
    sentence: number;
    context: string;
  };
}

interface InternalLinkingService {
  // Get relevant articles for linking
  getSuggestions(
    articleContent: string,
    articleTopics: string[],
    articleKeywords: string[],
    limit?: number
  ): Promise<LinkSuggestion[]>;

  // Insert links into content
  insertLinks(
    content: string,
    links: { url: string; anchorText: string; }[],
    maxLinks?: number
  ): Promise<string>;

  // Track link usage
  recordLinkUsage(
    sourceArticleId: string,
    targetCatalogId: string,
    anchorText: string
  ): Promise<void>;

  // Sync catalog from sitemap
  syncFromSitemap(sitemapUrl: string): Promise<{ added: number; updated: number; }>;
}
```

#### 2.2 Relevance Scoring Algorithm

```typescript
function calculateRelevance(
  article: { title: string; topics: string[]; keywords: string[]; },
  catalogEntry: SiteCatalogEntry
): number {
  let score = 0;

  // Title word overlap (0-40 points)
  const articleWords = new Set(article.title.toLowerCase().split(/\s+/));
  const catalogWords = catalogEntry.title.toLowerCase().split(/\s+/);
  const titleOverlap = catalogWords.filter(w => articleWords.has(w)).length;
  score += Math.min(titleOverlap * 10, 40);

  // Topic intersection (0-30 points)
  const topicMatches = article.topics.filter(t =>
    catalogEntry.topics.includes(t)
  ).length;
  score += Math.min(topicMatches * 10, 30);

  // Keyword intersection (0-20 points)
  const keywordMatches = article.keywords.filter(k =>
    catalogEntry.keywords.includes(k.toLowerCase())
  ).length;
  score += Math.min(keywordMatches * 5, 20);

  // Recency bonus (0-10 points)
  const daysSincePublish = daysBetween(catalogEntry.publishedAt, new Date());
  if (daysSincePublish < 30) score += 10;
  else if (daysSincePublish < 90) score += 7;
  else if (daysSincePublish < 180) score += 4;

  // Link equity penalty (-20 to 0)
  // Avoid over-linking to same articles
  if (catalogEntry.timesLinkedTo > 20) score -= 20;
  else if (catalogEntry.timesLinkedTo > 10) score -= 10;
  else if (catalogEntry.timesLinkedTo > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}
```

#### 2.3 UI Components

**InternalLinkSuggester.tsx:**
```
┌─────────────────────────────────────────────────────────────┐
│  🔗 Internal Link Suggestions                               │
├─────────────────────────────────────────────────────────────┤
│  Target: 3-5 internal links | Current: 2                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Suggested Links:                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📄 Best Online MBA Programs 2024                     │   │
│  │    Relevance: 92% | Links: 5                        │   │
│  │    Match: "MBA", "online degree", "business"        │   │
│  │    Anchor suggestions: "top MBA programs",          │   │
│  │                        "online MBA rankings"         │   │
│  │    [Insert Link]  [Preview]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📄 How to Choose an Accredited Online School        │   │
│  │    Relevance: 78% | Links: 12                       │   │
│  │    Match: "accreditation", "online"                 │   │
│  │    [Insert Link]  [Preview]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Auto-Insert Best 3 Links]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**SiteCatalog.tsx (New Page):**
```
┌─────────────────────────────────────────────────────────────┐
│  📚 Site Catalog                                [Sync Now]  │
├─────────────────────────────────────────────────────────────┤
│  Last synced: 2 hours ago | 1,247 articles                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Search: [________________________] [🔍]                    │
│                                                             │
│  Filter: [All Types ▼] [All Levels ▼] [All Topics ▼]      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ URL                    │ Title      │ Links │ Last   │  │
│  │                        │            │ To    │ Update │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ /best-online-mba       │ Best MBA.. │  15   │ 2 days │  │
│  │ /nursing-programs      │ Top Nurs.. │  23   │ 5 days │  │
│  │ /accreditation-guide   │ Accredi..  │   8   │ 1 week │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Import from Sitemap]  [Import CSV]  [Add Manual Entry]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4 Edge Function: sync-site-catalog

```typescript
// supabase/functions/sync-site-catalog/index.ts

// 1. Fetch sitemap.xml from tenant's domain
// 2. Parse XML to extract URLs
// 3. For each URL:
//    - Fetch page content
//    - Extract: title, excerpt, main content
//    - Identify topics and keywords using AI
//    - Upsert to tenant_site_catalog
// 4. Mark removed URLs as inactive
// 5. Return sync statistics
```

#### 2.5 Files to Create

| File | Description |
|------|-------------|
| `libs/core/generation/src/lib/internal-linking.ts` | Core service |
| `apps/geteducated/src/app/components/InternalLinkSuggester.tsx` | Sidebar component |
| `apps/geteducated/src/app/pages/SiteCatalog.tsx` | Management page |
| `supabase/functions/sync-site-catalog/index.ts` | Sitemap sync |

#### 2.6 Acceptance Criteria

- [ ] Catalog displays all site URLs with metadata
- [ ] Import from sitemap.xml works
- [ ] Relevance scores calculated correctly
- [ ] Link suggestions shown in article editor
- [ ] One-click link insertion
- [ ] Link usage tracked in junction table
- [ ] Target link count displayed (3-5 goal)

---

## Feature 3: Link Compliance Validation

### Current State
- **Database:** `tenant_domain_rules`, helper functions - EXIST
- **Service Logic:** Basic check in edge function
- **UI:** NOT IMPLEMENTED

### Requirements

#### 3.1 Compliance Service

```typescript
// libs/core/generation/src/lib/link-compliance.ts

interface DomainRule {
  domain: string;
  ruleType: 'blocked' | 'allowed' | 'competitor' | 'trusted';
  matchSubdomains: boolean;
  reason?: string;
}

interface ComplianceViolation {
  url: string;
  domain: string;
  ruleType: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

interface ComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceViolation[];
  allowedLinks: string[];
  stats: {
    totalLinks: number;
    blockedCount: number;
    allowedCount: number;
    warningCount: number;
  };
}

interface LinkComplianceService {
  // Check all links in content
  checkContent(htmlContent: string): Promise<ComplianceResult>;

  // Check single URL
  checkUrl(url: string): Promise<{
    allowed: boolean;
    rule?: DomainRule;
    reason: string;
  }>;

  // Get rules for tenant
  getRules(): Promise<DomainRule[]>;

  // Add/update/delete rules
  addRule(rule: DomainRule): Promise<void>;
  updateRule(ruleId: string, rule: Partial<DomainRule>): Promise<void>;
  deleteRule(ruleId: string): Promise<void>;
}
```

#### 3.2 Default Blocked Domains (GetEducated Example)

```typescript
const DEFAULT_BLOCKED_DOMAINS = [
  // Direct competitors
  { domain: 'usnews.com', reason: 'Competitor - rankings' },
  { domain: 'niche.com', reason: 'Competitor - rankings' },
  { domain: 'collegefactual.com', reason: 'Competitor' },
  { domain: 'collegesimply.com', reason: 'Competitor' },
  { domain: 'bestcolleges.com', reason: 'Competitor' },
  { domain: 'onlineu.com', reason: 'Competitor' },
  { domain: 'guidetoonlineschools.com', reason: 'Competitor' },

  // .edu restriction (unless explicitly allowed)
  { domain: '.edu', reason: 'Educational institution - requires approval', matchSubdomains: true },

  // Other blocked
  { domain: 'wikipedia.org', reason: 'Not authoritative for citations' },
];

const DEFAULT_ALLOWED_DOMAINS = [
  // Government/Official
  { domain: 'bls.gov', reason: 'Bureau of Labor Statistics - authoritative' },
  { domain: 'ed.gov', reason: 'Department of Education - authoritative' },
  { domain: 'studentaid.gov', reason: 'Federal Student Aid - authoritative' },

  // Accreditation
  { domain: 'chea.org', reason: 'Council for Higher Education Accreditation' },
  { domain: 'aacsb.edu', reason: 'Business school accreditation' },
  { domain: 'ccne-accreditation.org', reason: 'Nursing accreditation' },

  // Trusted sources
  { domain: 'pewresearch.org', reason: 'Research organization' },
  { domain: 'brookings.edu', reason: 'Think tank' },
];
```

#### 3.3 UI Components

**LinkComplianceChecker.tsx:**
```
┌─────────────────────────────────────────────────────────────┐
│  🔒 Link Compliance                                         │
├─────────────────────────────────────────────────────────────┤
│  Status: ⚠️ 2 Issues Found                                 │
│                                                             │
│  ❌ Blocked Links (2):                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ usnews.com/best-colleges                            │   │
│  │ Reason: Competitor - rankings                       │   │
│  │ Suggestion: Remove or replace with BLS data         │   │
│  │ [Remove Link]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ harvard.edu/admissions                              │   │
│  │ Reason: .edu domain requires approval               │   │
│  │ [Request Approval]  [Remove Link]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ✅ Allowed Links (5):                                     │
│  • bls.gov/occupational-outlook (BLS - authoritative)      │
│  • studentaid.gov/understand (Federal - authoritative)     │
│  • ...                                                      │
│                                                             │
│  [Run Full Check]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**DomainRulesSettings.tsx (in Settings page):**
```
┌─────────────────────────────────────────────────────────────┐
│  Domain Rules                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Blocked Domains (17):                     [+ Add Domain]   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Domain          │ Reason              │ Actions     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ usnews.com      │ Competitor          │ [Edit] [🗑] │   │
│  │ niche.com       │ Competitor          │ [Edit] [🗑] │   │
│  │ *.edu           │ Requires approval   │ [Edit] [🗑] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Allowed Domains (12):                     [+ Add Domain]   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Domain          │ Reason              │ Actions     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ bls.gov         │ Official statistics │ [Edit] [🗑] │   │
│  │ ed.gov          │ Dept of Education   │ [Edit] [🗑] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.4 Integration Points

1. **ArticleEditor.tsx** - Real-time checking as user adds links
2. **ContentForge.tsx** - Pre-generation compliance check
3. **Publishing flow** - Block publish if violations exist
4. **Settings.tsx** - Domain rules management

#### 3.5 Files to Create

| File | Description |
|------|-------------|
| `libs/core/generation/src/lib/link-compliance.ts` | Core service |
| `apps/geteducated/src/app/components/LinkComplianceChecker.tsx` | Sidebar component |
| `apps/geteducated/src/app/components/settings/DomainRulesSettings.tsx` | Settings panel |

#### 3.6 Acceptance Criteria

- [ ] All links extracted and validated
- [ ] Blocked domains show error with reason
- [ ] .edu links flagged for review
- [ ] Allowed domains pass validation
- [ ] Rules configurable per tenant
- [ ] Real-time validation in editor
- [ ] Publish blocked for violations

---

## Feature 4: Kanban Workflow Board

### Current State
- **Status workflow:** Defined in types and used in badges
- **UI:** List view only in `Articles.tsx`
- **Drag-drop:** NOT IMPLEMENTED

### Requirements

#### 4.1 Kanban Data Structure

```typescript
interface KanbanColumn {
  id: ArticleStatus;
  title: string;
  color: string;
  allowDrop: boolean;
  allowedTransitionsFrom: ArticleStatus[];
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'idea',
    title: 'Ideas',
    color: 'gray',
    allowDrop: true,
    allowedTransitionsFrom: ['outline', 'drafting'],
  },
  {
    id: 'drafting',
    title: 'Drafting',
    color: 'blue',
    allowDrop: true,
    allowedTransitionsFrom: ['idea', 'outline', 'humanizing'],
  },
  {
    id: 'humanizing',
    title: 'Refinement',
    color: 'purple',
    allowDrop: true,
    allowedTransitionsFrom: ['drafting', 'review'],
  },
  {
    id: 'review',
    title: 'QA Review',
    color: 'orange',
    allowDrop: true,
    allowedTransitionsFrom: ['humanizing', 'ready'],
  },
  {
    id: 'ready',
    title: 'Ready to Publish',
    color: 'green',
    allowDrop: true,
    allowedTransitionsFrom: ['review'],
  },
  {
    id: 'published',
    title: 'Published',
    color: 'emerald',
    allowDrop: false,  // Only via publish action
    allowedTransitionsFrom: [],
  },
];
```

#### 4.2 UI Components

**KanbanBoard.tsx:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Articles                              [Board View] [List View]  [+ New]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Ideas   │ │Drafting │ │Refinemnt│ │QA Review│ │ Ready   │ │Published│  │
│  │   (5)   │ │   (3)   │ │   (2)   │ │   (4)   │ │   (2)   │ │  (127)  │  │
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤  │
│  │         │ │         │ │         │ │         │ │         │ │         │  │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │  │
│  │ │Card │ │ │ │Card │ │ │ │Card │ │ │ │Card │ │ │ │Card │ │ │ │Card │ │  │
│  │ │  1  │ │ │ │  1  │ │ │ │  1  │ │ │ │  1  │ │ │ │  1  │ │ │ │  1  │ │  │
│  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │  │
│  │         │ │         │ │         │ │         │ │         │ │         │  │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │  ...   │  │
│  │ │Card │ │ │ │Card │ │ │ │  2  │ │ │ │  2  │ │ │ │  2  │ │ │         │  │
│  │ │  2  │ │ │ │  2  │ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │         │  │
│  │ └─────┘ │ │ └─────┘ │ │         │ │         │ │         │ │         │  │
│  │         │ │         │ │         │ │  ...    │ │         │ │         │  │
│  │  ...    │ │ ┌─────┐ │ │         │ │         │ │         │ │         │  │
│  │         │ │ │  3  │ │ │         │ │         │ │         │ │         │  │
│  │         │ │ └─────┘ │ │         │ │         │ │         │ │         │  │
│  │         │ │         │ │         │ │         │ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ArticleCard.tsx:**
```
┌─────────────────────────────────┐
│ Best Online MBA Programs 2024   │
├─────────────────────────────────┤
│ 👤 Tony Huffman                 │
│ 📂 Rankings                     │
├─────────────────────────────────┤
│ Quality: 85 ████████░░          │
│ Risk: LOW 🟢                    │
├─────────────────────────────────┤
│ Updated: 2 hours ago            │
│ Words: 2,847                    │
└─────────────────────────────────┘
```

#### 4.3 Drag-Drop Implementation

```typescript
// Using @dnd-kit

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Handle drag end
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const articleId = active.id as string;
  const newStatus = over.id as ArticleStatus;

  // Validate transition is allowed
  const currentStatus = articles.find(a => a.id === articleId)?.status;
  const column = KANBAN_COLUMNS.find(c => c.id === newStatus);

  if (!column?.allowedTransitionsFrom.includes(currentStatus)) {
    toast.error(`Cannot move from ${currentStatus} to ${newStatus}`);
    return;
  }

  // Update article status
  await updateArticleStatus(articleId, newStatus);

  // Log activity
  await logActivity('article_status_change', articleId, {
    from: currentStatus,
    to: newStatus,
  });
};
```

#### 4.4 Files to Create

| File | Description |
|------|-------------|
| `apps/geteducated/src/app/components/KanbanBoard.tsx` | Main board |
| `apps/geteducated/src/app/components/KanbanColumn.tsx` | Column wrapper |
| `apps/geteducated/src/app/components/ArticleCard.tsx` | Draggable card |
| `apps/geteducated/src/app/pages/Articles.tsx` | MODIFY - add toggle |

#### 4.5 Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 4.6 Acceptance Criteria

- [ ] 6 columns displayed with article counts
- [ ] Articles shown as cards with key info
- [ ] Drag-drop changes article status
- [ ] Invalid transitions blocked with message
- [ ] Board/list view toggle works
- [ ] Published column shows recent 20 only
- [ ] Real-time updates when status changes

---

## Feature 5: Risk Assessment System

### Current State
- **Service:** NOT IMPLEMENTED
- **UI:** NOT IMPLEMENTED
- **Database:** No risk fields on articles table

### Requirements

#### 5.1 Risk Assessment Service

```typescript
// libs/core/quality/src/lib/risk-assessment.ts

interface RiskFactor {
  category: 'ai_detection' | 'compliance' | 'quality' | 'structure';
  name: string;
  score: number;        // 0-100 contribution to risk
  weight: number;       // Importance multiplier
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isBlocking: boolean;  // Prevents auto-publish
}

interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;  // 0-100 aggregate
  factors: RiskFactor[];
  blockingIssues: string[];
  warnings: string[];
  autoPublishEligible: boolean;
  recommendations: string[];
}

function assessRisk(
  article: Article,
  qualityScores: QualityScores,
  complianceResult: ComplianceResult,
  humannessScore: HumannessScore
): RiskAssessment {
  const factors: RiskFactor[] = [];

  // AI Detection Risk (0-40 points)
  const aiRisk = 100 - humannessScore.overall;
  factors.push({
    category: 'ai_detection',
    name: 'AI Detection Likelihood',
    score: aiRisk * 0.4,
    weight: 0.4,
    details: `Humanness score: ${humannessScore.overall}%`,
    severity: aiRisk > 70 ? 'critical' : aiRisk > 50 ? 'high' : aiRisk > 30 ? 'medium' : 'low',
    isBlocking: aiRisk > 80,
  });

  // Compliance Risk (0-30 points)
  const complianceRisk = complianceResult.violations.length * 10;
  factors.push({
    category: 'compliance',
    name: 'Link Compliance Violations',
    score: Math.min(complianceRisk, 30),
    weight: 0.3,
    details: `${complianceResult.violations.length} blocked links found`,
    severity: complianceResult.violations.length > 2 ? 'critical' : complianceResult.violations.length > 0 ? 'high' : 'low',
    isBlocking: complianceResult.violations.length > 0,
  });

  // Quality Deficits (0-20 points)
  const qualityRisk = Math.max(0, 75 - qualityScores.overall) * 0.8;
  factors.push({
    category: 'quality',
    name: 'Quality Score Below Threshold',
    score: qualityRisk,
    weight: 0.2,
    details: `Quality: ${qualityScores.overall}% (threshold: 75%)`,
    severity: qualityScores.overall < 50 ? 'critical' : qualityScores.overall < 65 ? 'high' : qualityScores.overall < 75 ? 'medium' : 'low',
    isBlocking: qualityScores.overall < 50,
  });

  // Structural Issues (0-10 points)
  const structureRisk = calculateStructureRisk(article);
  factors.push({
    category: 'structure',
    name: 'Structural Completeness',
    score: structureRisk,
    weight: 0.1,
    details: getMissingStructureElements(article),
    severity: structureRisk > 7 ? 'high' : structureRisk > 4 ? 'medium' : 'low',
    isBlocking: false,
  });

  // Calculate aggregate
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const blockingIssues = factors.filter(f => f.isBlocking).map(f => f.name);

  return {
    level: totalScore < 25 ? 'LOW' : totalScore < 50 ? 'MEDIUM' : totalScore < 75 ? 'HIGH' : 'CRITICAL',
    score: totalScore,
    factors,
    blockingIssues,
    warnings: factors.filter(f => f.severity === 'medium').map(f => f.details),
    autoPublishEligible: totalScore < 30 && blockingIssues.length === 0,
    recommendations: generateRecommendations(factors),
  };
}
```

#### 5.2 Database Migration

```sql
-- 010_add_risk_assessment_fields.sql

ALTER TABLE articles ADD COLUMN risk_score INTEGER;
ALTER TABLE articles ADD COLUMN risk_level VARCHAR(20);
ALTER TABLE articles ADD COLUMN risk_factors JSONB;
ALTER TABLE articles ADD COLUMN auto_publish_eligible BOOLEAN DEFAULT false;

CREATE INDEX idx_articles_risk_level ON articles(tenant_id, risk_level);
```

#### 5.3 UI Components

**RiskLevelDisplay.tsx:**
```
┌─────────────────────────────────────────────┐
│  Risk Assessment                            │
├─────────────────────────────────────────────┤
│                                             │
│  Overall: MEDIUM ██████░░░░ 47%            │
│                                             │
│  ⚠️ Auto-publish: BLOCKED                  │
│                                             │
│  Risk Factors:                              │
│  ├─ AI Detection: ████░░░░░░ 35%           │
│  │  Humanness needs improvement            │
│  │                                          │
│  ├─ Compliance: ██████████ 0%              │
│  │  All links approved ✓                   │
│  │                                          │
│  ├─ Quality: ███░░░░░░░ 12%                │
│  │  Quality score: 72% (target: 75%)       │
│  │                                          │
│  └─ Structure: ░░░░░░░░░░ 0%               │
│     All sections present ✓                  │
│                                             │
│  Blocking Issues:                           │
│  • AI detection risk too high              │
│                                             │
│  Recommendations:                           │
│  • Run humanization with High mode         │
│  • Add more varied sentence structures     │
│                                             │
└─────────────────────────────────────────────┘
```

**RiskDashboard.tsx (for Analytics):**
```
┌─────────────────────────────────────────────────────────────┐
│  Risk Overview                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Distribution:                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  LOW: 45 ████████████████████                       │    │
│  │  MEDIUM: 23 ██████████                              │    │
│  │  HIGH: 8 ████                                       │    │
│  │  CRITICAL: 2 █                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Auto-Publish Eligible: 42 articles                         │
│  Requires Manual Review: 36 articles                        │
│                                                              │
│  Top Risk Factors This Week:                                │
│  1. AI Detection (avg 38%)                                  │
│  2. Quality Below Threshold (avg 15%)                       │
│  3. Missing Meta Descriptions (avg 8%)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 5.4 Integration Points

1. **ContentForge.tsx** - Calculate risk after generation
2. **ArticleEditor.tsx** - Display risk in sidebar
3. **KanbanBoard.tsx** - Show risk indicator on cards
4. **Auto-publish system** - Check eligibility before publishing
5. **Analytics.tsx** - Risk distribution charts

#### 5.5 Files to Create

| File | Description |
|------|-------------|
| `libs/core/quality/src/lib/risk-assessment.ts` | Core service |
| `apps/geteducated/src/app/components/RiskLevelDisplay.tsx` | Detailed view |
| `apps/geteducated/src/app/components/RiskBadge.tsx` | Compact indicator |
| `apps/geteducated/src/app/components/RiskDashboard.tsx` | Analytics view |
| `supabase/migrations/010_add_risk_assessment_fields.sql` | Schema update |

#### 5.6 Acceptance Criteria

- [ ] Risk calculated from 4 factor categories
- [ ] Risk level displayed on article cards
- [ ] Detailed breakdown in article editor
- [ ] Blocking issues prevent auto-publish
- [ ] Risk stored in database for reporting
- [ ] Analytics dashboard shows distribution
- [ ] Recommendations provided for improvement

---

## Implementation Order

### Week 1-2: Foundation
1. **Feature 1: StealthGPT UI** (lowest effort, highest impact)
   - Wire existing provider to UI
   - Add humanization controls
   - Display humanness scores

### Week 2-3: Compliance
2. **Feature 3: Link Compliance** (medium effort, critical for quality)
   - Create compliance service
   - Build domain rules UI
   - Integrate with editor

### Week 3-4: Linking
3. **Feature 2: Internal Linking** (high effort, core value)
   - Create linking service
   - Build catalog page
   - Create suggester component

### Week 4-5: Workflow
4. **Feature 4: Kanban Board** (high effort, UX improvement)
   - Install @dnd-kit
   - Create board components
   - Implement drag-drop

### Week 5-6: Risk
5. **Feature 5: Risk Assessment** (high effort, enables automation)
   - Create risk service
   - Add database fields
   - Build UI components

---

## Testing Requirements

### Unit Tests
- [ ] Relevance scoring algorithm
- [ ] Compliance checking logic
- [ ] Risk calculation formula
- [ ] Status transition validation

### Integration Tests
- [ ] StealthGPT API calls
- [ ] Internal link insertion
- [ ] Kanban drag-drop updates
- [ ] Risk assessment pipeline

### E2E Tests
- [ ] Full article workflow: Idea → Published
- [ ] Compliance blocking flow
- [ ] Auto-publish eligibility flow

---

*This document covers Tier 1 features. See `03-TIER-2-FEATURES.md` for Tier 2 specifications.*
