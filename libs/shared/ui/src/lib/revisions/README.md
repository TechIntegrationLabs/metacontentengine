# Revision UI Components

## Overview

React components for displaying and managing article revisions in the Meta Content Engine.

## Components

### RevisionHistory

Timeline view of all article revisions with selection, comparison, and restore capabilities.

**Features:**
- Timeline visualization with version nodes
- Metadata display (author, date, word count, delta)
- Multi-select for comparison (up to 2 versions)
- Restore button for non-current versions
- Change type badges (auto, manual, publish, restore)
- Relative time formatting

**Props:**
```typescript
interface RevisionHistoryProps {
  revisions: RevisionListItem[];
  currentVersion?: number;
  onCompare?: (fromId: string, toId: string) => void;
  onRestore?: (revisionId: string) => void;
  isLoading?: boolean;
}
```

**Example:**
```tsx
import { RevisionHistory } from '@content-engine/ui';

function ArticleEditor() {
  const [revisions, setRevisions] = useState<RevisionListItem[]>([]);

  const handleCompare = (fromId: string, toId: string) => {
    // Load comparison data and show diff view
    loadComparison(fromId, toId);
  };

  const handleRestore = (revisionId: string) => {
    // Show confirmation dialog
    setRestoreDialogOpen(true);
    setSelectedRevision(revisionId);
  };

  return (
    <RevisionHistory
      revisions={revisions}
      currentVersion={currentArticleVersion}
      onCompare={handleCompare}
      onRestore={handleRestore}
      isLoading={isLoadingRevisions}
    />
  );
}
```

---

### RevisionDiffView

Side-by-side or unified diff viewer showing changes between two versions.

**Features:**
- Two view modes: side-by-side and unified
- Collapsible diff sections by field
- Color-coded changes (green=added, red=removed, yellow=modified)
- Context display for multi-line changes
- Summary statistics (total changes, additions, deletions)
- Word count delta

**Props:**
```typescript
interface RevisionDiffViewProps {
  comparison: RevisionComparison;
  viewMode?: 'side-by-side' | 'unified';
  onClose?: () => void;
}
```

**Example:**
```tsx
import { RevisionDiffView } from '@content-engine/ui';
import { getRevisionComparison } from '@content-engine/publishing';

function DiffModal({ fromId, toId, onClose }) {
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const loadComparison = async () => {
      const data = await getRevisionComparison(fromId, toId, supabase);
      setComparison(data);
    };
    loadComparison();
  }, [fromId, toId]);

  if (!comparison) return <div>Loading...</div>;

  return (
    <RevisionDiffView
      comparison={comparison}
      viewMode="unified"
      onClose={onClose}
    />
  );
}
```

---

### RestoreConfirmDialog

Confirmation modal before restoring to a previous version.

**Features:**
- Warning about versions that will be lost
- Revision details display (title, author, date, word count)
- Expandable full revision preview
- Loading state during restore
- Prevents accidental closes during restore

**Props:**
```typescript
interface RestoreConfirmDialogProps {
  revision: ArticleRevision;
  currentVersion: number;
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isRestoring?: boolean;
}
```

**Example:**
```tsx
import { RestoreConfirmDialog } from '@content-engine/ui';
import { restoreRevision, getRevision } from '@content-engine/publishing';

function ArticleEditor() {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [revisionToRestore, setRevisionToRestore] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreConfirm = async () => {
    setIsRestoring(true);
    try {
      await restoreRevision({
        articleId: article.id,
        revisionId: revisionToRestore.id,
        createdBy: currentUser.id,
      }, supabase);

      // Reload article
      await loadArticle();

      setRestoreDialogOpen(false);
      toast.success(`Restored to version ${revisionToRestore.version}`);
    } catch (error) {
      toast.error('Failed to restore revision');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <RestoreConfirmDialog
      revision={revisionToRestore}
      currentVersion={article.version}
      isOpen={restoreDialogOpen}
      onConfirm={handleRestoreConfirm}
      onCancel={() => setRestoreDialogOpen(false)}
      isRestoring={isRestoring}
    />
  );
}
```

