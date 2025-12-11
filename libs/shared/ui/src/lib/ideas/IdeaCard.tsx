/**
 * IdeaCard Component
 *
 * Displays a single content idea with metadata, status, and quick actions.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Target,
  Calendar,
  Sparkles,
  Brain,
  Search,
  Users,
} from 'lucide-react';
import type { ContentIdea } from '@content-engine/types';
import { Button } from '../primitives/Button';

interface IdeaCardProps {
  idea: ContentIdea;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onConvert?: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-500/20 text-slate-400 border-slate-500/20' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
  high: { label: 'High', color: 'bg-amber-500/20 text-amber-400 border-amber-500/20' },
  urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/20' },
};

const statusConfig = {
  new: { label: 'New', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' },
  approved: { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-purple-500/20 text-purple-400 border-purple-500/20' },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/20' },
  rejected: { label: 'Rejected', color: 'bg-gray-500/20 text-gray-400 border-gray-500/20' },
};

const sourceConfig = {
  manual: { label: 'Manual', icon: Users },
  ai_generated: { label: 'AI Generated', icon: Brain },
  keyword_research: { label: 'Keyword Research', icon: Search },
  competitor: { label: 'Competitor', icon: Target },
};

export function IdeaCard({
  idea,
  onApprove,
  onReject,
  onConvert,
  onClick,
  className = '',
}: IdeaCardProps) {
  const priority = priorityConfig[idea.priority];
  const status = statusConfig[idea.status];
  const source = sourceConfig[idea.source];
  const SourceIcon = source.icon;

  const formattedDate = new Date(idea.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`glass-card rounded-xl overflow-hidden group ${className}`}
    >
      <div className="p-5 cursor-pointer" onClick={onClick}>
        {/* Header: Title + Priority Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-white line-clamp-2 flex-1 group-hover:text-forge-orange transition-colors">
            {idea.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${priority.color}`}
          >
            {priority.label}
          </span>
        </div>

        {/* Description */}
        {idea.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-4">
            {idea.description}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="space-y-2 mb-4">
          {/* Status + Source */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.color}`}
            >
              {status.label}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg">
              <SourceIcon className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-400">{source.label}</span>
            </div>
          </div>

          {/* Keyword Data */}
          {idea.primaryKeyword && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-indigo-400" />
                <span className="text-xs text-slate-400">
                  Keyword:{' '}
                  <span className="text-white font-medium">{idea.primaryKeyword}</span>
                </span>
              </div>
              {(idea.searchVolume !== undefined || idea.keywordDifficulty !== undefined) && (
                <div className="flex items-center gap-4 ml-4">
                  {idea.searchVolume !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-slate-400">
                        Vol:{' '}
                        <span className="text-white font-mono">
                          {idea.searchVolume.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {idea.keywordDifficulty !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-slate-400">
                        KD:{' '}
                        <span className={`font-mono ${
                          idea.keywordDifficulty < 30 ? 'text-emerald-400' :
                          idea.keywordDifficulty < 60 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {idea.keywordDifficulty}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      {idea.status !== 'rejected' && idea.status !== 'completed' && (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-white/5 bg-void-950/50">
          {idea.status === 'new' && (
            <>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Check className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.(idea.id);
                }}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<X className="w-3 h-3" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.(idea.id);
                }}
                className="flex-1"
              >
                Reject
              </Button>
            </>
          )}
          {(idea.status === 'approved' || idea.status === 'in_progress') && (
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="w-3 h-3" />}
              onClick={(e) => {
                e.stopPropagation();
                onConvert?.(idea.id);
              }}
              className="flex-1"
            >
              Convert to Article
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default IdeaCard;
