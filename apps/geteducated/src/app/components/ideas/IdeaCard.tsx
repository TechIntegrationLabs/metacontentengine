/**
 * IdeaCard Component
 *
 * Displays a single content idea with priority, status, and keyword metrics.
 */

import React from 'react';
import {
  Lightbulb,
  TrendingUp,
  Target,
  User,
  Clock,
  ArrowRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  Sparkles,
  Search,
  Gauge,
} from 'lucide-react';
import type { ContentIdea } from '@content-engine/types';

interface IdeaCardProps {
  idea: ContentIdea;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAssign?: (id: string) => void;
  onConvert?: (id: string) => void;
  onClick?: (idea: ContentIdea) => void;
  className?: string;
}

const priorityConfig: Record<
  ContentIdea['priority'],
  { color: string; bg: string; label: string }
> = {
  low: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Low' },
  medium: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Medium' },
  high: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'High' },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgent' },
};

const statusConfig: Record<
  ContentIdea['status'],
  { color: string; bg: string; label: string }
> = {
  new: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'New' },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Approved' },
  in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'In Progress' },
  completed: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Completed' },
  rejected: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Rejected' },
};

const sourceConfig: Record<
  ContentIdea['source'],
  { icon: React.ElementType; color: string; label: string }
> = {
  manual: { icon: User, color: 'text-gray-400', label: 'Manual' },
  ai_generated: { icon: Sparkles, color: 'text-purple-400', label: 'AI Generated' },
  keyword_research: { icon: Search, color: 'text-blue-400', label: 'Keyword Research' },
  competitor: { icon: Target, color: 'text-amber-400', label: 'Competitor Analysis' },
};

export function IdeaCard({
  idea,
  onApprove,
  onReject,
  onAssign,
  onConvert,
  onClick,
  className = '',
}: IdeaCardProps) {
  const priority = priorityConfig[idea.priority];
  const status = statusConfig[idea.status];
  const source = sourceConfig[idea.source];
  const SourceIcon = source.icon;

  const hasKeywordData = idea.searchVolume !== undefined || idea.keywordDifficulty !== undefined;

  return (
    <div
      className={`glass-card p-4 hover:bg-white/5 transition-colors cursor-pointer ${className}`}
      onClick={() => onClick?.(idea)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white line-clamp-2">{idea.title}</h4>
          {idea.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{idea.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.color}`}>
            {priority.label}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Keyword Data */}
      {hasKeywordData && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          {idea.primaryKeyword && (
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-forge-orange" />
              <span className="text-sm text-gray-300">{idea.primaryKeyword}</span>
            </div>
          )}

          {idea.searchVolume !== undefined && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm text-gray-300">
                {idea.searchVolume.toLocaleString()} vol
              </span>
            </div>
          )}

          {idea.keywordDifficulty !== undefined && (
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm text-gray-300">KD {idea.keywordDifficulty}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <SourceIcon className={`w-3.5 h-3.5 ${source.color}`} />
            <span>{source.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {idea.status === 'new' && (
            <>
              {onApprove && (
                <button
                  onClick={() => onApprove(idea.id)}
                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(idea.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {idea.status === 'approved' && onConvert && (
            <button
              onClick={() => onConvert(idea.id)}
              className="p-1.5 text-forge-orange hover:bg-forge-orange/10 rounded transition-colors flex items-center gap-1"
              title="Convert to Article"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IdeaCard;
