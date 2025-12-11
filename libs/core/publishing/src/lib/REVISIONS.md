# Article Revision Tracking

## Overview

The revision tracking system provides comprehensive version control for articles in the Meta Content Engine. It automatically saves revision snapshots, generates diffs, and allows restoring to previous versions.

## Features

- **Automatic snapshots** on significant changes (>50 words or >30 minutes)
- **Manual snapshots** when user explicitly saves
- **Publish snapshots** when article is published
- **Restore snapshots** when reverting to a previous version
- **Diff generation** comparing any two versions
- **Word count tracking** showing changes between versions
- **Full metadata preservation** including SEO and categorization

## Service API

### Create a Revision

```typescript
import { createRevision } from '@content-engine/publishing';

const revision = await createRevision(
  {
    articleId: 'article-123',
    title: 'Updated Article Title',
    content: 'Article content...',
    excerpt: 'Brief summary...',
    metadata: {
      seoTitle: 'SEO Title',
      seoDescription: 'SEO description',
      primaryKeyword: 'main keyword',
      categoryIds: ['cat-1', 'cat-2'],
      tagIds: ['tag-1'],
    },
    changeType: 'manual', // 'auto' | 'manual' | 'publish' | 'restore'
    changeSummary: 'Updated introduction section',
    createdBy: 'user-id',
  },
  supabaseClient
);
```

### Get Revision History

```typescript
import { getRevisionHistory } from '@content-engine/publishing';

const revisions = await getRevisionHistory('article-123', supabaseClient);
// Returns RevisionListItem[] sorted by version descending
```

### Compare Two Revisions

```typescript
import { getRevisionComparison } from '@content-engine/publishing';

const comparison = await getRevisionComparison(
  'revision-id-1',
  'revision-id-2',
  supabaseClient
);

// Returns RevisionComparison with:
// - fromVersion, toVersion
// - fromRevision, toRevision (full revision objects)
// - diffs[] (array of changes)
// - wordCountChange
// - additions, deletions, modifications counts
```

### Restore a Revision

```typescript
import { restoreRevision } from '@content-engine/publishing';

const newRevision = await restoreRevision(
  {
    articleId: 'article-123',
    revisionId: 'revision-to-restore',
    createdBy: 'user-id',
  },
  supabaseClient
);
// Updates the article AND creates a new revision marked as 'restore'
```

### Auto-save Logic

```typescript
import { shouldAutoSaveRevision } from '@content-engine/publishing';

const shouldSave = shouldAutoSaveRevision(
  previousContent,
  currentContent,
  lastRevisionTime
);
// Returns true if:
// - Word count changed by >50 words, OR
// - >30 minutes elapsed and content changed
```

## UI Components

### RevisionHistory

Timeline view of all revisions with selection and restore capabilities.

```typescript
import { RevisionHistory } from '@content-engine/ui';

<RevisionHistory
  revisions={revisions}
  currentVersion={currentArticleVersion}
  onCompare={(fromId, toId) => {
    // Load comparison view
  }}
  onRestore={(revisionId) => {
    // Show restore confirmation dialog
  }}
  isLoading={false}
/>
```

### RevisionDiffView

Side-by-side or unified diff viewer with collapsible sections.

```typescript
import { RevisionDiffView } from '@content-engine/ui';

<RevisionDiffView
  comparison={comparisonData}
  viewMode="unified" // or "side-by-side"
  onClose={() => setShowDiff(false)}
/>
```

### RestoreConfirmDialog

Confirmation modal with revision details before restoring.

```typescript
import { RestoreConfirmDialog } from '@content-engine/ui';

<RestoreConfirmDialog
  revision={revisionToRestore}
  currentVersion={currentArticleVersion}
  isOpen={showConfirm}
  onConfirm={async () => {
    await restoreRevision({...});
  }}
  onCancel={() => setShowConfirm(false)}
  isRestoring={isLoading}
/>
```

## Database Schema

The system expects an `article_revisions` table with:

