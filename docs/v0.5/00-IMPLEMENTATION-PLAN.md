# Meta Content Engine v0.5 - Implementation Plan

> **Document Version:** 1.1
> **Created:** December 10, 2024
> **Last Updated:** December 10, 2024
> **Status:** ✅ READY FOR IMPLEMENTATION

---

## ⚠️ CRITICAL: Run Security Fix First

Before implementing any features, run **Migration 016** to fix multi-tenant isolation in junction tables. See `08-MULTI-TENANT-ARCHITECTURE.md` for details.

```bash
# Run this migration FIRST
supabase migration up 016_fix_junction_table_isolation
```

---

## Executive Summary

This document outlines the comprehensive implementation plan to bring the Meta Content Engine (Perdia) from its current state to feature parity with the reference implementation ("App A"). The work is organized into 4 priority tiers with 22 features total.

**Reference Implementation:** `C:\Users\Disruptors\Documents\Disruptors Projects\perdiav5`

### Current State Assessment

| Category | Status |
|----------|--------|
| Database Schema | 95% complete - comprehensive multi-tenant design (security fix needed) |
| Edge Functions | 40% complete - core generation works, missing automation |
| UI Components | 35% complete - beautiful shell, missing feature UIs |
| Business Logic | 25% complete - libraries exist, not wired together |
| Integration Points | 20% complete - types defined, APIs not connected |

### Target State

A fully-functional content generation platform with:
- AI-powered content generation with humanization
- Automated workflow management (Kanban + auto-publish)
- Internal linking intelligence
- Quality assurance with risk assessment
- Monetization integration
- Real-time analytics

---

## Implementation Tiers

### Tier 1 - Critical (Blocks Core Functionality)

| # | Feature | Current State | Effort |
|---|---------|---------------|--------|
| 1 | StealthGPT Provider | 90% - Provider exists, needs UI | Low |
| 2 | Internal Linking System | 30% - Schema only | High |
| 3 | Link Compliance Validation | 40% - DB functions exist | Medium |
| 4 | Kanban Workflow Board | 10% - Status defined only | High |
| 5 | Risk Assessment System | 5% - Concept only | High |

### Tier 2 - High Priority (Major Features)

| # | Feature | Current State | Effort |
|---|---------|---------------|--------|
| 6 | Auto-Publish Scheduling | 20% - Schema exists | Medium |
| 7 | Content Ideas Management UI | 30% - DB complete | Medium |
| 8 | Keyword Research & DataForSEO | 15% - Fields exist | High |
| 9 | Generation Queue Management | 10% - Sync only | High |
| 10 | Monetization System | 25% - Schema exists | High |

### Tier 3 - Medium Priority (Important but Can Ship Without)

| # | Feature | Current State | Effort |
|---|---------|---------------|--------|
| 11 | Quality Assurance Integration | 70% - Library complete | Low |
| 12 | WordPress Publishing UI | 60% - Service complete | Medium |
| 13 | Contributor Assignment Scoring | 30% - Basic only | Medium |
| 14 | Settings Persistence | 40% - API keys work | Medium |
| 15 | Analytics Dashboard (Real Data) | 20% - UI exists | Medium |

### Tier 4 - Lower Priority (Polish)

| # | Feature | Current State | Effort |
|---|---------|---------------|--------|
| 16 | AI Generation Pipeline (Async) | 50% - Sync works | Medium |
| 17 | Missing Editor Sidebar Components | 15% - Basic only | High |
| 18 | Revision Tracking & AI Training | 0% - Not started | Medium |
| 19 | Comment System | 0% - Not started | Medium |
| 20 | Pre-Publish Validation | 10% - Partial | Medium |
| 21 | Site Catalog Management | 30% - Schema exists | Medium |
| 22 | Help/Tutorial System | 0% - Not started | Low |

---

## Detailed Implementation Specifications

### Phase 1: Core Pipeline Completion (Tier 1)

