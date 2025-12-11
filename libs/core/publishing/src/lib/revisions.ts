/**
 * Article Revision Service
 *
 * Manages article revision history with diff generation and restore capabilities.
 */

import type {
  ArticleRevision,
  RevisionDiff,
  RevisionComparison,
  CreateRevisionRequest,
  RestoreRevisionRequest,
  RevisionListItem,
} from '@content-engine/types';

/**
 * Calculate word count from text content
 */
function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Simple diff implementation
 * Compares two strings and identifies additions, removals, and modifications
 */
function generateTextDiff(
  oldText: string,
  newText: string,
  field: string
): RevisionDiff[] {
  const diffs: RevisionDiff[] = [];

  // If texts are identical, no diff
  if (oldText === newText) {
    return diffs;
  }

  // For very different texts, just mark as modified
  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);

  if (
    Math.abs(oldWords.length - newWords.length) / Math.max(oldWords.length, 1) >
    0.5
  ) {
    // More than 50% change - just show as full modification
    diffs.push({
      type: 'modified',
      field,
      oldValue: oldText.substring(0, 200) + (oldText.length > 200 ? '...' : ''),
      newValue: newText.substring(0, 200) + (newText.length > 200 ? '...' : ''),
    });
    return diffs;
  }

  // For smaller changes, find differences
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Remaining lines are additions
      diffs.push({
        type: 'added',
        field: `${field} (line ${j + 1})`,
        newValue: newLines[j],
        context: newLines[j - 1] || '',
      });
      j++;
    } else if (j >= newLines.length) {
      // Remaining lines are deletions
      diffs.push({
        type: 'removed',
        field: `${field} (line ${i + 1})`,
        oldValue: oldLines[i],
        context: oldLines[i - 1] || '',
      });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      // Lines match, continue
      i++;
      j++;
    } else {
      // Lines differ
      diffs.push({
        type: 'modified',
        field: `${field} (line ${i + 1})`,
        oldValue: oldLines[i],
        newValue: newLines[j],
        context: oldLines[i - 1] || newLines[j - 1] || '',
      });
      i++;
      j++;
    }
  }

  // Limit number of diffs shown
  if (diffs.length > 50) {
    return diffs.slice(0, 50).concat([
      {
        type: 'modified',
        field: `${field} (additional changes)`,
        oldValue: `${diffs.length - 50} more changes...`,
        newValue: '',
      },
    ]);
  }

  return diffs;
}

/**
 * Compare two revisions and generate diff
 */
export function compareRevisions(
  fromRevision: ArticleRevision,
  toRevision: ArticleRevision
): RevisionComparison {
  const diffs: RevisionDiff[] = [];

  // Compare title
  if (fromRevision.title !== toRevision.title) {
    diffs.push({
      type: 'modified',
      field: 'Title',
      oldValue: fromRevision.title,
      newValue: toRevision.title,
    });
  }

  // Compare content
  if (fromRevision.content !== toRevision.content) {
    const contentDiffs = generateTextDiff(
      fromRevision.content,
      toRevision.content,
      'Content'
    );
    diffs.push(...contentDiffs);
  }

  // Compare excerpt
  if (fromRevision.excerpt !== toRevision.excerpt) {
    diffs.push({
      type: 'modified',
      field: 'Excerpt',
      oldValue: fromRevision.excerpt || '',
      newValue: toRevision.excerpt || '',
    });
  }

  // Compare metadata
  const fromMeta = fromRevision.metadata;
  const toMeta = toRevision.metadata;

  if (fromMeta.seoTitle !== toMeta.seoTitle) {
    diffs.push({
      type: 'modified',
      field: 'SEO Title',
      oldValue: fromMeta.seoTitle || '',
      newValue: toMeta.seoTitle || '',
    });
  }

  if (fromMeta.seoDescription !== toMeta.seoDescription) {
    diffs.push({
      type: 'modified',
      field: 'SEO Description',
      oldValue: fromMeta.seoDescription || '',
      newValue: toMeta.seoDescription || '',
    });
  }

  if (fromMeta.primaryKeyword !== toMeta.primaryKeyword) {
    diffs.push({
      type: 'modified',
      field: 'Primary Keyword',
      oldValue: fromMeta.primaryKeyword || '',
      newValue: toMeta.primaryKeyword || '',
    });
  }

  // Count changes by type
  const additions = diffs.filter((d) => d.type === 'added').length;
  const deletions = diffs.filter((d) => d.type === 'removed').length;
  const modifications = diffs.filter((d) => d.type === 'modified').length;

  const fromWordCount = calculateWordCount(fromRevision.content);
  const toWordCount = calculateWordCount(toRevision.content);

  return {
    fromVersion: fromRevision.version,
    toVersion: toRevision.version,
    fromRevision,
    toRevision,
    diffs,
    wordCountChange: toWordCount - fromWordCount,
    additions,
    deletions,
    modifications,
  };
}

/**
 * Create a revision snapshot
 * This would typically be called when significant changes occur
 */
