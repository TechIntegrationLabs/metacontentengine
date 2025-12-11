/**
 * Comment Service
 *
 * Internal commenting system for article collaboration with thread support,
 * mentions, and resolution tracking.
 */

import {
  ArticleComment,
  CommentThread,
  CreateCommentRequest,
  UpdateCommentRequest,
  ResolveCommentRequest,
  CommentFilters,
  CommentSortOrder,
  CommentNotification,
} from '@content-engine/types';

export interface CommentService {
  // CRUD operations
  createComment(request: CreateCommentRequest): Promise<ArticleComment>;
  updateComment(request: UpdateCommentRequest): Promise<ArticleComment>;
  deleteComment(commentId: string): Promise<void>;
  getComment(commentId: string): Promise<ArticleComment | null>;

  // Thread operations
  getCommentThreads(
    filters: CommentFilters,
    sort?: CommentSortOrder
  ): Promise<CommentThread[]>;
  getReplies(parentId: string): Promise<ArticleComment[]>;

  // Resolution
  resolveComment(request: ResolveCommentRequest): Promise<ArticleComment>;

  // Notifications (structure only - to be implemented with real-time system)
  createNotifications(comment: ArticleComment): Promise<void>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  getUserNotifications(userId: string): Promise<CommentNotification[]>;
}

/**
 * In-memory implementation for development
 * Replace with Supabase integration in production
 */
export class InMemoryCommentService implements CommentService {
  private comments: Map<string, ArticleComment> = new Map();
  private notifications: Map<string, CommentNotification> = new Map();

  async createComment(request: CreateCommentRequest): Promise<ArticleComment> {
    const comment: ArticleComment = {
      id: this.generateId(),
      articleId: request.articleId,
      parentId: request.parentId,
      authorId: 'current-user-id', // TODO: Get from auth context
      authorName: 'Current User', // TODO: Get from auth context
      authorAvatar: undefined,
      content: request.content,
      mentions: request.mentions || [],
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.comments.set(comment.id, comment);

    // Create notifications for mentions
    await this.createNotifications(comment);

    return comment;
  }

  async updateComment(request: UpdateCommentRequest): Promise<ArticleComment> {
    const comment = this.comments.get(request.commentId);
    if (!comment) {
      throw new Error(`Comment ${request.commentId} not found`);
    }

    const updatedComment: ArticleComment = {
      ...comment,
      content: request.content,
      mentions: request.mentions || comment.mentions,
      updatedAt: new Date().toISOString(),
    };

    this.comments.set(comment.id, updatedComment);
    return updatedComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    // Delete the comment and all its replies
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    // Delete replies first
    const replies = Array.from(this.comments.values()).filter(
      (c) => c.parentId === commentId
    );
    for (const reply of replies) {
      this.comments.delete(reply.id);
    }

    // Delete the comment itself
    this.comments.delete(commentId);
  }

  async getComment(commentId: string): Promise<ArticleComment | null> {
    return this.comments.get(commentId) || null;
  }

  async getCommentThreads(
    filters: CommentFilters,
    sort: CommentSortOrder = 'newest'
  ): Promise<CommentThread[]> {
    // Get all root comments (no parent) for this article
    const rootComments = Array.from(this.comments.values()).filter(
      (c) =>
        c.articleId === filters.articleId &&
        !c.parentId &&
        (!filters.showResolved ? !c.resolved : true) &&
        (!filters.showOnlyMentions ||
          (filters.userId && c.mentions.includes(filters.userId)))
    );

    // Sort root comments
    rootComments.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Build threads
    const threads: CommentThread[] = [];
    for (const rootComment of rootComments) {
      const replies = await this.getReplies(rootComment.id);
      threads.push({
        rootComment,
        replies,
        replyCount: replies.length,
      });
    }

    return threads;
  }

  async getReplies(parentId: string): Promise<ArticleComment[]> {
    const replies = Array.from(this.comments.values())
      .filter((c) => c.parentId === parentId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return replies;
  }

  async resolveComment(
    request: ResolveCommentRequest
  ): Promise<ArticleComment> {
    const comment = this.comments.get(request.commentId);
    if (!comment) {
      throw new Error(`Comment ${request.commentId} not found`);
    }

    const updatedComment: ArticleComment = {
      ...comment,
      resolved: request.resolved,
      resolvedBy: request.resolved ? 'current-user-id' : undefined,
      resolvedAt: request.resolved ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.comments.set(comment.id, updatedComment);

    // Create notification for resolution
    if (request.resolved && comment.authorId !== 'current-user-id') {
      const notification: CommentNotification = {
        id: this.generateId(),
        userId: comment.authorId,
        commentId: comment.id,
        articleId: comment.articleId,
        type: 'resolution',
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.notifications.set(notification.id, notification);
    }

    return updatedComment;
  }

  async createNotifications(comment: ArticleComment): Promise<void> {
    // Create notifications for mentions
    for (const userId of comment.mentions) {
      if (userId !== comment.authorId) {
        const notification: CommentNotification = {
          id: this.generateId(),
          userId,
          commentId: comment.id,
          articleId: comment.articleId,
          type: 'mention',
          read: false,
          createdAt: new Date().toISOString(),
        };
        this.notifications.set(notification.id, notification);
      }
    }

    // Create notification for parent comment author (reply)
    if (comment.parentId) {
      const parentComment = this.comments.get(comment.parentId);
      if (parentComment && parentComment.authorId !== comment.authorId) {
        const notification: CommentNotification = {
          id: this.generateId(),
          userId: parentComment.authorId,
          commentId: comment.id,
          articleId: comment.articleId,
          type: 'reply',
          read: false,
          createdAt: new Date().toISOString(),
        };
        this.notifications.set(notification.id, notification);
      }
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      this.notifications.set(notificationId, { ...notification, read: true });
    }
  }

  async getUserNotifications(userId: string): Promise<CommentNotification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId && !n.read)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Factory function to create comment service
 */
export function createCommentService(): CommentService {
  // TODO: In production, create SupabaseCommentService
  return new InMemoryCommentService();
}

export default createCommentService;
