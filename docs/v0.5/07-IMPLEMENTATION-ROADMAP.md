# Meta Content Engine v0.5 - Implementation Roadmap

> **Document Version:** 1.0
> **Created:** December 10, 2024
> **Status:** READY FOR IMPLEMENTATION
> **Reference:** App A at `C:\Users\Disruptors\Documents\Disruptors Projects\perdiav5`

---

## Executive Summary

This roadmap provides the exact implementation steps derived from analyzing the production App A codebase. All clarifications have been answered, and we have complete technical specifications for each feature.

**Scope:** Tier 1 + Tier 2 features (10 total)
**Approach:** Iterative delivery in 3 phases

---

## Phase 1: Core Pipeline (Tier 1)

### 1.1 StealthGPT UI Integration

**Reference:** `perdiav5/src/services/ai/stealthGptClient.js`

**Current State in App B:**
- Provider exists at `libs/core/generation/src/lib/providers/stealthgpt.ts`
- Missing: UI controls, chunking refinement, detection-driven iteration

**Implementation Tasks:**

```
□ 1. Update StealthGPT provider with App A patterns:
   - Add detection-driven iteration loop (max 3 passes)
   - Implement 1200-char chunking (word boundary aware)
   - Add detection threshold check (target: <25%)
   - Implement double-pass mode option

□ 2. Create HumanizationPanel component:
   - Mode selector (Low/Medium/High)
   - Tone selector (Standard/HighSchool/College/PhD)
   - Business mode toggle
   - Before/after humanness score display
   - Detection score visualization

□ 3. Wire to ContentForge pipeline:
   - Add "Humanizing" stage visualization
   - Show progress during humanization
   - Display final detection score

□ 4. Add humanize button to ArticleEditor:
   - One-click humanization
   - Settings persistence per tenant
```

**App A Configuration to Match:**
```typescript
const defaultOptions = {
  tone: 'College',      // PhD for highest quality
  mode: 'High',         // Strongest bypass
  business: true,       // 10x more powerful
  detector: 'gptzero',
  rephrase: true,
  isMultilingual: false
};

const detectionThreshold = 25;  // Retry if above this
const maxIterations = 3;        // Max passes per chunk
const chunkSize = 1200;         // Characters per chunk
```

**Files to Create/Modify:**
| File | Action |
|------|--------|
| `libs/core/generation/src/lib/providers/stealthgpt.ts` | UPDATE |
| `apps/geteducated/src/app/components/HumanizationPanel.tsx` | CREATE |
| `apps/geteducated/src/app/components/HumannessScoreDisplay.tsx` | CREATE |
| `apps/geteducated/src/app/pages/ContentForge.tsx` | MODIFY |
| `apps/geteducated/src/app/pages/ArticleEditor.tsx` | MODIFY |

---

### 1.2 Internal Linking System

**Reference:** `perdiav5/src/components/article/InternalLinkSuggester.jsx`

**Current State in App B:**
- Database tables exist (`tenant_site_catalog`, `article_internal_links`)
- Missing: Service logic, UI component, relevance scoring

**Implementation Tasks:**

```
□ 1. Create internal-linking.ts service:
   - Relevance scoring algorithm (App A weights)
   - Link suggestion generation
   - Link insertion logic
   - Usage tracking

□ 2. Create InternalLinkSuggester component:
   - Display suggested links with scores
   - Search/filter functionality
   - One-click insertion
   - Auto-insert option
   - Current count vs. minimum display

□ 3. Create SiteCatalog page:
   - List all catalog entries
   - Import from WordPress REST API
   - Manual CSV upload
   - Search and filter

□ 4. Create sync-site-catalog edge function:
   - Fetch from WordPress REST API
   - Extract metadata (title, URL, excerpt, categories)
   - Upsert to tenant_site_catalog
   - Mark removed as inactive
```

**App A Relevance Scoring Algorithm:**
```typescript
function calculateRelevance(article: Article, catalogEntry: CatalogEntry): number {
  let score = 0;

  // Title word overlap: 10 points per word (3+ chars)
  const titleWords = article.title.split(/\s+/).filter(w => w.length > 3);
  titleWords.forEach(word => {
    if (catalogEntry.title.toLowerCase().includes(word.toLowerCase())) {
      score += 10;
    }
  });

  // Topic matches: 15 points per exact match, 10 if in title
  article.topics?.forEach(topic => {
    if (catalogEntry.topics?.includes(topic)) score += 15;
    if (catalogEntry.title.toLowerCase().includes(topic.toLowerCase())) score += 10;
  });

  // Focus keyword match: 25 points (highest weight)
  if (article.focusKeyword &&
      catalogEntry.title.toLowerCase().includes(article.focusKeyword.toLowerCase())) {
    score += 25;
  }

  // Under-linked bonus: 5 points if < 5 links
  if (catalogEntry.timesLinkedTo < 5) score += 5;

  return score;
}
```

