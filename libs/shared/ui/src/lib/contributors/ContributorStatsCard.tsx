import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Edit3,
  Hash,
  Clock,
  Award,
} from 'lucide-react';
import type { ContributorStats } from '@content-engine/types';
import { GlassCard } from '../components/GlassCard';

interface ContributorStatsCardProps {
  stats: ContributorStats;
  contributorName?: string;
  contributorAvatar?: string;
  className?: string;
  onViewDetails?: () => void;
}

export default function ContributorStatsCard({
  stats,
  contributorName,
  contributorAvatar,
  className = '',
  onViewDetails,
}: ContributorStatsCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10';
    if (score >= 60) return 'bg-amber-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return 'border-emerald-500/20';
    if (score >= 60) return 'border-amber-500/20';
    if (score >= 40) return 'border-orange-500/20';
    return 'border-red-500/20';
  };

  const getPerformanceTier = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const formatRevisionRate = (rate: number) => {
    if (rate === 0) return 'No revisions';
    if (rate < 1) return `${rate.toFixed(1)} avg`;
    return `${Math.round(rate)} avg`;
  };

  const formatTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <GlassCard
      variant="elevated"
      className={`p-6 ${className}`}
      onClick={onViewDetails}
      style={{ cursor: onViewDetails ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {contributorAvatar ? (
            <img
              src={contributorAvatar}
              alt={contributorName}
              className="w-12 h-12 rounded-full border-2 border-void-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
          )}
          <div>
            {contributorName && (
              <h3 className="text-lg font-display font-bold text-void-100">
                {contributorName}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-void-400">Performance Score</span>
              {stats.rank && (
                <span className="text-xs font-mono text-void-500">
                  Rank #{stats.rank}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Performance Score Badge */}
        <div
          className={`flex flex-col items-center px-4 py-2 rounded-xl border ${getScoreBorder(
            stats.performanceScore
          )} ${getScoreBg(stats.performanceScore)}`}
        >
          <div className={`text-3xl font-bold ${getScoreColor(stats.performanceScore)}`}>
            {stats.performanceScore}
          </div>
          <div className="text-xs text-void-400 mt-0.5">
            {getPerformanceTier(stats.performanceScore)}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Articles */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-void-900/30 border border-void-700/50">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-void-400 uppercase tracking-wider mb-1">
              Articles
            </div>
            <div className="text-xl font-bold text-void-100">{stats.totalArticles}</div>
          </div>
        </div>

        {/* Average Quality */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-void-900/30 border border-void-700/50">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-void-400 uppercase tracking-wider mb-1">
              Avg Quality
            </div>
            <div className="text-xl font-bold text-void-100">
              {Math.round(stats.averageQualityScore)}
            </div>
          </div>
        </div>

        {/* Publication Success Rate */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-void-900/30 border border-void-700/50">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-void-400 uppercase tracking-wider mb-1">
              Published
            </div>
            <div className="text-xl font-bold text-void-100">
              {Math.round(stats.publicationSuccessRate)}%
            </div>
          </div>
        </div>

        {/* Revision Rate */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-void-900/30 border border-void-700/50">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Edit3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-void-400 uppercase tracking-wider mb-1">
              Revisions
            </div>
            <div className="text-sm font-bold text-void-100">
              {formatRevisionRate(stats.revisionRate)}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-3 pt-4 border-t border-void-700/50">
        {/* Average Word Count */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-void-400">
            <Hash className="w-4 h-4" />
            <span>Avg Word Count</span>
          </div>
          <span className="text-void-100 font-mono font-semibold">
            {stats.averageWordCount.toLocaleString()}
          </span>
        </div>

        {/* Last Article */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-void-400">
            <Clock className="w-4 h-4" />
            <span>Last Article</span>
          </div>
          <span className="text-void-100 font-medium">
            {formatTimeSince(stats.lastArticleDate)}
          </span>
        </div>

        {/* Top Topics */}
        {stats.topTopics.length > 0 && (
          <div className="pt-2">
            <div className="text-xs text-void-400 uppercase tracking-wider mb-2">
              Top Topics
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.topTopics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono"
                >
                  {topic}
                </span>
              ))}
              {stats.topTopics.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-md bg-void-700/50 text-void-400 border border-void-600">
                  +{stats.topTopics.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
