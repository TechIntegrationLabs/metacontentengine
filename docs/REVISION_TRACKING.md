# Article Revision Tracking System

## Overview

The Meta Content Engine now includes a comprehensive revision tracking system that provides version control for all articles. This system automatically saves revision snapshots, generates diffs between versions, and allows restoring to previous versions.

## Features

### Core Capabilities

- **Automatic Snapshots**: Auto-save revisions when content changes significantly (>50 words or >30 minutes)
- **Manual Snapshots**: Users can explicitly save checkpoints
- **Publish Snapshots**: Automatically create revision when article is published
- **Restore Capability**: Revert to any previous version with confirmation
- **Diff Generation**: Compare any two versions side-by-side or unified view
- **Word Count Tracking**: Monitor content growth/reduction between versions
- **Metadata Preservation**: Full snapshot of SEO, categories, tags, etc.

### Technical Features

- **Multi-tenant Isolation**: Revisions secured via Supabase RLS policies
- **Immutable History**: Revisions cannot be edited or deleted
- **Version Auto-increment**: Sequential version numbers per article
- **Efficient Storage**: Only changed content is tracked (no pre-computed diffs)
- **Performance Optimized**: Indexed for fast retrieval
- **Type-safe**: Full TypeScript support

## Architecture

### Service Layer (`@content-engine/publishing`)

**Location**: `libs/core/publishing/src/lib/revisions.ts`

**Key Functions**:
- `createRevision()` - Save a new revision
- `getRevisionHistory()` - List all revisions for an article
- `getRevision()` - Get a specific revision by ID
- `compareRevisions()` - Generate diff between two versions
- `restoreRevision()` - Revert article to previous version
- `shouldAutoSaveRevision()` - Logic to determine when to auto-save

### Type Definitions (`@content-engine/types`)

**Location**: `libs/shared/types/src/lib/revisions.ts`

**Key Types**:
- `ArticleRevision` - Complete revision record
- `RevisionDiff` - Individual change in diff
- `RevisionComparison` - Full comparison between versions
- `RevisionListItem` - Lightweight list item for timeline
- `CreateRevisionRequest` - Request payload
- `RestoreRevisionRequest` - Restore payload

### UI Components (`@content-engine/ui`)

**Location**: `libs/shared/ui/src/lib/revisions/`

**Components**:
1. **RevisionHistory** - Timeline view with select/restore
2. **RevisionDiffView** - Side-by-side or unified diff viewer
3. **RestoreConfirmDialog** - Confirmation modal with details

## Database Schema

**Table**: `article_revisions`

```sql
CREATE TABLE article_revisions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  article_id UUID NOT NULL,
  version INTEGER NOT NULL,

  -- Content snapshot
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  metadata JSONB,

  -- Change tracking
  change_type TEXT CHECK (IN 'auto', 'manual', 'publish', 'restore'),
  change_summary TEXT,
  word_count_delta INTEGER,

  -- Audit
  created_at TIMESTAMPTZ,
  created_by UUID,

  UNIQUE (article_id, version)
);
```

**Functions**:
- `create_article_revision()` - Server-side function with auto-versioning
- `restore_article_revision()` - Server-side restore with validation
- `get_next_revision_version()` - Version number generator

**Trigger**:
- Auto-creates revision when article status changes to 'published'

## Quick Start

### 1. Install Dependencies

Already included in the monorepo. No additional packages needed.

### 2. Run Database Migration

```bash
cd content-engine
supabase db push
# Or apply the migration manually:
# supabase migration apply 999_article_revisions
```

### 3. Import Components

```tsx
import { RevisionHistory, RevisionDiffView, RestoreConfirmDialog } from '@content-engine/ui';
import {
  createRevision,
  getRevisionHistory,
  restoreRevision,
  compareRevisions,
} from '@content-engine/publishing';
import type { RevisionListItem, RevisionComparison } from '@content-engine/types';
```

### 4. Basic Usage

```tsx
// In your article editor
const handleAutoSave = async () => {
  await createRevision({
    articleId: article.id,
    title: article.title,
    content: currentContent,
    changeType: 'auto',
    changeSummary: 'Auto-saved changes',
    createdBy: user.id,
  }, supabase);
};

// In your revision history sidebar
const revisions = await getRevisionHistory(articleId, supabase);

return (
  <RevisionHistory
    revisions={revisions}
    currentVersion={article.version}
    onCompare={handleCompare}
    onRestore={handleRestore}
  />
);
```

## Implementation Guide

### Step 1: Add Revision History to Article Editor

Add a new sidebar tab for "Version History":

```tsx
// In your article editor page
import { RevisionHistory } from '@content-engine/ui';
import { getRevisionHistory } from '@content-engine/publishing';

function ArticleEditorPage() {
  const [activeTab, setActiveTab] = useState('content');
  const [revisions, setRevisions] = useState([]);

  useEffect(() => {
    if (activeTab === 'revisions') {
      loadRevisions();
    }
  }, [activeTab]);

  const loadRevisions = async () => {
    const data = await getRevisionHistory(article.id, supabase);
    setRevisions(data);
  };

  return (
    <AppLayout
      sidebar={
        <Sidebar
          tabs={['content', 'seo', 'revisions']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
    >
      {activeTab === 'revisions' && (
        <RevisionHistory
          revisions={revisions}
          currentVersion={article.version}
          onRestore={handleRestore}
        />
      )}
    </AppLayout>
  );
}
```

