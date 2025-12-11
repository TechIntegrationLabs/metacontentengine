import { useState } from 'react';
import { CommentThread as CommentThreadType } from '@content-engine/types';
import { CommentItem } from './CommentItem';
import { Button } from '../primitives/Button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommentThreadProps {
  thread: CommentThreadType;
  currentUserId?: string;
  onReply?: (parentId: string, content: string, mentions: string[]) => void;
  onEdit?: (commentId: string, content: string, mentions: string[]) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string, resolved: boolean) => void;
  defaultExpanded?: boolean;
}

export function CommentThread({
  thread,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  defaultExpanded = true,
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasReplies = thread.replyCount > 0;

  return (
    <div className="space-y-3">
      {/* Root comment */}
      <CommentItem
        comment={thread.rootComment}
        currentUserId={currentUserId}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onResolve={onResolve}
        showReplyButton={true}
      />

      {/* Replies */}
      {hasReplies && (
        <div className="space-y-3">
          {/* Toggle replies button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            leftIcon={
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            }
            className="ml-11 text-xs text-slate-500 hover:text-slate-300"
          >
            {isExpanded ? 'Hide' : 'Show'} {thread.replyCount}{' '}
            {thread.replyCount === 1 ? 'reply' : 'replies'}
          </Button>

          {/* Reply list */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden"
              >
                {thread.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showReplyButton={false}
                    isReply={true}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default CommentThread;
