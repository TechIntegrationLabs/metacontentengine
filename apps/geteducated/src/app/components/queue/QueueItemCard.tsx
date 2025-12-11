/**
 * QueueItemCard Component
 *
 * Displays a single queue item with progress, status, and actions.
 */

import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  XCircle,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Eye,
  Trash2,
  FileText,
  Lightbulb,
} from 'lucide-react';
import type { QueueItem, QueueStatus } from '@content-engine/generation';

interface QueueItemCardProps {
  item: QueueItem;
  position?: number;
  estimatedWaitTime?: string;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onPriorityUp?: (id: string) => void;
  onPriorityDown?: (id: string) => void;
  onView?: (id: string) => void;
  onRemove?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<
  QueueStatus,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  pending: {
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Pending',
  },
  scheduled: {
    icon: Calendar,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Scheduled',
  },
  processing: {
    icon: Loader2,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    label: 'Completed',
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Failed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    label: 'Cancelled',
  },
};

export function QueueItemCard({
  item,
  position,
  estimatedWaitTime,
  onCancel,
  onRetry,
  onPriorityUp,
  onPriorityDown,
  onView,
  onRemove,
  isLoading = false,
  className = '',
}: QueueItemCardProps) {
  const status = statusConfig[item.status];
  const StatusIcon = status.icon;

  const isActionable = item.status === 'pending' || item.status === 'scheduled';
  const canRetry = item.status === 'failed' && item.attempts < item.maxAttempts;
  const canRemove = item.status === 'completed' || item.status === 'cancelled' || item.status === 'failed';

  const formatDate = (date?: Date | string) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getProgressWidth = (): string => {
    switch (item.status) {
      case 'completed':
        return '100%';
      case 'processing':
        // Estimate progress based on time
        if (item.processingStartedAt) {
          const elapsed = Date.now() - new Date(item.processingStartedAt).getTime();
          const avgTime = 3 * 60 * 1000; // 3 minutes
          const progress = Math.min(95, (elapsed / avgTime) * 100);
          return `${progress}%`;
        }
        return '10%';
      default:
        return '0%';
    }
  };

  return (
    <div
      className={`glass-card overflow-hidden ${
        item.status === 'processing' ? `border ${status.borderColor}` : ''
      } ${className}`}
    >
      {/* Progress Bar */}
      {item.status === 'processing' && (
        <div className="h-1 bg-void-950">
          <div
            className="h-full bg-amber-500 transition-all duration-1000"
            style={{ width: getProgressWidth() }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg ${status.bgColor}`}>
            <StatusIcon
              className={`w-5 h-5 ${status.color} ${
                item.status === 'processing' ? 'animate-spin' : ''
              }`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {item.contentIdeaId ? (
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-400" />
                  )}
                  <h4 className="font-medium text-white">
                    {item.contentIdeaId ? 'Content Idea' : 'Article Regeneration'}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  ID: {item.contentIdeaId || item.articleId}
                </p>
              </div>

              {/* Position & Priority */}
              {isActionable && position !== undefined && (
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-white">#{position}</p>
                  <p className="text-xs text-gray-500">in queue</p>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
              {/* Priority */}
              <div className="flex items-center gap-1">
                <span>Priority:</span>
                <span className="font-medium text-gray-300">{item.priority}</span>
              </div>

              {/* Attempts */}
              {item.attempts > 0 && (
                <div className="flex items-center gap-1">
                  <span>Attempts:</span>
                  <span className="font-medium text-gray-300">
                    {item.attempts}/{item.maxAttempts}
                  </span>
                </div>
              )}

              {/* Created */}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(item.createdAt)}</span>
              </div>

              {/* Scheduled For */}
              {item.scheduledFor && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>{formatDate(item.scheduledFor)}</span>
                </div>
              )}

              {/* Completed At */}
              {item.completedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Completed {formatDate(item.completedAt)}</span>
                </div>
              )}

              {/* Estimated Wait */}
              {isActionable && estimatedWaitTime && (
                <div className="flex items-center gap-1 text-blue-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{estimatedWaitTime}</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {item.lastError && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 line-clamp-2">{item.lastError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
          {/* Priority Controls */}
          {isActionable && (
            <div className="flex items-center gap-1 mr-auto">
              {onPriorityUp && (
                <button
                  onClick={() => onPriorityUp(item.id)}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                  title="Increase Priority"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
              {onPriorityDown && (
                <button
                  onClick={() => onPriorityDown(item.id)}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                  title="Decrease Priority"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* View */}
          {onView && (
            <button
              onClick={() => onView(item.contentIdeaId || item.articleId || item.id)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {/* Retry */}
          {canRetry && onRetry && (
            <button
              onClick={() => onRetry(item.id)}
              disabled={isLoading}
              className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded transition-colors disabled:opacity-50"
              title="Retry"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Cancel */}
          {isActionable && onCancel && (
            <button
              onClick={() => onCancel(item.id)}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          {/* Remove */}
          {canRemove && onRemove && (
            <button
              onClick={() => onRemove(item.id)}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
              title="Remove from list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueueItemCard;