### Step 2: Implement Auto-Save

Use `shouldAutoSaveRevision()` to avoid excessive saves:

```tsx
import { shouldAutoSaveRevision, createRevision } from '@content-engine/publishing';

const [lastSaved, setLastSaved] = useState({
  content: article.content,
  time: new Date(),
});

useEffect(() => {
  const interval = setInterval(() => {
    if (shouldAutoSaveRevision(lastSaved.content, content, lastSaved.time)) {
      createRevision({
        articleId: article.id,
        title: article.title,
        content,
        changeType: 'auto',
        createdBy: user.id,
      }, supabase);

      setLastSaved({ content, time: new Date() });
    }
  }, 120000); // Every 2 minutes

  return () => clearInterval(interval);
}, [content, lastSaved]);
```

### Step 3: Add Publish Hook

Auto-create revision on publish:

```tsx
const handlePublish = async () => {
  // Create revision before publishing
  await createRevision({
    articleId: article.id,
    title: article.title,
    content: article.content,
    changeType: 'publish',
    changeSummary: 'Article published',
    createdBy: user.id,
  }, supabase);

  // Proceed with publishing
  await publishToWordPress(article, wpConfig);
};
```

### Step 4: Implement Restore

Show confirmation dialog before restoring:

```tsx
import { RestoreConfirmDialog } from '@content-engine/ui';
import { restoreRevision, getRevision } from '@content-engine/publishing';

const [showRestore, setShowRestore] = useState(false);
const [revisionToRestore, setRevisionToRestore] = useState(null);

const handleRestoreClick = async (revisionId) => {
  const revision = await getRevision(revisionId, supabase);
  setRevisionToRestore(revision);
  setShowRestore(true);
};

const handleRestoreConfirm = async () => {
  await restoreRevision({
    articleId: article.id,
    revisionId: revisionToRestore.id,
    createdBy: user.id,
  }, supabase);

  // Reload article
  await loadArticle();
  setShowRestore(false);
};

return (
  <RestoreConfirmDialog
    revision={revisionToRestore}
    currentVersion={article.version}
    isOpen={showRestore}
    onConfirm={handleRestoreConfirm}
    onCancel={() => setShowRestore(false)}
  />
);
```

## Configuration

### Auto-Save Settings

Modify the auto-save behavior in `libs/core/publishing/src/lib/revisions.ts`:

```typescript
export function shouldAutoSaveRevision(
  oldContent: string,
  newContent: string,
  lastRevisionTime: Date
): boolean {
  const wordCountDiff = Math.abs(
    calculateWordCount(newContent) - calculateWordCount(oldContent)
  );

  // Customize these thresholds:
  const WORD_THRESHOLD = 50; // Default: 50 words
  const TIME_THRESHOLD = 30; // Default: 30 minutes

  if (wordCountDiff > WORD_THRESHOLD) return true;

  const minutesSince = (Date.now() - lastRevisionTime.getTime()) / 60000;
  if (minutesSince > TIME_THRESHOLD && oldContent !== newContent) return true;

  return false;
}
```

### Revision Retention

To clean up old revisions, create a scheduled job:

```sql
-- Keep all revisions for 90 days, then keep only monthly snapshots
DELETE FROM article_revisions
WHERE created_at < NOW() - INTERVAL '90 days'
  AND change_type != 'publish'
  AND NOT (EXTRACT(DAY FROM created_at) = 1); -- Keep 1st of month
```

## API Reference

See detailed documentation:
- **Service API**: `libs/core/publishing/src/lib/REVISIONS.md`
- **UI Components**: `libs/shared/ui/src/lib/revisions/README.md`
- **Examples**: `libs/core/publishing/src/lib/REVISION_EXAMPLES.md`

## Performance Considerations

1. **Pagination**: Load revisions in batches (20-50 at a time)
2. **Lazy Loading**: Only fetch comparison diffs when requested
3. **Debouncing**: Debounce auto-save checks by 2-5 seconds
4. **Cleanup**: Archive old revisions after 90 days
5. **Indexing**: Database indexes on `article_id` and `created_at`

## Security

- **RLS Policies**: Multi-tenant isolation via Supabase RLS
- **Immutable Records**: Revisions cannot be edited/deleted by users
- **Audit Trail**: Full `created_by` tracking on all revisions
- **Permission Checks**: Restore requires write access to article

## Future Enhancements

- [ ] Branch/merge support for collaborative editing
- [ ] Visual diff with syntax highlighting (TipTap integration)
- [ ] Conflict resolution for simultaneous edits
- [ ] Export revision history as changelog
- [ ] Scheduled auto-save intervals per tenant
- [ ] Revision compression for older versions

## Troubleshooting

### Revisions not creating

1. Check database migration applied: `supabase db status`
2. Verify RLS policies: User must have access to article's tenant
3. Check browser console for errors

### Performance issues

1. Add pagination to revision list
2. Implement virtual scrolling for long lists
3. Debounce auto-save checks
4. Archive old revisions

### Restore failures

1. Verify user has write access to article
2. Check revision exists and belongs to same article
3. Ensure article is not locked/published

## Support

For issues or questions:
- **Documentation**: See files in this directory
- **Examples**: `libs/core/publishing/src/lib/REVISION_EXAMPLES.md`
- **Type Reference**: `libs/shared/types/src/lib/revisions.ts`

---

**Version**: 1.0.0
**Last Updated**: 2025-12-10
**Author**: Meta Content Engine Team
