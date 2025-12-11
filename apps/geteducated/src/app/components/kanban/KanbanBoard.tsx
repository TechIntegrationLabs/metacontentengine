/**
 * KanbanBoard Component
 *
 * Full Kanban workflow board with drag-and-drop functionality.
 * Displays articles organized by status in columns.
 */

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Loader2, RefreshCw } from 'lucide-react';
import type { Article, ArticleStatus } from '@content-engine/hooks';
import { KanbanColumn, KanbanColumnConfig } from './KanbanColumn';
import { ArticleCard } from './ArticleCard';

// Workflow column configuration
const WORKFLOW_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'idea',
    title: 'Ideas',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500',
    borderColor: 'border-gray-500',
  },
  {
    id: 'drafting',
    title: 'Drafting',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
  },
  {
    id: 'humanizing',
    title: 'Refinement',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
  },
  {
    id: 'review',
    title: 'QA Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500',
  },
  {
    id: 'ready',
    title: 'Ready to Publish',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500',
    borderColor: 'border-cyan-500',
  },
  {
    id: 'published',
    title: 'Published',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
  },
];

interface KanbanBoardProps {
  articles: Article[];
  isLoading?: boolean;
  onArticleClick?: (article: Article) => void;
  onStatusChange?: (articleId: string, newStatus: ArticleStatus) => Promise<void>;
  onAddArticle?: (status: string) => void;
  onRefresh?: () => void;
}

export function KanbanBoard({
  articles,
  isLoading = false,
  onArticleClick,
  onStatusChange,
  onAddArticle,
  onRefresh,
}: KanbanBoardProps) {
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Group articles by status
  const articlesByStatus = useMemo(() => {
    const grouped: Record<string, Article[]> = {};

    // Initialize all columns
    WORKFLOW_COLUMNS.forEach((col) => {
      grouped[col.id] = [];
    });

    // Group articles
    articles.forEach((article) => {
      const status = article.status;
      if (grouped[status]) {
        grouped[status].push(article);
      } else {
        // Handle statuses not in workflow (outline, scheduled, archived)
        // Map them to the closest workflow status
        if (status === 'outline') {
          grouped['idea'].push(article);
        } else if (status === 'scheduled') {
          grouped['ready'].push(article);
        }
        // Archived articles are not shown in Kanban
      }
    });

    return grouped;
  }, [articles]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const article = articles.find((a) => a.id === active.id);
    if (article) {
      setActiveArticle(article);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback is handled by the droppable state
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveArticle(null);

    if (!over || !onStatusChange) return;

    const articleId = active.id as string;
    const newStatus = over.id as ArticleStatus;

    // Find the article
    const article = articles.find((a) => a.id === articleId);
    if (!article || article.status === newStatus) return;

    // Don't allow moving published articles back (without confirmation)
    if (article.status === 'published' && newStatus !== 'published') {
      const confirmed = window.confirm(
        'This article is already published. Moving it will change its status. Continue?'
      );
      if (!confirmed) return;
    }

    setIsUpdating(true);
    try {
      await onStatusChange(articleId, newStatus);
    } catch (error) {
      console.error('Failed to update article status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragCancel = () => {
    setActiveArticle(null);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return WORKFLOW_COLUMNS.map((col) => ({
      id: col.id,
      count: articlesByStatus[col.id]?.length || 0,
    }));
  }, [articlesByStatus]);

  const totalArticles = articles.filter(
    (a) => !['archived'].includes(a.status)
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Workflow Board</h2>
          <span className="text-sm text-gray-500">
            {totalArticles} article{totalArticles !== 1 ? 's' : ''} in pipeline
          </span>
          {isUpdating && (
            <span className="flex items-center gap-1 text-xs text-forge-orange">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating...
            </span>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && articles.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-forge-orange animate-spin" />
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading || articles.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 px-2">
            {WORKFLOW_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                config={column}
                articles={articlesByStatus[column.id] || []}
                onArticleClick={onArticleClick}
                onAddArticle={onAddArticle}
                showAddButton={column.id === 'idea'}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeArticle ? (
              <div className="w-[280px]">
                <ArticleCard article={activeArticle} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-gray-400 mb-2">No articles in the pipeline</p>
          <p className="text-gray-500 text-sm">
            Create your first article to get started
          </p>
        </div>
      )}
    </div>
  );
}

export { WORKFLOW_COLUMNS };
export type { KanbanColumnConfig };
