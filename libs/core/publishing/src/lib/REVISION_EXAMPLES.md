# Article Revision System - Usage Examples

## Example 1: Basic Revision Creation in Article Editor

```tsx
import { useEffect, useState, useCallback } from 'react';
import { createRevision, shouldAutoSaveRevision } from '@content-engine/publishing';
import { useSupabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function ArticleEditor({ articleId }: { articleId: string }) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [lastRevisionTime, setLastRevisionTime] = useState(new Date());

  // Auto-save revision every 2 minutes if needed
  useEffect(() => {
    const interval = setInterval(async () => {
      if (shouldAutoSaveRevision(lastSavedContent, content, lastRevisionTime)) {
        await createRevision(
          {
            articleId,
            title: article.title,
            content,
            excerpt: article.excerpt,
            changeType: 'auto',
            changeSummary: 'Auto-saved changes',
            createdBy: user.id,
          },
          supabase
        );

        setLastSavedContent(content);
        setLastRevisionTime(new Date());
      }
    }, 120000); // Every 2 minutes

    return () => clearInterval(interval);
  }, [content, lastSavedContent, lastRevisionTime]);

  // Manual save
  const handleManualSave = async () => {
    await createRevision(
      {
        articleId,
        title: article.title,
        content,
        excerpt: article.excerpt,
        metadata: {
          seoTitle: article.seo.metaTitle,
          seoDescription: article.seo.metaDescription,
          primaryKeyword: article.primaryKeyword,
        },
        changeType: 'manual',
        changeSummary: 'Manual save',
        createdBy: user.id,
      },
      supabase
    );

    setLastSavedContent(content);
    setLastRevisionTime(new Date());
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 p-4"
      />
      <button onClick={handleManualSave}>Save</button>
    </div>
  );
}
```

## Example 2: Revision History Sidebar

```tsx
import { useState, useEffect } from 'react';
import { RevisionHistory, RevisionDiffView, RestoreConfirmDialog } from '@content-engine/ui';
import {
  getRevisionHistory,
  getRevision,
  getRevisionComparison,
  restoreRevision,
} from '@content-engine/publishing';
import type { RevisionListItem, RevisionComparison, ArticleRevision } from '@content-engine/types';

export function RevisionHistorySidebar({
  articleId,
  currentVersion,
  onArticleUpdated,
}: {
  articleId: string;
  currentVersion: number;
  onArticleUpdated: () => void;
}) {
  const supabase = useSupabase();
  const { user } = useAuth();

  // State
  const [view, setView] = useState<'list' | 'diff'>('list');
  const [revisions, setRevisions] = useState<RevisionListItem[]>([]);
  const [comparison, setComparison] = useState<RevisionComparison | null>(null);
  const [revisionToRestore, setRevisionToRestore] = useState<ArticleRevision | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load revisions
  useEffect(() => {
    loadRevisions();
  }, [articleId]);

  const loadRevisions = async () => {
    setIsLoading(true);
    try {
      const data = await getRevisionHistory(articleId, supabase);
      setRevisions(data);
    } catch (error) {
      console.error('Failed to load revisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compare two revisions
  const handleCompare = async (fromId: string, toId: string) => {
    try {
      const comp = await getRevisionComparison(fromId, toId, supabase);
      setComparison(comp);
      setView('diff');
    } catch (error) {
      console.error('Failed to compare revisions:', error);
    }
  };

  // Prepare to restore
  const handleRestoreClick = async (revisionId: string) => {
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

  // Confirm and execute restore
  const handleRestoreConfirm = async () => {
    if (!revisionToRestore) return;

    setIsRestoring(true);
    try {
      await restoreRevision(
        {
          articleId,
          revisionId: revisionToRestore.id,
          createdBy: user.id,
        },
        supabase
      );

      // Reload revisions and notify parent
      await loadRevisions();
      onArticleUpdated();

      setShowRestoreDialog(false);
      setRevisionToRestore(null);
      setView('list');
    } catch (error) {
      console.error('Failed to restore revision:', error);
      alert('Failed to restore revision');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {view === 'list' ? (
        <RevisionHistory
          revisions={revisions}
          currentVersion={currentVersion}
          onCompare={handleCompare}
          onRestore={handleRestoreClick}
          isLoading={isLoading}
        />
      ) : comparison ? (
        <RevisionDiffView
          comparison={comparison}
          viewMode="unified"
          onClose={() => {
            setComparison(null);
            setView('list');
          }}
        />
      ) : null}

      {revisionToRestore && (
        <RestoreConfirmDialog
          revision={revisionToRestore}
          currentVersion={currentVersion}
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

## Example 3: Publishing Hook with Revision Snapshot

```tsx
import { createRevision } from '@content-engine/publishing';
import { publishToWordPress } from '@content-engine/publishing';

