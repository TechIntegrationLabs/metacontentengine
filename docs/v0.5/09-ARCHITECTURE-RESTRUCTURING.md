# Architecture Restructuring Plan

> **Created:** December 10, 2024
> **Purpose:** Correct architectural misalignment and establish proper shared/core/app structure

## Executive Summary

During implementation of Tier 2-4 features, UI components were incorrectly placed in `apps/geteducated/src/app/components/` instead of `libs/shared/ui/`. This document outlines the restructuring needed to ensure all tenant apps can reuse these components.

---

## Current State Analysis

### What Exists in libs/shared/ui/ (CORRECT - Keep)

```
libs/shared/ui/src/lib/
├── primitives/
│   ├── Button.tsx          # 5 variants, 4 sizes, loading state
│   ├── Input.tsx           # Label, error, icons
│   └── Textarea.tsx        # Label, error, char count
├── components/
│   ├── GlassCard.tsx       # 3 variants, hover animations
│   ├── StatCard.tsx        # Dashboard metric cards
│   └── PipelineVisualizer.tsx  # 6-stage pipeline UI
├── layout/
│   ├── AppLayout.tsx       # Sidebar + main layout
│   └── Sidebar.tsx         # Collapsible navigation
├── feedback/
│   └── KineticLoader.tsx   # Animated progress bar
└── index.ts                # Barrel exports
```

### What Exists in apps/geteducated/components/ (NEEDS MOVING)

```
apps/geteducated/src/app/components/
├── kanban/                 # MOVE → libs/shared/ui/workflow/
│   ├── KanbanBoard.tsx     # Drag-drop workflow board
│   ├── KanbanColumn.tsx    # Droppable column
│   ├── ArticleCard.tsx     # Draggable article card
│   └── index.ts
├── quality/                # MOVE → libs/shared/ui/quality/
│   ├── QualityPanel.tsx    # Main quality analysis UI
│   ├── QualityScoreGauge.tsx   # Circular score gauge
│   ├── QualityMetricCard.tsx   # Individual metric card
│   ├── QualityIssuesList.tsx   # Issues with auto-fix
│   ├── RiskAssessmentBadge.tsx # Risk level badge
│   └── index.ts
├── publishing/             # MOVE → libs/shared/ui/publishing/
│   ├── WebhookConfigForm.tsx   # Webhook configuration
│   ├── PublishButton.tsx       # Publish with dropdown
│   ├── PublishHistoryLog.tsx   # Publish history table
│   └── index.ts
├── ideas/                  # MOVE → libs/shared/ui/ideas/
│   ├── IdeasBoard.tsx      # Content ideas management
│   ├── IdeaCard.tsx        # Single idea card
│   ├── IdeaForm.tsx        # Create/edit form
│   └── index.ts
├── keywords/               # MOVE → libs/shared/ui/keywords/
│   ├── KeywordRow.tsx      # Table row component
│   ├── KeywordClusterCard.tsx  # Cluster stats card
│   ├── KeywordLookupPanel.tsx  # Lookup/import UI
│   └── index.ts
├── monetization/           # MOVE → libs/shared/ui/monetization/
│   ├── ShortcodeInspector.tsx  # Shortcode management
│   ├── ShortcodeSlotCard.tsx   # Individual shortcode
│   └── index.ts
├── queue/                  # MOVE → libs/shared/ui/queue/
│   ├── GenerationQueue.tsx     # Queue management UI
│   ├── QueueItemCard.tsx       # Single queue item
│   ├── QueueStatsCard.tsx      # Queue statistics
│   └── index.ts
├── article/                # PARTIAL MOVE
│   ├── InternalLinkSuggester.tsx  # MOVE → libs/shared/ui/linking/
│   ├── ScheduledArticlesQueue.tsx # KEEP (page-specific)
│   ├── LinkComplianceChecker.tsx  # KEEP (page-specific)
│   └── RiskLevelDisplay.tsx       # KEEP (page-specific)
└── settings/               # KEEP (tenant-specific configuration)
    ├── AutoPublishSettings.tsx
    └── DomainRulesSettings.tsx
```

---

## Target Architecture

### libs/shared/ui/ Structure (After Restructuring)

