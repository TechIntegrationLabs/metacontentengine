/**
 * GenerationQueue Component
 *
 * Full generation queue management interface with stats,
 * filters, and bulk operations.
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import type { QueueItem, QueueStats, QueueStatus } from '@content-engine/generation';
import { getQueueService } from '@content-engine/generation';
import { QueueStatsCard } from './QueueStatsCard';
import { QueueItemCard } from './QueueItemCard';

interface GenerationQueueProps {
  items: QueueItem[];
  stats: QueueStats;
  isLoading?: boolean;
  onAddToQueue: () => void;
  onCancel: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onPriorityChange: (id: string, delta: number) => Promise<void>;
  onClearCompleted: () => Promise<void>;
  onClearFailed: () => Promise<void>;
  onRefresh: () => void;
  className?: string;
}

type StatusFilter = 'all' | QueueStatus;

export function GenerationQueue({
  items,
  stats,
  isLoading = false,
  onAddToQueue,
  onCancel,
  onRetry,
  onPriorityChange,
  onClearCompleted,
  onClearFailed,
  onRefresh,
  className = '',
}: GenerationQueueProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const queueService = useMemo(() => getQueueService(), []);

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
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

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await onCancel(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await onRetry(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePriorityUp = async (id: string) => {
    setActionLoading(id);
    try {
      await onPriorityChange(id, 1);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePriorityDown = async (id: string) => {
    setActionLoading(id);
    try {
      await onPriorityChange(id, -1);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearCompleted = async () => {
    setBulkLoading(true);
    try {
      await onClearCompleted();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClearFailed = async () => {
    setBulkLoading(true);
    try {
      await onClearFailed();
    } finally {
      setBulkLoading(false);
    }
  };

  const getPositionInQueue = (item: QueueItem): number | undefined => {
    if (item.status !== 'pending' && item.status !== 'scheduled') {
      return undefined;
    }

    const pendingItems = queueService.filterByStatus(items, ['pending', 'scheduled']);
    const sorted = queueService.sortQueue(pendingItems);
    const index = sorted.findIndex((i) => i.id === item.id);
    return index >= 0 ? index + 1 : undefined;
  };

  const getEstimatedWaitTime = (item: QueueItem, position?: number): string | undefined => {
    if (!position) return undefined;
    const waitTime = queueService.calculateEstimatedWaitTime(stats, position);
    return queueService.formatWaitTime(waitTime);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-forge-indigo/10 rounded-xl">
            <Activity className="w-6 h-6 text-forge-indigo" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Generation Queue</h2>
            <p className="text-sm text-gray-400">
              {stats.pending + stats.processing} items active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onAddToQueue}
            className="px-4 py-2 bg-forge-orange hover:bg-forge-orange/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Queue
          </button>
        </div>
      </div>

      {/* Stats */}
      <QueueStatsCard stats={stats} isLoading={isLoading} />

      {/* Filters & Actions */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-void-900 rounded-lg">
            {(['all', 'pending', 'processing', 'completed', 'failed'] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    statusFilter === status
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {stats.completed > 0 && (
              <button
                onClick={handleClearCompleted}
                disabled={bulkLoading}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Clear Completed
              </button>
            )}
            {stats.failed > 0 && (
              <button
                onClick={handleClearFailed}
                disabled={bulkLoading}
                className="px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Clear Failed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-32 bg-gray-700/50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            {statusFilter !== 'all' ? 'No items match your filter' : 'Queue is empty'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {statusFilter !== 'all'
              ? 'Try adjusting your filter'
              : 'Add content ideas or articles to start generating'}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={onAddToQueue}
              className="px-4 py-2 bg-forge-orange hover:bg-forge-orange/90 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const position = getPositionInQueue(item);
            const estimatedWaitTime = getEstimatedWaitTime(item, position);

            return (
              <QueueItemCard
                key={item.id}
                item={item}
                position={position}
                estimatedWaitTime={estimatedWaitTime}
                onCancel={handleCancel}
                onRetry={handleRetry}
                onPriorityUp={handlePriorityUp}
                onPriorityDown={handlePriorityDown}
                isLoading={actionLoading === item.id}
              />
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {filteredItems.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredItems.length} of {items.length} items
        </div>
      )}
    </div>
  );
}

export default GenerationQueue;
