import { useState } from 'react';
import { ArticleComment } from '@content-engine/types';
import { Button } from '../primitives/Button';
import { GlassCard } from '../components/GlassCard';
import { CommentForm } from './CommentForm';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface CommentItemProps {
  comment: ArticleComment;
  currentUserId?: string;
  onReply?: (parentId: string, content: string, mentions: string[]) => void;
  onEdit?: (commentId: string, content: string, mentions: string[]) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string, resolved: boolean) => void;
  showReplyButton?: boolean;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  showReplyButton = true,
  isReply = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isOwnComment = currentUserId === comment.authorId;
  const canEdit = isOwnComment && onEdit;
  const canDelete = isOwnComment && onDelete;
  const canResolve = !comment.parentId && onResolve; // Only root comments can be resolved

  const handleEdit = (content: string, mentions: string[]) => {
    if (onEdit) {
      onEdit(comment.id, content, mentions);
      setIsEditing(false);
    }
  };

  const handleReply = (content: string, mentions: string[]) => {
    if (onReply) {
      onReply(comment.id, content, mentions);
      setIsReplying(false);
    }
  };

  const handleDelete = () => {
    if (
      onDelete &&
      window.confirm('Are you sure you want to delete this comment?')
    ) {
      onDelete(comment.id);
    }
  };

  const handleResolve = () => {
    if (onResolve) {
      onResolve(comment.id, !comment.resolved);
    }
  };

  // Highlight @mentions in content
  const renderContent = () => {
    if (!comment.content) return null;

    const parts = comment.content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="text-forge-accent font-medium hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <GlassCard
      variant="panel"
      hover={false}
      className={`p-4 ${comment.resolved ? 'opacity-60' : ''} ${
        isReply ? 'ml-8 border-l-2 border-forge-accent/30' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.authorAvatar ? (
            <img
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="w-8 h-8 rounded-full ring-2 ring-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {comment.authorName}
              </span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-slate-600">(edited)</span>
              )}
              {comment.resolved && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Resolved
                </span>
              )}
            </div>

            {/* Actions menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="w-6 h-6 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {showActions && (
                <div className="absolute right-0 top-8 w-48 glass-card rounded-lg shadow-xl z-10">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2 rounded-t-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {canResolve && (
                    <button
                      onClick={() => {
                        handleResolve();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      {comment.resolved ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Unresolve
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </>
                      )}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-b-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                initialValue={comment.content}
                placeholder="Edit your comment..."
                submitLabel="Save"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div
                className={`text-sm text-slate-300 leading-relaxed ${
                  comment.resolved ? 'line-through' : ''
                }`}
              >
                {renderContent()}
              </div>

              {/* Reply button */}
              {showReplyButton && onReply && !comment.resolved && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying(!isReplying)}
                    leftIcon={<Reply className="w-3 h-3" />}
                    className="text-xs"
                  >
                    Reply
                  </Button>
                </div>
              )}

              {/* Reply form */}
              {isReplying && (
                <div className="mt-3">
                  <CommentForm
                    onSubmit={handleReply}
                    onCancel={() => setIsReplying(false)}
                    placeholder={`Reply to ${comment.authorName}...`}
                    submitLabel="Reply"
                    autoFocus
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default CommentItem;
