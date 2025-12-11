/**
 * ScheduledArticlesQueue Component
 *
 * Displays upcoming scheduled articles with ability to manage,
 * reschedule, or cancel auto-publish.
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  Shield,
  Sparkles,
  RotateCcw,
  ArrowUpRight,
  Filter,
  Search,
} from 'lucide-react';
import type { RiskLevel, PublishLogStatus } from '@content-engine/publishing';

interface ScheduledArticle {
  id: string;
  articleId: string;
  title: string;
  scheduledFor: string;
  status: PublishLogStatus;
  qualityScore: number;
  riskLevel: RiskLevel;
  riskScore: number;
  reviewedBy?: string;
  reviewedAt?: string;
  wpPostId?: number;
  publishedUrl?: string;
  error?: string;
  attempts: number;
  category?: string;
  contributor?: string;
}

interface ScheduledArticlesQueueProps {
  articles: ScheduledArticle[];
  onCancel: (id: string) => Promise<void>;
  onReschedule: (id: string, newDate: Date) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onView: (articleId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<
  PublishLogStatus,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: 'Scheduled',
  },
  publishing: {
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    label: 'Publishing...',
  },
  published: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: 'Published',
  },
  failed: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    label: 'Failed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    label: 'Cancelled',
  },
};

const riskConfig: Record<RiskLevel, { color: string; bgColor: string }> = {
  LOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  MEDIUM: { color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  HIGH: { color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  CRITICAL: { color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

type FilterStatus = 'all' | 'pending' | 'published' | 'failed';

export function ScheduledArticlesQueue({
  articles,
  onCancel,
  onReschedule,
  onRetry,
  onView,
  isLoading = false,
  className = '',
}: ScheduledArticlesQueueProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        filtered = filtered.filter((a) => a.status === 'pending' || a.status === 'publishing');
      } else {
        filtered = filtered.filter((a) => a.status === filterStatus);
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.category?.toLowerCase().includes(query) ||
          a.contributor?.toLowerCase().includes(query)
      );
    }

    // Sort by scheduled date (upcoming first)
    return filtered.sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }, [articles, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const pending = articles.filter((a) => a.status === 'pending').length;
    const published = articles.filter((a) => a.status === 'published').length;
    const failed = articles.filter((a) => a.status === 'failed').length;
    return { pending, published, failed, total: articles.length };
  }, [articles]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
      return { date: date.toLocaleDateString(), time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), relative: 'Past' };
    }

    let relative = '';
    if (days > 0) {
      relative = `${days}d`;
    } else if (hours > 0) {
      relative = `${hours}h`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      relative = `${minutes}m`;
    }

    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      relative,
    };
  };

  if (isLoading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-700 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-700/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-forge-indigo/10 rounded-lg">
            <Calendar className="w-5 h-5 text-forge-indigo" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Scheduled Queue</h3>
            <p className="text-xs text-gray-400">{stats.total} articles in queue</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded text-blue-400 text-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{stats.pending}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded text-emerald-400 text-sm">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{stats.published}</span>
          </div>
          {stats.failed > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded text-red-400 text-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{stats.failed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-void-900 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-void-900 rounded-lg">
          {(['all', 'pending', 'published', 'failed'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filterStatus === status
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Article List */}
      <div className="glass-card overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No scheduled articles found</p>
            <p className="text-sm text-gray-500 mt-1">
              {filterStatus !== 'all'
                ? 'Try changing the filter'
                : 'Articles will appear here when scheduled for auto-publish'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredArticles.map((article) => {
              const statusCfg = statusConfig[article.status];
              const riskCfg = riskConfig[article.riskLevel];
              const StatusIcon = statusCfg.icon;
              const dateInfo = formatDate(article.scheduledFor);
              const isActionLoading = actionLoading === article.id;

              return (
                <div
                  key={article.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className={`p-2 rounded-lg ${statusCfg.bgColor}`}>
                      <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
                    </div>

                    {/* Article Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {article.category && (
                              <span>{article.category}</span>
                            )}
                            {article.contributor && (
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                {article.contributor}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Scheduled Time */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-white">
                            {dateInfo.date}
                          </p>
                          <p className="text-xs text-gray-400">{dateInfo.time}</p>
                          {article.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-400 mt-1">
                              <Clock className="w-3 h-3" />
                              in {dateInfo.relative}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metrics & Actions Row */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          {/* Quality Score */}
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-sm text-gray-300">
                              {article.qualityScore}
                            </span>
                          </div>

                          {/* Risk Level */}
                          <div
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${riskCfg.bgColor}`}
                          >
                            <Shield className={`w-3.5 h-3.5 ${riskCfg.color}`} />
                            <span className={`text-xs ${riskCfg.color}`}>
                              {article.riskLevel}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${statusCfg.bgColor} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>

                          {/* Error Message */}
                          {article.error && (
                            <span className="text-xs text-red-400 truncate max-w-[200px]">
                              {article.error}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {article.status === 'published' && article.publishedUrl && (
                            <a
                              href={article.publishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                              title="View Published"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          )}

                          {article.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(article.id)}
                              disabled={isActionLoading}
                              className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors disabled:opacity-50"
                              title="Retry Publishing"
                            >
                              <RotateCcw
                                className={`w-4 h-4 ${isActionLoading ? 'animate-spin' : ''}`}
                              />
                            </button>
                          )}

                          <button
                            onClick={() => onView(article.articleId)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="View Article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {article.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(article.id)}
                              disabled={isActionLoading}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                              title="Cancel"
                            >
                              <XCircle
                                className={`w-4 h-4 ${isActionLoading ? 'animate-pulse' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScheduledArticlesQueue;
