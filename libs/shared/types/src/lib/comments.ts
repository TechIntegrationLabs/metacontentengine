/**
 * Comment System Types
 *
 * Internal commenting for article collaboration with thread support,
 * mentions, and resolution tracking.
 */

export interface ArticleComment {
  id: string;
  articleId: string;
  parentId?: string; // for replies
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[]; // user IDs mentioned in the comment
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentThread {
  rootComment: ArticleComment;
  replies: ArticleComment[];
  replyCount: number;
}

export interface CreateCommentRequest {
  articleId: string;
  parentId?: string;
  content: string;
  mentions?: string[];
}

export interface UpdateCommentRequest {
  commentId: string;
  content: string;
  mentions?: string[];
}

export interface ResolveCommentRequest {
  commentId: string;
  resolved: boolean;
}

export interface CommentFilters {
  articleId: string;
  showResolved?: boolean;
  showOnlyMentions?: boolean;
  userId?: string; // for filtering mentions
}

export type CommentSortOrder = 'newest' | 'oldest';

export interface CommentNotification {
  id: string;
  userId: string;
  commentId: string;
  articleId: string;
  type: 'mention' | 'reply' | 'resolution';
  read: boolean;
  createdAt: string;
}
