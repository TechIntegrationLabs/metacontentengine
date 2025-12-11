/**
 * Article Revision Types
 */

export interface ArticleRevision {
  id: string;
  articleId: string;
  tenantId: string;
  version: number;
  title: string;
  content: string;
  excerpt?: string;

  // Metadata snapshot
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    primaryKeyword?: string;
    categoryIds?: string[];
    tagIds?: string[];
    featuredImageUrl?: string;
  };

  // Change tracking
  changeType: 'auto' | 'manual' | 'publish' | 'restore';
  changeSummary?: string;
  wordCountDelta: number;

  // Audit
  createdAt: string;
  createdBy: string;
  createdByName?: string; // For display purposes
}

export interface RevisionDiff {
  type: 'added' | 'removed' | 'modified';
  field: string;
  oldValue?: string;
  newValue?: string;
  context?: string; // Surrounding text for context
}

export interface RevisionComparison {
  fromVersion: number;
  toVersion: number;
  fromRevision: ArticleRevision;
  toRevision: ArticleRevision;
  diffs: RevisionDiff[];
  wordCountChange: number;

  // Summary stats
  additions: number;
  deletions: number;
  modifications: number;
}

export interface CreateRevisionRequest {
  articleId: string;
  title: string;
  content: string;
  excerpt?: string;
  metadata?: ArticleRevision['metadata'];
  changeType: ArticleRevision['changeType'];
  changeSummary?: string;
  createdBy: string;
}

export interface RestoreRevisionRequest {
  articleId: string;
  revisionId: string;
  createdBy: string;
}

export interface RevisionListItem {
  id: string;
  version: number;
  changeType: ArticleRevision['changeType'];
  changeSummary?: string;
  wordCount: number;
  wordCountDelta: number;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}