#### 1.1 StealthGPT UI Integration
**Status:** Provider implemented, needs UI wiring

**Implementation Tasks:**
1. Add "Humanize" button to ArticleEditor toolbar
2. Create HumanizationPanel component for ContentForge
3. Wire StealthGPT provider to pipeline stage UI
4. Add humanization progress indicator
5. Display humanness score before/after comparison

**Files to Create/Modify:**
- `apps/geteducated/src/app/pages/ArticleEditor.tsx` - Add humanize button
- `apps/geteducated/src/app/components/HumanizationPanel.tsx` - New component
- `apps/geteducated/src/app/pages/ContentForge.tsx` - Wire humanization stage

**Dependencies:** None (provider already exists)

---

#### 1.2 Internal Linking System
**Status:** Database schema exists, needs full implementation

**Implementation Tasks:**
1. Create `InternalLinkSuggester` component
2. Implement relevance scoring algorithm
3. Create site catalog management page
4. Add link insertion during generation
5. Build catalog sync service
6. Add link count tracking

**Relevance Scoring Algorithm:**
```typescript
interface RelevanceScore {
  titleOverlap: number;      // 0-40 points (word overlap)
  topicMatch: number;        // 0-30 points (topic array intersection)
  keywordMatch: number;      // 0-20 points (keyword array intersection)
  recencyBonus: number;      // 0-10 points (newer content preferred)
  linkEquityPenalty: number; // -20 to 0 (already heavily linked)
}
// Total: 0-100 score, threshold for suggestion: 60+
```

**Files to Create:**
- `libs/core/generation/src/lib/internal-linking.ts` - Core service
- `apps/geteducated/src/app/components/InternalLinkSuggester.tsx`
- `apps/geteducated/src/app/pages/SiteCatalog.tsx`
- `supabase/functions/sync-site-catalog/index.ts`

**Database:** Already exists (`tenant_site_catalog`, `article_internal_links`)

---

#### 1.3 Link Compliance Validation
**Status:** DB functions exist, needs UI and real-time validation

**Implementation Tasks:**
1. Create `LinkComplianceChecker` component
2. Wire to real-time content scanning
3. Build domain rules management UI in Settings
4. Add pre-publish validation step
5. Create compliance report view

**Compliance Rules Engine:**
```typescript
interface ComplianceResult {
  isCompliant: boolean;
  violations: {
    domain: string;
    ruleType: 'blocked' | 'competitor' | 'edu_restricted';
    severity: 'error' | 'warning';
    suggestion: string | null;
  }[];
  allowedLinks: string[];
  blockedCount: number;
}
```

**Files to Create:**
- `libs/core/generation/src/lib/link-compliance.ts`
- `apps/geteducated/src/app/components/LinkComplianceChecker.tsx`
- `apps/geteducated/src/app/components/settings/DomainRulesSettings.tsx`

---

#### 1.4 Kanban Workflow Board
**Status:** Not implemented, only status badges exist

**Implementation Tasks:**
1. Install @dnd-kit packages
2. Create KanbanBoard component with 6 columns
3. Create ArticleCard component for board
4. Implement drag-and-drop status updates
5. Add board/list view toggle to Articles page
6. Wire status changes to database

**Kanban Columns:**
```typescript
const WORKFLOW_COLUMNS = [
  { id: 'idea', title: 'Ideas', color: 'gray' },
  { id: 'drafting', title: 'Drafting', color: 'blue' },
  { id: 'humanizing', title: 'Refinement', color: 'purple' },
  { id: 'review', title: 'QA Review', color: 'orange' },
  { id: 'ready', title: 'Ready to Publish', color: 'green' },
  { id: 'published', title: 'Published', color: 'emerald' }
];
```

**Files to Create:**
- `apps/geteducated/src/app/components/KanbanBoard.tsx`
- `apps/geteducated/src/app/components/ArticleCard.tsx`
- `apps/geteducated/src/app/components/KanbanColumn.tsx`

**Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

---