**Files to Create:**
| File | Action |
|------|--------|
| `libs/core/generation/src/lib/internal-linking.ts` | CREATE |
| `apps/geteducated/src/app/components/InternalLinkSuggester.tsx` | CREATE |
| `apps/geteducated/src/app/pages/SiteCatalog.tsx` | CREATE |
| `supabase/functions/sync-site-catalog/index.ts` | CREATE |
| `libs/shared/hooks/src/lib/useSiteCatalog.ts` | CREATE |

---

### 1.3 Link Compliance Validation

**Reference:** `perdiav5/src/services/validation/linkValidator.js`

**Current State in App B:**
- Database table exists (`tenant_domain_rules`)
- SQL helper functions exist
- Missing: Service implementation, UI component

**Implementation Tasks:**

```
□ 1. Create link-compliance.ts service:
   - Domain matching logic
   - .edu blocking (except allowed school pages)
   - Competitor detection
   - Whitelist checking
   - Content link extraction

□ 2. Create LinkComplianceChecker component:
   - Real-time validation display
   - Blocking issues (red alerts)
   - Warnings (yellow)
   - Internal/external link counts
   - Issue details with suggestions

□ 3. Create DomainRulesSettings component:
   - Add/edit/delete blocked domains
   - Add/edit/delete allowed domains
   - Import/export rules

□ 4. Integrate with publishing flow:
   - Block publish if blocking issues exist
   - Warn but allow if only warnings
```

**App A Blocked Domains (GetEducated):**
```typescript
const BLOCKED_DOMAINS = [
  'usnews.com', 'niche.com', 'bestcolleges.com', 'collegechoice.net',
  'thebestschools.org', 'onlinecolleges.com', 'onlineu.com',
  'guidetoonlineschools.com', 'affordablecollegesonline.org',
  'collegeatlas.org', 'mydegreeguide.com', 'intelligent.com',
  'edumed.org', 'nursingprocess.org', 'accreditedschoolsonline.org',
  'master-ede.org', 'onlineschoolscenter.com'
];

const ALLOWED_EXTERNAL = [
  'bls.gov', 'stats.bls.gov', 'ed.gov', 'nces.ed.gov',
  'studentaid.gov', 'fafsa.gov', 'collegescorecard.ed.gov',
  'chea.org', 'aacsb.edu', 'abet.org', 'ccne-accreditation.org',
  'collegeboard.org', 'apa.org', 'nasw.org', 'nursingworld.org'
];
```

**Validation Result Structure:**
```typescript
interface ComplianceResult {
  isCompliant: boolean;        // No blocking issues
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  blockingIssues: ComplianceIssue[];  // .edu, competitors
  warnings: ComplianceIssue[];        // Non-whitelisted
  links: LinkValidation[];            // Per-link details
}
```

**Files to Create:**
| File | Action |
|------|--------|
| `libs/core/generation/src/lib/link-compliance.ts` | CREATE |
| `apps/geteducated/src/app/components/LinkComplianceChecker.tsx` | CREATE |
| `apps/geteducated/src/app/components/settings/DomainRulesSettings.tsx` | CREATE |

---

### 1.4 Kanban Workflow Board

**Reference:** App A Kanban implementation patterns

**Current State in App B:**
- Status workflow defined in types
- Articles page shows list view only
- Missing: Kanban board, drag-drop, cards

**Implementation Tasks:**

```
□ 1. Install @dnd-kit packages:
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

□ 2. Create KanbanBoard component:
   - 6 columns (Ideas, Drafting, Refinement, QA Review, Ready, Published)
   - Column headers with counts
   - Droppable zones
   - Virtualized rendering for performance

□ 3. Create ArticleCard component:
   - Title + Contributor + Quality Score + Risk Badge + Word Count
   - Left border color by risk level
   - Draggable
   - Click to open editor

□ 4. Create KanbanColumn component:
   - Drop zone styling
   - Empty state
   - Card list

□ 5. Implement drag-drop logic:
   - Status update on drop
   - Transition validation (can skip forward, not backward)
   - Trigger actions on certain transitions
   - Optimistic UI updates
```

**Kanban Configuration:**
```typescript
const KANBAN_COLUMNS = [
  { id: 'idea', title: 'Ideas', color: 'gray' },
  { id: 'drafting', title: 'Drafting', color: 'blue' },
  { id: 'humanizing', title: 'Refinement', color: 'purple' },
  { id: 'review', title: 'QA Review', color: 'orange' },
  { id: 'ready', title: 'Ready to Publish', color: 'green' },
  { id: 'published', title: 'Published', color: 'emerald' }
];

// Allowed transitions (can skip forward, not backward)
const ALLOWED_TRANSITIONS = {
  idea: ['drafting', 'humanizing', 'review', 'ready'],
  drafting: ['humanizing', 'review', 'ready'],
  humanizing: ['drafting', 'review', 'ready'],  // Can go back to drafting
  review: ['humanizing', 'ready'],              // Can go back to refinement
  ready: ['published', 'review'],               // Can go back to review
  published: []                                  // Cannot unpublish
};
```

