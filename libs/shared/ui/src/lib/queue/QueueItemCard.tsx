import { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Ban,
  Lightbulb,
  FileText,
  ChevronUp,
  ChevronDown,
  Eye,
  RotateCw,
  X,
  Trash2,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../primitives/Button';
import type { QueueItem, QueueStatus } from '@content-engine/generation';

interface QueueItemCardProps {
  item: QueueItem;
  position?: number | null;
  estimatedWaitTime?: number;
  onView?: (item: QueueItem) => void;
  onRetry?: (item: QueueItem) => void;
  onCancel?: (item: QueueItem) => void;
  onRemove?: (item: QueueItem) => void;
  onPriorityUp?: (item: QueueItem) => void;
  onPriorityDown?: (item: QueueItem) => void;
  showActions?: boolean;
  className?: string;
}

export function QueueItemCard({
  item,
  position,
  estimatedWaitTime,
  onView,
  onRetry,
  onCancel,
  onRemove,
  onPriorityUp,
  onPriorityDown,
  showActions = true,
  className = '',
}: QueueItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusConfig = (
    status: QueueStatus
  ): {
    icon: typeof Clock;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  } => {
    const configs = {
      pending: {
        icon: Clock,
        label: 'Pending',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
      },
      scheduled: {
        icon: Calendar,
        label: 'Scheduled',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
      },
      processing: {
        icon: Play,
        label: 'Processing',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
      },
      completed: {
        icon: CheckCircle2,
        label: 'Completed',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
      },
      failed: {
        icon: XCircle,
        label: 'Failed',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
      },
      cancelled: {
        icon: Ban,
        label: 'Cancelled',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
      },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;
  const ContentIcon = item.contentIdeaId ? Lightbulb : FileText;

  const formatTime = (ms?: number): string => {
    if (!ms || ms < 60000) return 'Less than a minute';
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `~${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `~${hours}h ${remainingMins}m` : `~${hours}h`;
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate progress for processing items
  const getProgress = (): number => {
    if (item.status === 'completed') return 100;
    if (item.status === 'processing' && item.processingStartedAt) {
      const elapsed = Date.now() - new Date(item.processingStartedAt).getTime();
      const avgTime = 3 * 60 * 1000; // 3 minutes
      return Math.min(95, Math.round((elapsed / avgTime) * 100));
    }
    return 0;
  };

  const progress = getProgress();
  const showProgress = item.status === 'processing' && progress > 0;

  return (
    <GlassCard
      variant="default"
      hover={true}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5 space-y-4">
        {/* Progress Bar */}
        {showProgress && (
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Status Icon */}
            <div className={['p-2 rounded-xl border flex-shrink-0', statusConfig.bgColor, statusConfig.borderColor].join(' ')}>
              <StatusIcon className={['w-4 h-4', statusConfig.color].join(' ')} />
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ContentIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-400 font-medium">
                  {item.contentIdeaId ? 'Content Idea' : 'Article'}
                </span>
                <span
                  className={[
                    'px-2 py-0.5 rounded-full text-xs font-bold border',
                    statusConfig.color,
                    statusConfig.bgColor,
                    statusConfig.borderColor,
                  ].join(' ')}
                >
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-300 truncate">
                ID: {item.id.slice(0, 8)}...
              </p>
              {position && (item.status === 'pending' || item.status === 'scheduled') && (
                <p className="text-xs text-slate-400 mt-1">
                  Position in queue: <span className="font-bold text-indigo-400">#{position}</span>
                </p>
              )}
            </div>
          </div>

          {/* Priority Controls */}
          {showActions && (item.status === 'pending' || item.status === 'scheduled') && (
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => onPriorityUp?.(item)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Increase priority"
              >
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onPriorityDown?.(item)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Decrease priority"
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Meta Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Priority</p>
              <p className="text-sm font-bold text-white">{item.priority}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Attempts</p>
              <p className="text-sm font-bold text-white">
                {item.attempts}/{item.maxAttempts}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm font-medium text-slate-300">{formatDate(item.createdAt)}</p>
            </div>
          </div>

          {item.scheduledFor && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Scheduled</p>
                <p className="text-sm font-medium text-purple-300">{formatDate(item.scheduledFor)}</p>
              </div>
            </div>
          )}

          {item.completedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-sm font-medium text-emerald-300">{formatDate(item.completedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Estimated Wait Time */}
        {estimatedWaitTime && (item.status === 'pending' || item.status === 'scheduled') && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Estimated wait time</p>
              <p className="text-sm font-bold text-indigo-400">{formatTime(estimatedWaitTime)}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {item.status === 'failed' && item.lastError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-400 mb-1">Error</p>
                <p className="text-xs text-red-300 font-mono break-words">{item.lastError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onView(item)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                View
              </Button>
            )}

            {item.status === 'failed' && onRetry && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onRetry(item)}
                leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Retry
              </Button>
            )}

            {(item.status === 'pending' || item.status === 'scheduled' || item.status === 'processing') &&
              onCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(item)}
                  leftIcon={<Ban className="w-3.5 h-3.5" />}
                >
                  Cancel
                </Button>
              )}

            {(item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') &&
              onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(item)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Remove
                </Button>
              )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default QueueItemCard;