export async function createRevision(
  request: CreateRevisionRequest,
  supabase: any // Supabase client
): Promise<ArticleRevision> {
  // Get the latest version number for this article
  const { data: latestRevision } = await supabase
    .from('article_revisions')
    .select('version')
    .eq('article_id', request.articleId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestRevision?.version || 0) + 1;

  const wordCount = calculateWordCount(request.content);

  // Calculate word count delta
  let wordCountDelta = 0;
  if (latestRevision) {
    const { data: previousRevision } = await supabase
      .from('article_revisions')
      .select('content')
      .eq('article_id', request.articleId)
      .eq('version', latestRevision.version)
      .single();

    if (previousRevision) {
      const previousWordCount = calculateWordCount(previousRevision.content);
      wordCountDelta = wordCount - previousWordCount;
    }
  }

  const revision: Omit<ArticleRevision, 'id' | 'tenantId'> = {
    articleId: request.articleId,
    version: nextVersion,
    title: request.title,
    content: request.content,
    excerpt: request.excerpt,
    metadata: request.metadata || {},
    changeType: request.changeType,
    changeSummary: request.changeSummary,
    wordCountDelta,
    createdAt: new Date().toISOString(),
    createdBy: request.createdBy,
  };

  const { data, error } = await supabase
    .from('article_revisions')
    .insert(revision)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create revision: ${error.message}`);
  }

  return data;
}

/**
 * Get revision history for an article
 */
export async function getRevisionHistory(
  articleId: string,
  supabase: any
): Promise<RevisionListItem[]> {
  const { data, error } = await supabase
    .from('article_revisions')
    .select(
      `
      id,
      version,
      change_type,
      change_summary,
      content,
      word_count_delta,
      created_at,
      created_by,
      users:created_by (
        id,
        full_name
      )
    `
    )
    .eq('article_id', articleId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch revision history: ${error.message}`);
  }

  return data.map((rev: any) => ({
    id: rev.id,
    version: rev.version,
    changeType: rev.change_type,
    changeSummary: rev.change_summary,
    wordCount: calculateWordCount(rev.content),
    wordCountDelta: rev.word_count_delta,
    createdAt: rev.created_at,
    createdBy: rev.created_by,
    createdByName: rev.users?.full_name || 'Unknown User',
  }));
}

/**
 * Get a specific revision
 */
export async function getRevision(
  revisionId: string,
  supabase: any
): Promise<ArticleRevision | null> {
  const { data, error } = await supabase
    .from('article_revisions')
    .select(
      `
      *,
      users:created_by (
        id,
        full_name
      )
    `
    )
    .eq('id', revisionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    articleId: data.article_id,
    tenantId: data.tenant_id,
    version: data.version,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    metadata: data.metadata,
    changeType: data.change_type,
    changeSummary: data.change_summary,
    wordCountDelta: data.word_count_delta,
    createdAt: data.created_at,
    createdBy: data.created_by,
    createdByName: data.users?.full_name || 'Unknown User',
  };
}

/**
 * Restore an article to a previous revision
 */
export async function restoreRevision(
  request: RestoreRevisionRequest,
  supabase: any
): Promise<ArticleRevision> {
  // Get the revision to restore
  const revisionToRestore = await getRevision(request.revisionId, supabase);

  if (!revisionToRestore) {
    throw new Error('Revision not found');
  }

  // Update the article with the revision content
  const { error: updateError } = await supabase
    .from('articles')
    .update({
      title: revisionToRestore.title,
      content: revisionToRestore.content,
      excerpt: revisionToRestore.excerpt,
      updated_at: new Date().toISOString(),
      updated_by: request.createdBy,
    })
    .eq('id', request.articleId);

  if (updateError) {
    throw new Error(`Failed to restore article: ${updateError.message}`);
  }

  // Create a new revision marking this as a restore
  const newRevision = await createRevision(
    {
      articleId: request.articleId,
      title: revisionToRestore.title,
      content: revisionToRestore.content,
      excerpt: revisionToRestore.excerpt,
      metadata: revisionToRestore.metadata,
      changeType: 'restore',
      changeSummary: `Restored to version ${revisionToRestore.version}`,
      createdBy: request.createdBy,
    },
    supabase
  );

  return newRevision;
}

/**
 * Get comparison between two specific revisions
 */
export async function getRevisionComparison(
  fromRevisionId: string,
  toRevisionId: string,
  supabase: any
): Promise<RevisionComparison> {
  const [fromRevision, toRevision] = await Promise.all([
    getRevision(fromRevisionId, supabase),
    getRevision(toRevisionId, supabase),
  ]);

  if (!fromRevision || !toRevision) {
    throw new Error('One or both revisions not found');
  }

  return compareRevisions(fromRevision, toRevision);
}

/**
 * Should auto-save a revision based on change magnitude
 */
export function shouldAutoSaveRevision(
  oldContent: string,
  newContent: string,
  lastRevisionTime: Date
): boolean {
  // Auto-save if content differs significantly
  const oldWordCount = calculateWordCount(oldContent);
  const newWordCount = calculateWordCount(newContent);
  const wordCountDiff = Math.abs(newWordCount - oldWordCount);

  // More than 50 words changed
  if (wordCountDiff > 50) {
    return true;
  }

  // Or more than 30 minutes since last revision
  const minutesSinceLastRevision =
    (Date.now() - lastRevisionTime.getTime()) / 1000 / 60;
  if (minutesSinceLastRevision > 30 && oldContent !== newContent) {
    return true;
  }

  return false;
}