```sql
CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Content snapshot
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  metadata JSONB DEFAULT '{}',

  -- Change tracking
  change_type TEXT NOT NULL CHECK (change_type IN ('auto', 'manual', 'publish', 'restore')),
  change_summary TEXT,
  word_count_delta INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),

  CONSTRAINT unique_article_version UNIQUE (article_id, version)
);

CREATE INDEX idx_article_revisions_article ON article_revisions(article_id, version DESC);
CREATE INDEX idx_article_revisions_tenant ON article_revisions(tenant_id);
```

## Usage Patterns

### Editor Integration

```typescript
// In your article editor component
import { createRevision, shouldAutoSaveRevision } from '@content-engine/publishing';

const handleAutoSave = async () => {
  if (shouldAutoSaveRevision(lastSavedContent, currentContent, lastRevisionTime)) {
    await createRevision({
      articleId: article.id,
      title: article.title,
      content: currentContent,
      changeType: 'auto',
      changeSummary: 'Auto-saved changes',
      createdBy: currentUser.id,
    }, supabase);
  }
};

// Debounced auto-save every 2 minutes
useEffect(() => {
  const interval = setInterval(handleAutoSave, 120000);
  return () => clearInterval(interval);
}, [currentContent]);
```

### Publishing Hook

```typescript
// Before publishing, create a publish snapshot
await createRevision({
  articleId: article.id,
  title: article.title,
  content: article.content,
  excerpt: article.excerpt,
  metadata: {
    seoTitle: article.seo.metaTitle,
    seoDescription: article.seo.metaDescription,
    // ... other metadata
  },
  changeType: 'publish',
  changeSummary: `Published to ${publishUrl}`,
  createdBy: currentUser.id,
}, supabase);
```

### Version History Panel

```typescript
// In article editor sidebar
const [showRevisions, setShowRevisions] = useState(false);
const [revisions, setRevisions] = useState<RevisionListItem[]>([]);
const [comparison, setComparison] = useState<RevisionComparison | null>(null);

const loadRevisions = async () => {
  const data = await getRevisionHistory(article.id, supabase);
  setRevisions(data);
};

const handleCompare = async (fromId: string, toId: string) => {
  const comp = await getRevisionComparison(fromId, toId, supabase);
  setComparison(comp);
};

return (
  <>
    {!comparison ? (
      <RevisionHistory
        revisions={revisions}
        currentVersion={article.version}
        onCompare={handleCompare}
        onRestore={(id) => {
          setRevisionToRestore(id);
          setShowRestoreDialog(true);
        }}
      />
    ) : (
      <RevisionDiffView
        comparison={comparison}
        onClose={() => setComparison(null)}
      />
    )}
  </>
);
```

## Performance Considerations

- **Revisions are created only when needed**: Use `shouldAutoSaveRevision()` to avoid excessive snapshots
- **Content diffs are generated on-demand**: Stored revisions don't include pre-computed diffs
- **Pagination recommended**: For articles with many revisions, implement pagination in the UI
- **Cleanup old revisions**: Consider archiving or deleting revisions older than 90 days

## Best Practices

1. **Create snapshots at key moments**:
   - Before publishing
   - After significant edits (>50 words)
   - When changing article status
   - Before AI-assisted rewrites

2. **Use descriptive change summaries**:
   ```typescript
   changeSummary: 'Rewrote introduction for clarity'
   changeSummary: 'Added SEO metadata'
   changeSummary: 'Fixed grammar and typos'
   ```

3. **Limit revision retention**:
   - Keep all revisions for 30 days
   - Keep monthly snapshots beyond 30 days
   - Archive revisions after 1 year

4. **Inform users before restore**:
   - Always show `RestoreConfirmDialog`
   - Explain what will be lost
   - Provide diff preview if possible

## Future Enhancements

- [ ] Branch/merge support for collaborative editing
- [ ] Scheduled auto-save intervals per tenant
- [ ] Revision compression for older versions
- [ ] Visual diff with syntax highlighting
- [ ] Conflict resolution for simultaneous edits
- [ ] Export revision history as changelog