```
libs/shared/ui/src/lib/
├── primitives/             # Base form controls
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Textarea.tsx
├── components/             # General composed components
│   ├── GlassCard.tsx
│   ├── StatCard.tsx
│   └── PipelineVisualizer.tsx
├── layout/                 # App layout components
│   ├── AppLayout.tsx
│   └── Sidebar.tsx
├── feedback/               # Loading/progress indicators
│   └── KineticLoader.tsx
├── workflow/               # NEW: Kanban and workflow
│   ├── KanbanBoard.tsx
│   ├── KanbanColumn.tsx
│   └── ArticleCard.tsx
├── quality/                # NEW: Quality analysis
│   ├── QualityPanel.tsx
│   ├── QualityScoreGauge.tsx
│   ├── QualityMetricCard.tsx
│   ├── QualityIssuesList.tsx
│   └── RiskAssessmentBadge.tsx
├── publishing/             # NEW: Publishing UI
│   ├── WebhookConfigForm.tsx
│   ├── PublishButton.tsx
│   └── PublishHistoryLog.tsx
├── ideas/                  # NEW: Content ideas
│   ├── IdeasBoard.tsx
│   ├── IdeaCard.tsx
│   └── IdeaForm.tsx
├── keywords/               # NEW: Keyword research
│   ├── KeywordRow.tsx
│   ├── KeywordClusterCard.tsx
│   └── KeywordLookupPanel.tsx
├── monetization/           # NEW: Monetization
│   ├── ShortcodeInspector.tsx
│   └── ShortcodeSlotCard.tsx
├── queue/                  # NEW: Generation queue
│   ├── GenerationQueue.tsx
│   ├── QueueItemCard.tsx
│   └── QueueStatsCard.tsx
├── linking/                # NEW: Internal linking
│   └── InternalLinkSuggester.tsx
└── index.ts                # Updated exports
```

### apps/geteducated/ Structure (After Restructuring)

```
apps/geteducated/src/app/
├── components/             # App-specific only
│   ├── article/
│   │   ├── ScheduledArticlesQueue.tsx  # Page-specific
│   │   ├── LinkComplianceChecker.tsx   # Page-specific
│   │   └── RiskLevelDisplay.tsx        # Page-specific
│   └── settings/
│       ├── AutoPublishSettings.tsx     # Tenant config
│       └── DomainRulesSettings.tsx     # Tenant config
└── pages/                  # Page components (stay here)
    ├── Dashboard.tsx
    ├── Articles.tsx
    ├── ArticleEditor.tsx
    ├── ContentForge.tsx
    ├── Contributors.tsx
    ├── KeywordResearch.tsx
    ├── Analytics.tsx
    ├── Settings.tsx
    └── MagicSetup.tsx
```

---

## Migration Steps

### Phase 1: Move Components (20 files)

| Source | Destination | Files |
|--------|-------------|-------|
| `apps/.../components/kanban/` | `libs/shared/ui/src/lib/workflow/` | 3 |
| `apps/.../components/quality/` | `libs/shared/ui/src/lib/quality/` | 5 |
| `apps/.../components/publishing/` | `libs/shared/ui/src/lib/publishing/` | 3 |
| `apps/.../components/ideas/` | `libs/shared/ui/src/lib/ideas/` | 3 |
| `apps/.../components/keywords/` | `libs/shared/ui/src/lib/keywords/` | 3 |
| `apps/.../components/monetization/` | `libs/shared/ui/src/lib/monetization/` | 2 |
| `apps/.../components/queue/` | `libs/shared/ui/src/lib/queue/` | 3 |
| `apps/.../components/article/InternalLinkSuggester.tsx` | `libs/shared/ui/src/lib/linking/` | 1 |

**Total: 23 files to move**

### Phase 2: Update Exports

Update `libs/shared/ui/src/index.ts`:

```typescript
// Existing exports
export { Button } from './lib/primitives/Button';
export { Input } from './lib/primitives/Input';
export { Textarea } from './lib/primitives/Textarea';
export { GlassCard } from './lib/components/GlassCard';
export { StatCard } from './lib/components/StatCard';
export { PipelineVisualizer, PipelineStage } from './lib/components/PipelineVisualizer';
export { Sidebar } from './lib/layout/Sidebar';
export { AppLayout } from './lib/layout/AppLayout';
export { KineticLoader } from './lib/feedback/KineticLoader';

// NEW: Workflow components
export { KanbanBoard } from './lib/workflow/KanbanBoard';
export { KanbanColumn } from './lib/workflow/KanbanColumn';
export { ArticleCard } from './lib/workflow/ArticleCard';

// NEW: Quality components
export { QualityPanel } from './lib/quality/QualityPanel';
export { QualityScoreGauge } from './lib/quality/QualityScoreGauge';
export { QualityMetricCard } from './lib/quality/QualityMetricCard';
export { QualityIssuesList } from './lib/quality/QualityIssuesList';
export { RiskAssessmentBadge, RiskAssessmentDetail } from './lib/quality/RiskAssessmentBadge';
export type { QualityIssue, AutoFixSuggestion, RiskLevel, RiskFactors, BlockingIssue } from './lib/quality';

// NEW: Publishing components
export { WebhookConfigForm } from './lib/publishing/WebhookConfigForm';
export { PublishButton } from './lib/publishing/PublishButton';
export { PublishHistoryLog } from './lib/publishing/PublishHistoryLog';
export type { WebhookConfig, PublishStatus, PublishLogEntry } from './lib/publishing';

// NEW: Ideas components
export { IdeasBoard } from './lib/ideas/IdeasBoard';
export { IdeaCard } from './lib/ideas/IdeaCard';
export { IdeaForm } from './lib/ideas/IdeaForm';

// NEW: Keywords components
export { KeywordRow } from './lib/keywords/KeywordRow';
export { KeywordClusterCard } from './lib/keywords/KeywordClusterCard';
export { KeywordLookupPanel } from './lib/keywords/KeywordLookupPanel';
export type { KeywordData, KeywordCluster } from './lib/keywords';

// NEW: Monetization components
export { ShortcodeInspector } from './lib/monetization/ShortcodeInspector';
export { ShortcodeSlotCard } from './lib/monetization/ShortcodeSlotCard';

// NEW: Queue components
export { GenerationQueue } from './lib/queue/GenerationQueue';
export { QueueItemCard } from './lib/queue/QueueItemCard';
export { QueueStatsCard } from './lib/queue/QueueStatsCard';

// NEW: Linking components
export { InternalLinkSuggester } from './lib/linking/InternalLinkSuggester';
```

