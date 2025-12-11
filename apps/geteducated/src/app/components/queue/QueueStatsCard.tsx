/**
 * QueueStatsCard Component
 *
 * Displays generation queue statistics with visual indicators.
 */

import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { QueueStats } from '@content-engine/generation';

interface QueueStatsCardProps {
  stats: QueueStats;
  isLoading?: boolean;
  className?: string;
}

export function QueueStatsCard({
  stats,
  isLoading = false,
  className = '',
}: QueueStatsCardProps) {
  const formatTime = (ms?: number): string => {
    if (!ms) return 'N/A';

    if (ms < 60 * 1000) {
      return `${Math.round(ms / 1000)}s`;
    }

    const minutes = Math.round(ms / (60 * 1000));

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className={`glass-card p-6 animate-pulse ${className}`}>
        <div className="h-6 w-32 bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalActive = stats.pending + stats.processing + stats.scheduled;

  return (
    <div className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-forge-indigo" />
          <h3 className="font-semibold text-white">Queue Status</h3>
        </div>
        {stats.estimatedWaitTime && stats.pending > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Est. wait: {formatTime(stats.estimatedWaitTime)}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Pending */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </div>

        {/* Scheduled */}
        <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
        </div>

        {/* Processing */}
        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Processing</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.processing}</p>
        </div>

        {/* Completed */}
        <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completed}</p>
        </div>

        {/* Failed */}
        <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Failed</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.failed}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6 text-gray-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>
              {stats.itemsLastHour} completed in last hour
            </span>
          </div>
          {stats.avgProcessingTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Avg: {formatTime(stats.avgProcessingTime)}</span>
            </div>
          )}
        </div>

        {totalActive > 0 && (
          <div className="text-gray-300">
            <span className="font-medium">{totalActive}</span> items in queue
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueStatsCard;
