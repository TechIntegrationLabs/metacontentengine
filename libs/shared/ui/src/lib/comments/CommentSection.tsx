import { useState, useEffect } from 'react';
import {
  CommentThread as CommentThreadType,
  CommentFilters,
  CommentSortOrder,
} from '@content-engine/types';
import { CommentService } from '@content-engine/publishing';
import { CommentThread } from './CommentThread';
import { CommentForm } from './CommentForm';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../primitives/Button';
import {
  MessageSquare,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle,
  AtSign,
} from 'lucide-react';

export interface CommentSectionProps {
  articleId: string;
  currentUserId?: string;
  commentService: CommentService;
  className?: string;
}

export function CommentSection({
  articleId,
  currentUserId,
  commentService,
  className = '',
}: CommentSectionProps) {
  const [threads, setThreads] = useState<CommentThreadType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('newest');
  const [showResolved, setShowResolved] = useState(false);
  const [showOnlyMentions, setShowOnlyMentions] = useState(false);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const filters: CommentFilters = {
        articleId,
        showResolved,
        showOnlyMentions,
        userId: currentUserId,
      };

      const loadedThreads = await commentService.getCommentThreads(
        filters,
        sortOrder
      );
      setThreads(loadedThreads);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [articleId, sortOrder, showResolved, showOnlyMentions]);

  const handleAddComment = async (content: string, mentions: string[]) => {
    try {
      await commentService.createComment({
        articleId,
        content,
        mentions,
      });
      await loadComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleReply = async (
    parentId: string,
    content: string,
    mentions: string[]
  ) => {
    try {
      await commentService.createComment({
        articleId,
        parentId,
        content,
        mentions,
      });
      await loadComments();
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleEdit = async (
    commentId: string,
    content: string,
    mentions: string[]
  ) => {
    try {
      await commentService.updateComment({
        commentId,
        content,
        mentions,
      });
      await loadComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      await commentService.resolveComment({
        commentId,
        resolved,
      });
      await loadComments();
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const totalComments = threads.reduce(
    (sum, thread) => sum + 1 + thread.replyCount,
    0
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-forge-accent" />
          <h3 className="text-lg font-bold text-white">
            Comments ({totalComments})
          </h3>
        </div>

        {/* Filters & Sort */}
        <div className="flex items-center gap-2">
          <Button
            variant={showResolved ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
            leftIcon={<CheckCircle className="w-4 h-4" />}
            className="text-xs"
          >
            Resolved
          </Button>

          <Button
            variant={showOnlyMentions ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowOnlyMentions(!showOnlyMentions)}
            leftIcon={<AtSign className="w-4 h-4" />}
            className="text-xs"
          >
            Mentions
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSort}
            leftIcon={
              sortOrder === 'newest' ? (
                <SortDesc className="w-4 h-4" />
              ) : (
                <SortAsc className="w-4 h-4" />
              )
            }
            className="text-xs"
          >
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Button>
        </div>
      </div>

      {/* Add comment form */}
      <GlassCard variant="panel" className="p-4">
        <CommentForm
          onSubmit={handleAddComment}
          placeholder="Add a comment..."
          submitLabel="Comment"
        />
      </GlassCard>

      {/* Comment threads */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-forge-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 mt-4">Loading comments...</p>
        </div>
      ) : threads.length === 0 ? (
        <GlassCard variant="panel" className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">
            {showOnlyMentions
              ? 'No mentions found'
              : showResolved
              ? 'No comments yet'
              : 'No active comments'}
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Be the first to share your thoughts
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <CommentThread
              key={thread.rootComment.id}
              thread={thread}
              currentUserId={currentUserId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSection;