**Files to Create:**
| File | Action |
|------|--------|
| `apps/geteducated/src/app/components/KanbanBoard.tsx` | CREATE |
| `apps/geteducated/src/app/components/KanbanColumn.tsx` | CREATE |
| `apps/geteducated/src/app/components/ArticleCard.tsx` | CREATE |
| `apps/geteducated/src/app/pages/Articles.tsx` | MODIFY (add toggle) |

---

### 1.5 Risk Assessment System

**Reference:** `perdiav5/src/services/validation/riskAssessment.js`

**Current State in App B:**
- Quality library has humanness scoring
- Missing: Risk assessment service, UI components, database fields

**Implementation Tasks:**

```
□ 1. Run database migration (010_add_risk_assessment_fields.sql)

□ 2. Create risk-assessment.ts service:
   - Risk level calculation (App A algorithm)
   - Issue weight system
   - Auto-publish eligibility check
   - Summary generation

□ 3. Create RiskLevelDisplay component:
   - Risk level badge with color/icon
   - Factor breakdown
   - Blocking issues display
   - Auto-publish eligibility indicator

□ 4. Create RiskBadge component (compact):
   - For Kanban cards and lists
   - Color-coded dot or badge

□ 5. Integrate with ContentForge:
   - Calculate risk after generation
   - Store in article record
   - Display in UI
```

**App A Risk Calculation:**
```typescript
const ISSUE_WEIGHTS = {
  // Blocking (100 points)
  blocked_link: 100,
  unauthorized_author: 100,

  // Major (15-80 points)
  missing_shortcode: 80,
  missing_internal_links: 25,
  missing_external_links: 20,
  word_count_low: 20,
  poor_readability: 15,
  weak_headings: 15,

  // Minor (5-10 points)
  missing_faqs: 10,
  external_link_warning: 5,
  missing_bls_citation: 10,
  keyword_density_issue: 5,
  word_count_high: 5
};

function calculateRiskLevel(riskScore: number, qualityScore: number, hasBlocking: boolean): RiskLevel {
  if (hasBlocking) return 'CRITICAL';
  if (riskScore >= 50 || qualityScore < 70) return 'HIGH';
  if (riskScore >= 20 || qualityScore < 85) return 'MEDIUM';
  return 'LOW';
}

// Auto-publish eligibility
const canAutoPublish = riskLevel === 'LOW' && qualityScore >= 80;
```

**Files to Create:**
| File | Action |
|------|--------|
| `supabase/migrations/010_add_risk_assessment_fields.sql` | CREATE |
| `libs/core/quality/src/lib/risk-assessment.ts` | CREATE |
| `apps/geteducated/src/app/components/RiskLevelDisplay.tsx` | CREATE |
| `apps/geteducated/src/app/components/RiskBadge.tsx` | CREATE |

---

## Phase 2: Automation (Tier 2)

### 2.1 Auto-Publish Scheduling

**Implementation Tasks:**
```
□ 1. Run migration 015_add_auto_publish_config.sql
□ 2. Create auto-publish.ts service
□ 3. Create SchedulePublishModal component
□ 4. Create ScheduledArticlesView component
□ 5. Create process-scheduled edge function
□ 6. Add auto-publish settings to Settings page
```

**Key Configuration:**
- Default: 3 days after ready
- Minimum quality: 80
- Maximum risk: LOW only for auto-publish
- Publish window: 9 AM EST, weekdays only

---

### 2.2 Content Ideas Management

**Implementation Tasks:**
```
□ 1. Create useContentIdeas hook
□ 2. Create ContentIdeas page
□ 3. Create CreateIdeaModal component
□ 4. Create IdeaCard component
□ 5. Implement approval workflow
□ 6. Implement idea-to-article conversion
□ 7. Add bulk operations
```

---

### 2.3 Generation Queue

**Implementation Tasks:**
```
□ 1. Run migration 012_add_generation_queue_table.sql
□ 2. Create useGenerationQueue hook
□ 3. Create Automation page (queue view)
□ 4. Create QueueStats component
□ 5. Create QueueList component
□ 6. Create process-queue edge function
□ 7. Implement retry logic with backoff
```

**Queue Settings:**
- Max concurrent per tenant: 3
- Platform-wide limit: 10
- Retries: 3 with exponential backoff (1m, 5m, 15m)

---

### 2.4 Monetization System