#### 1.5 Risk Assessment System
**Status:** Concept only, needs full implementation

**Implementation Tasks:**
1. Create RiskAssessmentService
2. Define risk scoring algorithm
3. Create RiskLevelDisplay component
4. Integrate with quality scoring
5. Add risk-based publishing blocks
6. Build risk dashboard

**Risk Scoring Algorithm:**
```typescript
interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  factors: {
    aiDetectionRisk: number;      // 0-40 (humanness inverse)
    complianceViolations: number; // 0-30 (blocked links)
    qualityDeficits: number;      // 0-20 (below thresholds)
    structuralIssues: number;     // 0-10 (missing sections)
  };
  blockingIssues: string[];
  autoPublishEligible: boolean;
}

// Thresholds:
// LOW: 0-25, MEDIUM: 26-50, HIGH: 51-75, CRITICAL: 76-100
// Auto-publish eligible: score < 30 AND no blocking issues
```

**Files to Create:**
- `libs/core/quality/src/lib/risk-assessment.ts`
- `apps/geteducated/src/app/components/RiskLevelDisplay.tsx`
- `apps/geteducated/src/app/components/RiskDashboard.tsx`

---

### Phase 2: Automation Features (Tier 2)

#### 2.1 Auto-Publish Scheduling
**Implementation Tasks:**
1. Create scheduling UI (calendar picker)
2. Build auto-publish edge function
3. Implement deadline calculation
4. Add human review override
5. Create scheduled articles queue view
6. Build notification system

**Auto-Publish Rules:**
```typescript
interface AutoPublishConfig {
  enabled: boolean;
  defaultDaysAfterReady: number;      // e.g., 3 days
  requireHumanReview: boolean;
  minimumQualityScore: number;        // e.g., 75
  maximumRiskLevel: 'LOW' | 'MEDIUM'; // Block HIGH/CRITICAL
  notifyBeforePublish: boolean;
  notifyHoursBeforePublish: number;   // e.g., 24 hours
}
```

---

#### 2.2 Content Ideas Management UI
**Implementation Tasks:**
1. Create ContentIdeas page
2. Build idea creation modal
3. Implement approval workflow UI
4. Add bulk operations
5. Create idea-to-article conversion
6. Build filtering and search

---

#### 2.3 Keyword Research & DataForSEO Integration
**Implementation Tasks:**
1. Create DataForSEO API client
2. Build keyword research page
3. Implement batch keyword lookup
4. Add keyword starring/favorites
5. Create topic clustering
6. Build gap analysis tool

---

#### 2.4 Generation Queue Management
**Implementation Tasks:**
1. Create queue data structure
2. Build queue management UI
3. Implement priority ordering
4. Add retry logic with backoff
5. Create queue statistics dashboard
6. Implement concurrent processing limits

---

#### 2.5 Monetization System
**Implementation Tasks:**
1. Create MonetizationEngine service
2. Build shortcode templating
3. Implement category matching
4. Create Shortcode Inspector
5. Build Monetization Preview
6. Add revenue tracking

---

### Phase 3: Integration & Polish (Tiers 3-4)

See `03-TIER-3-4-FEATURES.md` for detailed specifications.

---

## Database Migrations Required

### New Migrations Needed

