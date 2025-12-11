import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Edit3,
  ArrowUpDown,
} from 'lucide-react';
import type { ContributorStats, Contributor } from '@content-engine/types';
import { GlassCard } from '../components/GlassCard';

interface ContributorRankingListProps {
  stats: ContributorStats[];
  contributors: Contributor[];
  className?: string;
  onContributorClick?: (contributorId: string) => void;
}

type SortField = 'rank' | 'quality' | 'articles' | 'published';

export default function ContributorRankingList({
  stats,
  contributors,
  className = '',
  onContributorClick,
}: ContributorRankingListProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const contributorsMap = new Map(contributors.map((c) => [c.id, c]));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStats = [...stats].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case 'rank':
        aValue = a.rank || 999;
        bValue = b.rank || 999;
        break;
      case 'quality':
        aValue = a.averageQualityScore;
        bValue = b.averageQualityScore;
        break;
      case 'articles':
        aValue = a.totalArticles;
        bValue = b.totalArticles;
        break;
      case 'published':
        aValue = a.publicationSuccessRate;
        bValue = b.publicationSuccessRate;
        break;
      default:
        aValue = a.rank || 999;
        bValue = b.rank || 999;
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getRankIcon = (rank?: number) => {
    if (!rank) return <Award className="w-5 h-5 text-void-400" />;
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <Award className="w-5 h-5 text-void-400" />;
  };

  const getRankBadgeClass = (rank?: number) => {
    if (!rank) return 'bg-void-700/50 border-void-600';
    if (rank === 1) return 'bg-amber-500/10 border-amber-500/20';
    if (rank === 2) return 'bg-slate-500/10 border-slate-500/20';
    if (rank === 3) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-void-700/50 border-void-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold transition-colors ${
        sortField === field ? 'text-indigo-400' : 'text-void-400 hover:text-void-200'
      }`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <GlassCard variant="panel" className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Trophy className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-void-100">
              Contributor Rankings
            </h2>
            <p className="text-xs text-void-400 mt-0.5">
              {stats.length} contributors ranked by performance
            </p>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 mb-2 border-b border-void-700/50">
        <div className="col-span-1">
          <SortButton field="rank" label="Rank" />
        </div>
        <div className="col-span-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-void-400">
            Contributor
          </span>
        </div>
        <div className="col-span-2 text-center">
          <SortButton field="quality" label="Quality" />
        </div>
        <div className="col-span-2 text-center">
          <SortButton field="articles" label="Articles" />
        </div>
        <div className="col-span-2 text-center">
          <SortButton field="published" label="Published" />
        </div>
        <div className="col-span-1 text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-void-400">
            Score
          </span>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-2">
        {sortedStats.length === 0 ? (
          <div className="text-center py-12 text-void-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No contributor statistics available</p>
          </div>
        ) : (
          sortedStats.map((stat) => {
            const contributor = contributorsMap.get(stat.contributorId);
            if (!contributor) return null;

            return (
              <div
                key={stat.contributorId}
                onClick={() => onContributorClick?.(stat.contributorId)}
                className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg border transition-all ${
                  onContributorClick
                    ? 'hover:bg-void-800/50 hover:border-indigo-500/30 cursor-pointer'
                    : ''
                } ${
                  stat.rank && stat.rank <= 3
                    ? 'bg-void-900/50 border-void-700'
                    : 'bg-void-900/30 border-void-700/50'
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border ${getRankBadgeClass(
                      stat.rank
                    )}`}
                  >
                    {stat.rank && stat.rank <= 3 ? (
                      getRankIcon(stat.rank)
                    ) : (
                      <span className="text-sm font-bold text-void-300">
                        {stat.rank || '-'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contributor Info */}
                <div className="col-span-4 flex items-center gap-3">
                  {contributor.avatarUrl ? (
                    <img
                      src={contributor.avatarUrl}
                      alt={contributor.name}
                      className="w-8 h-8 rounded-full border border-void-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-400">
                        {contributor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-void-100 truncate">
                      {contributor.displayName || contributor.name}
                    </div>
                    {contributor.styleProxy && (
                      <div className="text-xs text-void-400 truncate">
                        Style: {contributor.styleProxy}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quality Score */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-void-100">
                    {Math.round(stat.averageQualityScore)}
                  </span>
                </div>

                {/* Total Articles */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-void-100">
                    {stat.totalArticles}
                  </span>
                </div>

                {/* Publication Rate */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-void-100">
                    {Math.round(stat.publicationSuccessRate)}%
                  </span>
                </div>

                {/* Performance Score */}
                <div className="col-span-1 flex justify-center">
                  <div
                    className={`text-lg font-bold font-mono ${getScoreColor(
                      stat.performanceScore
                    )}`}
                  >
                    {stat.performanceScore}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend for Top 3 */}
      {stats.some((s) => s.rank && s.rank <= 3) && (
        <div className="mt-6 pt-4 border-t border-void-700/50">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-void-400">1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-slate-400" />
              <span className="text-void-400">2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-orange-400" />
              <span className="text-void-400">3rd Place</span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
