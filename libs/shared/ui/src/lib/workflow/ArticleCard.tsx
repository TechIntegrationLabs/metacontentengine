/**
 * ArticleCard Component
 *
 * Draggable card for articles in the Kanban board.
 * Shows title, contributor, quality score, and quick stats.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
} from 'lucide-react';
import type { Article } from '@content-engine/hooks';

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
  isDragging?: boolean;
}

export function ArticleCard({ article, onClick, isDragging }: ArticleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = isDragging || isSortableDragging;

  const contributorName =
    article.contributor?.display_name ||
    article.contributor?.name ||
    'Unassigned';
  const contributorInitials = contributorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-500/20 text-gray-400';
    if (score >= 90) return 'bg-emerald-500/20 text-emerald-400';
    if (score >= 80) return 'bg-blue-500/20 text-blue-400';
    if (score >= 70) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getRiskIcon = () => {
    const riskLevel = (article as any).risk_level;
    if (!riskLevel || riskLevel === 'LOW') return null;
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      return <AlertTriangle className="w-3 h-3 text-red-400" />;
    }
    if (riskLevel === 'MEDIUM') {
      return <AlertTriangle className="w-3 h-3 text-amber-400" />;
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-void-900/80 border rounded-lg transition-all cursor-pointer ${
        isActive
          ? 'border-forge-orange/50 shadow-lg shadow-forge-orange/10 opacity-90'
          : 'border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-2 p-3 pb-2">
        <button
          className="mt-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex-1 min-w-0" onClick={onClick}>
          <h4 className="text-sm font-medium text-white line-clamp-2 hover:text-forge-orange transition-colors">
            {article.title}
          </h4>

          {article.primary_keyword && (
            <span className="inline-block mt-1 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
              {article.primary_keyword}
            </span>
          )}
        </div>

        {article.quality_score && (
          <div
            className={`px-2 py-1 rounded-lg text-xs font-semibold ${getQualityColor(
              article.quality_score
            )}`}
          >
            {article.quality_score}
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between px-3 py-2 border-t border-white/5"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          {article.contributor?.avatar_url ? (
            <img
              src={article.contributor.avatar_url}
              alt={contributorName}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
              {contributorInitials}
            </div>
          )}
          <span className="text-xs text-gray-400 truncate max-w-[100px]">
            {contributorName}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {getRiskIcon()}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{article.reading_time || 0}m</span>
          </div>
          <span>{(article.word_count || 0).toLocaleString()}w</span>
        </div>
      </div>
    </div>
  );
}