export async function publishArticle(
  article: Article,
  user: User,
  supabase: any
) {
  // Create a publish snapshot before publishing
  await createRevision(
    {
      articleId: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      metadata: {
        seoTitle: article.seo.metaTitle,
        seoDescription: article.seo.metaDescription,
        primaryKeyword: article.primaryKeyword,
        categoryIds: article.categoryIds,
        tagIds: article.tagIds,
        featuredImageUrl: article.featuredImageUrl,
      },
      changeType: 'publish',
      changeSummary: 'Article published',
      createdBy: user.id,
    },
    supabase
  );

  // Proceed with publishing
  const result = await publishToWordPress(article, wpConfig);

  // Update article record
  await supabase
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      wp_post_id: result.postId,
      published_url: result.postUrl,
    })
    .eq('id', article.id);

  return result;
}
```

## Example 4: Scheduled Auto-Save with Smart Detection

```tsx
import { useState, useEffect, useRef } from 'react';
import { createRevision, shouldAutoSaveRevision } from '@content-engine/publishing';
import { debounce } from 'lodash';

export function SmartArticleEditor({ article }: { article: Article }) {
  const supabase = useSupabase();
  const { user } = useAuth();

  const [content, setContent] = useState(article.content);
  const [isSaving, setIsSaving] = useState(false);

  const lastSavedRef = useRef({
    content: article.content,
    time: new Date(),
  });

  // Debounced auto-save check
  const checkAutoSave = useRef(
    debounce(async (currentContent: string) => {
      const shouldSave = shouldAutoSaveRevision(
        lastSavedRef.current.content,
        currentContent,
        lastSavedRef.current.time
      );

      if (shouldSave) {
        setIsSaving(true);
        try {
          await createRevision(
            {
              articleId: article.id,
              title: article.title,
              content: currentContent,
              changeType: 'auto',
              changeSummary: 'Auto-saved changes',
              createdBy: user.id,
            },
            supabase
          );

          lastSavedRef.current = {
            content: currentContent,
            time: new Date(),
          };
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000) // Debounce 2 seconds
  ).current;

  // Trigger check on content change
  useEffect(() => {
    if (content !== lastSavedRef.current.content) {
      checkAutoSave(content);
    }
  }, [content]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2>{article.title}</h2>
        {isSaving && (
          <span className="text-sm text-slate-400">Saving...</span>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96"
      />
    </div>
  );
}
```

## Example 5: Comparing Specific Versions from URL Params

```tsx
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RevisionDiffView } from '@content-engine/ui';
import { getRevisionComparison } from '@content-engine/publishing';

export function RevisionComparisonPage() {
  const [searchParams] = useSearchParams();
  const supabase = useSupabase();

  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fromId || !toId) {
      setError('Missing revision IDs');
      setIsLoading(false);
      return;
    }

    const loadComparison = async () => {
      try {
        const comp = await getRevisionComparison(fromId, toId, supabase);
        setComparison(comp);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadComparison();
  }, [fromId, toId]);

  if (isLoading) return <div>Loading comparison...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!comparison) return <div>No comparison data</div>;

  return (
    <div className="p-8">
      <RevisionDiffView
        comparison={comparison}
        viewMode="side-by-side"
        onClose={() => window.history.back()}
      />
    </div>
  );
}
```

## Example 6: Revision-Based Undo/Redo System

```tsx
import { useState, useEffect } from 'react';
import { createRevision, getRevisionHistory, restoreRevision } from '@content-engine/publishing';

export function ArticleEditorWithUndo({ article }: { article: Article }) {
  const supabase = useSupabase();
  const { user } = useAuth();

  const [content, setContent] = useState(article.content);
  const [revisionStack, setRevisionStack] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Create revision on significant change
  const saveRevision = async (newContent: string) => {
    await createRevision(
      {
        articleId: article.id,
        title: article.title,
        content: newContent,
        changeType: 'manual',
        changeSummary: 'Edit checkpoint',
        createdBy: user.id,
      },
      supabase
    );
  };

  // Undo to previous version
  const handleUndo = async () => {
    if (currentIndex > 0) {
      const previousRevisionId = revisionStack[currentIndex - 1];
      await restoreRevision(
        {
          articleId: article.id,
          revisionId: previousRevisionId,
          createdBy: user.id,
        },
        supabase
      );

      setCurrentIndex(currentIndex - 1);
    }
  };

  // Redo to next version
  const handleRedo = async () => {
    if (currentIndex < revisionStack.length - 1) {
      const nextRevisionId = revisionStack[currentIndex + 1];
      await restoreRevision(
        {
          articleId: article.id,
          revisionId: nextRevisionId,
          createdBy: user.id,
        },
        supabase
      );

      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleUndo}
          disabled={currentIndex <= 0}
          className="px-4 py-2 bg-slate-700 disabled:opacity-50"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={currentIndex >= revisionStack.length - 1}
          className="px-4 py-2 bg-slate-700 disabled:opacity-50"
        >
          Redo
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => saveRevision(content)}
        className="w-full h-96"
      />
    </div>
  );
}
```

## Example 7: Batch Restore Multiple Articles

```tsx
import { restoreRevision } from '@content-engine/publishing';

export async function batchRestoreArticles(
  restores: Array<{ articleId: string; revisionId: string }>,
  userId: string,
  supabase: any
) {
  const results = await Promise.allSettled(
    restores.map(({ articleId, revisionId }) =>
      restoreRevision(
        {
          articleId,
          revisionId,
          createdBy: userId,
        },
        supabase
      )
    )
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    total: restores.length,
    successful,
    failed,
    results,
  };
}

// Usage
const restores = [
  { articleId: 'article-1', revisionId: 'rev-123' },
  { articleId: 'article-2', revisionId: 'rev-456' },
];

const result = await batchRestoreArticles(restores, user.id, supabase);
console.log(`Restored ${result.successful}/${result.total} articles`);
```

## Example 8: Export Revision History as Changelog

```tsx
import { getRevisionHistory } from '@content-engine/publishing';

export async function exportChangelog(articleId: string, supabase: any) {
  const revisions = await getRevisionHistory(articleId, supabase);

  const changelog = revisions.map((rev) => ({
    version: rev.version,
    date: new Date(rev.createdAt).toLocaleDateString(),
    author: rev.createdByName,
    type: rev.changeType,
    summary: rev.changeSummary || 'No description',
    wordCountDelta: rev.wordCountDelta,
  }));

  // Generate markdown
  const markdown = [
    '# Article Changelog',
    '',
    ...changelog.map(
      (entry) => `
## Version ${entry.version} - ${entry.date}

- **Author**: ${entry.author}
- **Type**: ${entry.type}
- **Changes**: ${entry.summary}
- **Word Count**: ${entry.wordCountDelta > 0 ? '+' : ''}${entry.wordCountDelta} words
`
    ),
  ].join('\n');

  return markdown;
}

// Usage
const changelog = await exportChangelog('article-123', supabase);
console.log(changelog);
```

## Best Practices Summary

1. **Auto-save intelligently**: Use `shouldAutoSaveRevision()` to avoid excessive saves
2. **Add descriptive summaries**: Help users understand what changed
3. **Create snapshots at key moments**: Before publishing, major edits, status changes
4. **Provide comparison tools**: Let users see exactly what changed
5. **Confirm before restore**: Always show dialog to prevent accidental data loss
6. **Handle errors gracefully**: Network issues, permission errors, etc.
7. **Show loading states**: Auto-save indicators, restore progress
8. **Consider performance**: Pagination, lazy loading, debouncing
