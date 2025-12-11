/**
 * KanbanColumn Component
 *
 * Individual column in the Kanban workflow board.
 * Uses @dnd-kit for drag-and-drop functionality.
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Article } from '@content-engine/hooks';
import { ArticleCard } from './ArticleCard';

export interface KanbanColumnConfig {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface KanbanColumnProps {
  config: KanbanColumnConfig;
  articles: Article[];
  onArticleClick?: (article: Article) => void;
  onAddArticle?: (status: string) => void;
  showAddButton?: boolean;
}

export function KanbanColumn({
  config,
  articles,
  onArticleClick,
  onAddArticle,
  showAddButton = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
  });

  const articleIds = articles.map((a) => a.id);

  return (
    <div
      className={`flex flex-col min-w-[300px] w-[300px] rounded-xl border transition-all ${
        isOver
          ? `${config.borderColor} bg-white/5`
          : 'border-white/5 bg-void-900/30'
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 border-b ${config.borderColor}/30`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
            <h3 className={`font-semibold text-sm ${config.color}`}>
              {config.title}
            </h3>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
              {articles.length}
            </span>
          </div>
          {showAddButton && (
            <button
              onClick={() => onAddArticle?.(config.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)]"
      >
        <SortableContext
          items={articleIds}
          strategy={verticalListSortingStrategy}
        >
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick?.(article)}
            />
          ))}
        </SortableContext>

        {articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-gray-500 text-sm">No articles</p>
            <p className="text-gray-600 text-xs mt-1">
              Drag articles here or click + to add
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