### Phase 3: Update Imports in geteducated

**Before:**
```typescript
import { KanbanBoard } from '../components/kanban';
import { QualityPanel } from '../components/quality';
```

**After:**
```typescript
import { KanbanBoard, QualityPanel } from '@content-engine/ui';
```

### Phase 4: Clean Up

1. Delete empty component directories from `apps/geteducated/src/app/components/`
2. Keep only:
   - `article/ScheduledArticlesQueue.tsx`
   - `article/LinkComplianceChecker.tsx`
   - `article/RiskLevelDisplay.tsx`
   - `settings/AutoPublishSettings.tsx`
   - `settings/DomainRulesSettings.tsx`

---

## Remaining Feature Implementation

After restructuring, implement remaining features IN THE CORRECT LOCATIONS:

### Tier 3 Features (libs/core/ + libs/shared/ui/)

| Feature | Service Location | UI Location |
|---------|------------------|-------------|
| Contributor Scoring | `libs/core/generation/` | `libs/shared/ui/contributors/` |
| Settings Persistence | `libs/shared/hooks/useSettings.ts` | Already in Settings page |
| Analytics Real Data | `libs/shared/hooks/useAnalytics.ts` | `libs/shared/ui/analytics/` |

### Tier 4 Features (libs/core/ + libs/shared/ui/)

| Feature | Service Location | UI Location |
|---------|------------------|-------------|
| Editor Sidebar | N/A | `libs/shared/ui/editor/` |
| Revision Tracking | `libs/core/publishing/revisions.ts` | `libs/shared/ui/revisions/` |
| Comment System | `libs/core/publishing/comments.ts` | `libs/shared/ui/comments/` |
| Pre-Publish Validation | `libs/core/quality/validation.ts` | `libs/shared/ui/validation/` |
| Site Catalog | Already exists in `libs/core/generation/` | `libs/shared/ui/catalog/` |
| Help System | N/A | `libs/shared/ui/help/` |

---

## Architecture Principles (Going Forward)

### Where to Put New Code

1. **libs/shared/ui/** - Reusable React components that any tenant can use
   - Design-system compliant (glass-card, void colors)
   - No tenant-specific business logic
   - Generic props, not hardcoded values

2. **libs/shared/hooks/** - Reusable React hooks
   - Data fetching hooks
   - Context providers
   - Utility hooks

3. **libs/shared/types/** - TypeScript definitions
   - Interface definitions
   - Type unions and enums
   - Shared across all libraries

4. **libs/core/generation/** - Content generation services
   - AI providers
   - Pipeline logic
   - Voice analysis

5. **libs/core/quality/** - Quality analysis
   - Scoring algorithms
   - Risk assessment
   - Compliance checking

6. **libs/core/publishing/** - Publishing services
   - WordPress integration
   - Webhook publishing
   - Auto-publish scheduling

7. **apps/{tenant}/** - Tenant-specific code ONLY
   - Page components (orchestration)
   - Tenant-specific configuration UI
   - Custom branding overrides

### Import Pattern

```typescript
// Core services
import { analyzeQuality, assessRisk } from '@content-engine/quality';
import { generateContent, WebhookPublisher } from '@content-engine/publishing';

// Shared UI
import {
  KanbanBoard,
  QualityPanel,
  PublishButton
} from '@content-engine/ui';

// Shared hooks
import { useArticles, useTenant, useAuth } from '@content-engine/hooks';

// Shared types
import type { Article, Contributor, QualityScore } from '@content-engine/types';

// Shared config
import { env, validateEnv } from '@content-engine/config';
```

---

## Database Alignment

### Current State (Correct)
- All 26 tables properly use tenant_id for RLS
- Migration 016 fixed junction table security issue
- Edge functions use tenant context properly

### No Database Changes Needed
The database architecture is correct. Only the frontend component organization needs restructuring.

---

## Checklist

- [ ] Create new directories in libs/shared/ui/
- [ ] Move 23 component files
- [ ] Create index.ts files for each new directory
- [ ] Update libs/shared/ui/src/index.ts
- [ ] Update all imports in apps/geteducated/
- [ ] Delete emptied directories
- [ ] Test build: `npx nx build geteducated`
- [ ] Verify no broken imports
- [ ] Update component storybook (if exists)
- [ ] Document in CLAUDE.md

---

## Verification Commands

```bash
# Build to verify no import errors
npx nx build geteducated

# Check library exports
npx nx build ui

# View dependency graph
npx nx graph

# Lint for unused imports
npx nx lint geteducated
```
