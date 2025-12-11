import { useState, useMemo } from 'react';
import { Activity, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { QueueStatsCard } from './QueueStatsCard';
import { QueueItemCard } from './QueueItemCard';
import { getQueueService } from '@content-engine/generation';
import type { QueueItem, QueueStatus, QueueStats } from '@content-engine/generation';

interface GenerationQueueProps {
  items: QueueItem[];
  stats?: QueueStats | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddToQueue?: () => void;
  onViewItem?: (item: QueueItem) => void;
  onRetryItem?: (item: QueueItem) => void;
  onCancelItem?: (item: QueueItem) => void;
  onRemoveItem?: (item: QueueItem) => void;
  onPriorityUp?: (item: QueueItem) => void;
  onPriorityDown?: (item: QueueItem) => void;
  onClearCompleted?: () => void;
  onClearFailed?: () => void;
  className?: string;
}

type FilterStatus = 'all' | QueueStatus;

export function GenerationQueue({
  items,
  stats,
  isLoading = false,
  onRefresh,
  onAddToQueue,
  onViewItem,
  onRetryItem,
  onCancelItem,
  onRemoveItem,
  onPriorityUp,
  onPriorityDown,
  onClearCompleted,
  onClearFailed,
  className = '',
}: GenerationQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const queueService = getQueueService();

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.contentIdeaId?.toLowerCase().includes(query) ||
          item.articleId?.toLowerCase().includes(query)
      );
    }

    // Sort by priority and creation time
    return queueService.sortQueue(filtered);
  }, [items, statusFilter, searchQuery, queueService]);

  // Calculate computed stats if not provided
  const computedStats = useMemo(() => {
    if (stats) return stats;
    return queueService.calculateStats(items);
  }, [stats, items, queueService]);

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'all', count: items.length },
    { label: 'Pending', value: 'pending', count: computedStats.pending },
    { label: 'Processing', value: 'processing', count: computedStats.processing },
    { label: 'Completed', value: 'completed', count: computedStats.completed },
    { label: 'Failed', value: 'failed', count: computedStats.failed },
  ];

  return (
    <div className={['space-y-6', className].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Generation Queue</h2>
            <p className="text-sm text-slate-400">
              {items.length} item{items.length !== 1 ? 's' : ''} in queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button
              variant="secondary"
              size="md"
              onClick={onRefresh}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              disabled={isLoading}
            >
              Refresh
            </Button>
          )}
          {onAddToQueue && (
            <Button
              variant="primary"
              size="md"
              onClick={onAddToQueue}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add to Queue
            </Button>
          )}
        </div>
      </div>

      {/* Stats Card */}
      <QueueStatsCard stats={computedStats} isLoading={isLoading} />

      {/* Search and Filters */}
      <GlassCard variant="panel" hover={false}>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by ID, content idea, or article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={[
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all border',
                    statusFilter === tab.value
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-300',
                  ].join(' ')}
                >
                  {tab.label}
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-xs font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              {computedStats.completed > 0 && onClearCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearCompleted}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Clear Completed ({computedStats.completed})
                </Button>
              )}
              {computedStats.failed > 0 && onClearFailed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFailed}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Clear Failed ({computedStats.failed})
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Queue Items */}
      {isLoading && filteredItems.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} variant="default" hover={false}>
              <div className="p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 rounded bg-white/5" />
                    <div className="w-48 h-3 rounded bg-white/5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="w-full h-12 rounded-lg bg-white/5" />
                  <div className="w-full h-12 rounded-lg bg-white/5" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <GlassCard variant="panel" hover={false}>
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <Activity className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">No items in queue</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No items match your current filters. Try adjusting your search or filter criteria.'
                : 'Your generation queue is empty. Add content ideas or articles to get started.'}
            </p>
            {onAddToQueue && !searchQuery && statusFilter === 'all' && (
              <Button
                variant="primary"
                size="md"
                onClick={onAddToQueue}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add to Queue
              </Button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const position = queueService.getQueuePosition(items, item.id);
            const estimatedWaitTime =
              position && computedStats.avgProcessingTime
                ? queueService.calculateEstimatedWaitTime(computedStats, position)
                : undefined;

            return (
              <QueueItemCard
                key={item.id}
                item={item}
                position={position}
                estimatedWaitTime={estimatedWaitTime}
                onView={onViewItem}
                onRetry={onRetryItem}
                onCancel={onCancelItem}
                onRemove={onRemoveItem}
                onPriorityUp={onPriorityUp}
                onPriorityDown={onPriorityDown}
                showActions={true}
              />
            );
          })}

          {/* Results Count */}
          <div className="text-center py-4">
            <p className="text-sm text-slate-400">
              Showing {filteredItems.length} of {items.length} item{items.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationQueue;