```sql
-- 010_add_risk_assessment_fields.sql
ALTER TABLE articles ADD COLUMN risk_score INTEGER;
ALTER TABLE articles ADD COLUMN risk_level VARCHAR(20);
ALTER TABLE articles ADD COLUMN risk_factors JSONB;
ALTER TABLE articles ADD COLUMN auto_publish_eligible BOOLEAN DEFAULT false;

-- 011_add_keyword_research_tables.sql
CREATE TABLE keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  keyword VARCHAR(500) NOT NULL,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc DECIMAL(10,2),
  competition VARCHAR(20),
  trend_data JSONB,
  is_starred BOOLEAN DEFAULT false,
  cluster_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 012_add_generation_queue_table.sql
CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  content_idea_id UUID REFERENCES content_ideas(id),
  priority INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 013_add_revision_tracking.sql
CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id),
  revision_number INTEGER NOT NULL,
  content_before TEXT,
  content_after TEXT,
  change_type VARCHAR(50),
  change_reason TEXT,
  changed_by UUID,
  include_in_training BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 014_add_article_comments.sql
CREATE TABLE article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id),
  selection_start INTEGER,
  selection_end INTEGER,
  selected_text TEXT,
  comment_text TEXT NOT NULL,
  category VARCHAR(50),
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  created_by UUID,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

---

## Technical Dependencies

### New NPM Packages Required

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

### External API Integrations

| Service | Purpose | Priority |
|---------|---------|----------|
| StealthGPT | AI humanization | Tier 1 (exists) |
| DataForSEO | Keyword research | Tier 2 |
| Google Analytics | Traffic metrics | Tier 3 |
| BLS API | Citation data | Tier 3 |

---

## Testing Strategy

### Unit Tests Required
- Risk scoring algorithm
- Relevance scoring algorithm
- Link compliance checker
- Monetization shortcode generator
- Auto-publish eligibility checker

### Integration Tests Required
- Full generation pipeline (idea → published)
- Kanban drag-and-drop workflow
- WordPress publish flow
- Internal link insertion
- Queue processing

### E2E Tests Required
- Complete article creation workflow
- Settings persistence
- Analytics data display
- Multi-tenant isolation

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| StealthGPT API rate limits | Implement chunking, retries |
| DataForSEO costs | Cache results, batch requests |
| Queue reliability | Dead letter queue, monitoring |
| Performance with large catalogs | Pagination, indexing |

### Business Risks

| Risk | Mitigation |
|------|------------|
| AI detection evolves | Regular StealthGPT updates |
| SEO algorithm changes | Flexible scoring weights |
| Compliance requirements | Configurable rules per tenant |

---

## Success Metrics

### Phase 1 Completion Criteria
- [ ] Articles can be humanized via UI
- [ ] Internal links suggested and inserted
- [ ] Link compliance validated pre-publish
- [ ] Kanban board functional
- [ ] Risk levels displayed on articles

### Phase 2 Completion Criteria
- [ ] Articles auto-publish on schedule
- [ ] Content ideas managed through UI
- [ ] Keywords researched via DataForSEO
- [ ] Generation queue processes reliably
- [ ] Monetization shortcodes inserted

### Phase 3 Completion Criteria
- [ ] Quality scores drive decisions
- [ ] WordPress publishing via UI
- [ ] Analytics show real data
- [ ] Settings persist correctly
- [ ] Revisions tracked

---

## Document Index

| Document | Description |
|----------|-------------|
| `00-IMPLEMENTATION-PLAN.md` | This document - master plan |
| `01-ARCHITECTURE-OVERVIEW.md` | System architecture and data flow |
| `02-TIER-1-FEATURES.md` | Critical feature specifications |
| `03-TIER-2-FEATURES.md` | High priority feature specifications |
| `04-TIER-3-4-FEATURES.md` | Medium/low priority specifications |
| `05-DATABASE-MIGRATIONS.md` | All required schema changes |
| `06-CLARIFICATIONS-AND-QUESTIONS.md` | ✅ All questions answered |
| `07-IMPLEMENTATION-ROADMAP.md` | Exact implementation steps from App A |
| `08-MULTI-TENANT-ARCHITECTURE.md` | **CRITICAL** - Tenant isolation, security fix |

---

## Next Steps

1. ~~Review this plan and provide feedback~~ ✅ Done
2. ~~Answer clarification questions~~ ✅ All answered
3. **Run Migration 016** to fix junction table security vulnerability
4. **Begin Phase 1 implementation** starting with StealthGPT UI wiring
5. Follow `07-IMPLEMENTATION-ROADMAP.md` for exact patterns from App A

---

*This document will be updated as implementation progresses and clarifications are received.*