**Implementation Tasks:**
```
□ 1. Create monetization.ts service
□ 2. Create ShortcodeInspector component
□ 3. Create MonetizationPreview component
□ 4. Create MonetizationSettings component
□ 5. Integrate with generation pipeline
□ 6. Add category management UI
```

**Shortcode Formats:**
- `[degree_table subject="X" level="Y"]`
- `[degree_offer school_id="X"]`
- `[program_card program_id="X"]`
- `[cta_banner category="X"]`

---

### 2.5 Quality Pipeline Integration

**Implementation Tasks:**
```
□ 1. Create QualityScoreBreakdown component
□ 2. Wire quality library to ContentForge
□ 3. Add quality check stage to pipeline
□ 4. Implement auto-fix loop (max 3 Claude passes)
□ 5. Add quality threshold enforcement
```

**Quality Metrics (10 total):**
1. Word count (800-2500)
2. Internal links (min 3)
3. External links (min 1)
4. FAQ schema (if required)
5. BLS citation (if required)
6. Heading count (min 3)
7. Images (min 1)
8. Image alt text
9. Keyword density (0.5-2.5%)
10. Readability (Flesch 60-80)

---

## Phase 3: Polish (Tier 3)

### 3.1 WordPress Publishing UI
- Connection management in Settings
- Publish button in ArticleEditor
- Category/tag sync
- Post status sync

### 3.2 Analytics Real Data
- Replace mock data with Supabase queries
- Article metrics from `articles` table
- AI usage from `ai_usage` table
- Contributor stats

### 3.3 Settings Persistence
- Wire all settings sections to tenant_settings
- General, Brand, Automation, Quality settings

### 3.4 Editor Sidebar Components
- Quality Metrics checklist
- SEO Preview
- Schema Generator
- BLS Citation Helper
- Article Navigation/TOC

---

## Implementation Checklist Summary

### Phase 1 Files to Create (17 files)

**Services/Libraries:**
- [ ] `libs/core/generation/src/lib/internal-linking.ts`
- [ ] `libs/core/generation/src/lib/link-compliance.ts`
- [ ] `libs/core/quality/src/lib/risk-assessment.ts`

**UI Components:**
- [ ] `apps/geteducated/src/app/components/HumanizationPanel.tsx`
- [ ] `apps/geteducated/src/app/components/HumannessScoreDisplay.tsx`
- [ ] `apps/geteducated/src/app/components/InternalLinkSuggester.tsx`
- [ ] `apps/geteducated/src/app/components/LinkComplianceChecker.tsx`
- [ ] `apps/geteducated/src/app/components/KanbanBoard.tsx`
- [ ] `apps/geteducated/src/app/components/KanbanColumn.tsx`
- [ ] `apps/geteducated/src/app/components/ArticleCard.tsx`
- [ ] `apps/geteducated/src/app/components/RiskLevelDisplay.tsx`
- [ ] `apps/geteducated/src/app/components/RiskBadge.tsx`
- [ ] `apps/geteducated/src/app/components/settings/DomainRulesSettings.tsx`

**Pages:**
- [ ] `apps/geteducated/src/app/pages/SiteCatalog.tsx`

**Edge Functions:**
- [ ] `supabase/functions/sync-site-catalog/index.ts`

**Hooks:**
- [ ] `libs/shared/hooks/src/lib/useSiteCatalog.ts`

**Migrations:**
- [ ] `supabase/migrations/010_add_risk_assessment_fields.sql`

### Files to Modify (4 files)
- [ ] `libs/core/generation/src/lib/providers/stealthgpt.ts`
- [ ] `apps/geteducated/src/app/pages/ContentForge.tsx`
- [ ] `apps/geteducated/src/app/pages/ArticleEditor.tsx`
- [ ] `apps/geteducated/src/app/pages/Articles.tsx`

### Dependencies to Install
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Articles can be humanized via UI with StealthGPT
- [ ] Humanness score displayed before/after
- [ ] Internal links suggested based on relevance
- [ ] Site catalog populated from WordPress
- [ ] Link compliance validates all content
- [ ] Blocked domains prevent publishing
- [ ] Kanban board displays articles by status
- [ ] Drag-drop updates article status
- [ ] Risk levels calculated and displayed
- [ ] Auto-publish eligibility determined

### Phase 2 Complete When:
- [ ] Articles auto-publish on schedule
- [ ] Content ideas managed through UI
- [ ] Generation queue processes reliably
- [ ] Monetization shortcodes inserted
- [ ] Quality scores drive publish decisions

### Phase 3 Complete When:
- [ ] WordPress publishing via UI
- [ ] Analytics show real data
- [ ] All settings persist correctly
- [ ] Editor has full sidebar tools

---

## Ready to Start

All specifications complete. Begin with **Phase 1, Task 1.1: StealthGPT UI Integration** as it has the lowest effort and highest immediate impact.

---

*Document complete. Implementation can begin immediately.*