## Complete Integration Example

Here's a complete example integrating all three components in an article editor:

```tsx
import { useState, useEffect } from 'react';
import {
  RevisionHistory,
  RevisionDiffView,
  RestoreConfirmDialog,
} from '@content-engine/ui';
import {
  getRevisionHistory,
  getRevision,
  getRevisionComparison,
  restoreRevision,
} from '@content-engine/publishing';
import type {
  RevisionListItem,
  RevisionComparison,
  ArticleRevision,
} from '@content-engine/types';

function ArticleEditorSidebar({ article, supabase, currentUser }) {
  // State
  const [view, setView] = useState<'history' | 'diff'>('history');
  const [revisions, setRevisions] = useState<RevisionListItem[]>([]);
  const [comparison, setComparison] = useState<RevisionComparison | null>(null);
  const [revisionToRestore, setRevisionToRestore] = useState<ArticleRevision | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Loading states
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load revisions on mount
  useEffect(() => {
    loadRevisions();
  }, [article.id]);

  const loadRevisions = async () => {
    setIsLoadingRevisions(true);
    try {
      const data = await getRevisionHistory(article.id, supabase);
      setRevisions(data);
    } catch (error) {
      console.error('Failed to load revisions:', error);
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  const handleCompare = async (fromId: string, toId: string) => {
    try {
      const comp = await getRevisionComparison(fromId, toId, supabase);
      setComparison(comp);
      setView('diff');
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  };

  const handleRestore = async (revisionId: string) => {
    try {
      const revision = await getRevision(revisionId, supabase);
      if (revision) {
        setRevisionToRestore(revision);
        setShowRestoreDialog(true);
      }
    } catch (error) {
      console.error('Failed to load revision:', error);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!revisionToRestore) return;

    setIsRestoring(true);
    try {
      await restoreRevision({
        articleId: article.id,
        revisionId: revisionToRestore.id,
        createdBy: currentUser.id,
      }, supabase);

      // Reload article and revisions
      await loadArticle();
      await loadRevisions();

      setShowRestoreDialog(false);
      setRevisionToRestore(null);
      setView('history');

      toast.success(`Restored to version ${revisionToRestore.version}`);
    } catch (error) {
      toast.error('Failed to restore revision');
      console.error(error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCloseDiff = () => {
    setComparison(null);
    setView('history');
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {view === 'history' ? (
        <RevisionHistory
          revisions={revisions}
          currentVersion={article.version}
          onCompare={handleCompare}
          onRestore={handleRestore}
          isLoading={isLoadingRevisions}
        />
      ) : comparison ? (
        <RevisionDiffView
          comparison={comparison}
          viewMode="unified"
          onClose={handleCloseDiff}
        />
      ) : null}

      {revisionToRestore && (
        <RestoreConfirmDialog
          revision={revisionToRestore}
          currentVersion={article.version}
          isOpen={showRestoreDialog}
          onConfirm={handleRestoreConfirm}
          onCancel={() => {
            setShowRestoreDialog(false);
            setRevisionToRestore(null);
          }}
          isRestoring={isRestoring}
        />
      )}
    </div>
  );
}
```

## Styling

All components use the "Kinetic Modernism" design system with:
- **GlassCard** containers for frosted glass effect
- **Motion animations** via Framer Motion
- **Color coding**:
  - Green: Additions, improvements
  - Red: Deletions, warnings
  - Yellow: Modifications
  - Indigo: Primary actions
  - Purple: Restore actions
- **Consistent spacing** and typography

## Accessibility

- Keyboard navigation supported
- ARIA labels for screen readers
- Focus management in modals
- Color contrast meets WCAG AA standards
- Loading states announced

## Performance Tips

1. **Lazy load revisions**: Only fetch when sidebar is opened
2. **Pagination**: Limit initial revisions to 20, load more on scroll
3. **Memoize comparisons**: Cache diff results to avoid re-computation
4. **Debounce auto-save**: Don't create revisions too frequently
5. **Virtual scrolling**: For articles with 100+ revisions

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)
