/**
 * IdeasBoard Component
 *
 * Full content ideas management board with filtering, sorting, and view modes.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import type { ContentIdea } from '@content-engine/types';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { IdeaCard } from './IdeaCard';
import { StatCard } from '../components/StatCard';

interface IdeasBoardProps {
  ideas: ContentIdea[];
  onAddIdea?: () => void;
  onGenerateIdeas?: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onConvert?: (id: string) => void;
  onIdeaClick?: (idea: ContentIdea) => void;
  isLoading?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortField = 'createdAt' | 'priority' | 'searchVolume' | 'keywordDifficulty';
type SortDirection = 'asc' | 'desc';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

export function IdeasBoard({
  ideas,
  onAddIdea,
  onGenerateIdeas,
  onApprove,
  onReject,
  onConvert,
  onIdeaClick,
  isLoading = false,
}: IdeasBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentIdea['status'] | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ContentIdea['priority'] | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ContentIdea['source'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Calculate stats
  const stats = useMemo(() => {
    return {
      new: ideas.filter((i) => i.status === 'new').length,
      approved: ideas.filter((i) => i.status === 'approved').length,
      in_progress: ideas.filter((i) => i.status === 'in_progress').length,
      completed: ideas.filter((i) => i.status === 'completed').length,
    };
  }, [ideas]);

  // Filter and sort ideas
  const filteredIdeas = useMemo(() => {
    let filtered = ideas;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.description?.toLowerCase().includes(query) ||
          idea.primaryKeyword?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((idea) => idea.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((idea) => idea.priority === priorityFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((idea) => idea.source === sourceFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'searchVolume':
          comparison = (a.searchVolume || 0) - (b.searchVolume || 0);
          break;
        case 'keywordDifficulty':
          comparison = (a.keywordDifficulty || 0) - (b.keywordDifficulty || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [ideas, searchQuery, statusFilter, priorityFilter, sourceFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStatClick = (status: ContentIdea['status']) => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleStatClick('new')}
          className="cursor-pointer"
        >
          <StatCard
            title="New Ideas"
            value={stats.new}
            icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
            colorClass="indigo"
          />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleStatClick('approved')}
          className="cursor-pointer"
        >
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
            colorClass="emerald"
          />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleStatClick('in_progress')}
          className="cursor-pointer"
        >
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            icon={<Sparkles className="w-4 h-4 text-purple-400" />}
            colorClass="purple"
          />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => handleStatClick('completed')}
          className="cursor-pointer"
        >
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            colorClass="amber"
          />
        </motion.div>
      </div>

      {/* Controls Bar */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="forge"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={onGenerateIdeas}
              disabled={isLoading}
            >
              Generate Ideas
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onAddIdea}
              disabled={isLoading}
            >
              Add Idea
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1">
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContentIdea['status'] | 'all')}
            className="bg-void-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as ContentIdea['priority'] | 'all')}
            className="bg-void-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as ContentIdea['source'] | 'all')}
            className="bg-void-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual</option>
            <option value="ai_generated">AI Generated</option>
            <option value="keyword_research">Keyword Research</option>
            <option value="competitor">Competitor</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Sort by:
          </span>
          {(['createdAt', 'priority', 'searchVolume', 'keywordDifficulty'] as const).map(
            (field) => (
              <Button
                key={field}
                variant={sortField === field ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleSort(field)}
                rightIcon={
                  sortField === field ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )
                }
              >
                {field === 'createdAt' && 'Date'}
                {field === 'priority' && 'Priority'}
                {field === 'searchVolume' && 'Search Vol'}
                {field === 'keywordDifficulty' && 'Difficulty'}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Ideas Grid/List */}
      <AnimatePresence mode="wait">
        {filteredIdeas.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel rounded-2xl p-12 text-center"
          >
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No ideas found</h3>
            <p className="text-sm text-slate-400 mb-6">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first content idea'}
            </p>
            {onAddIdea && (
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={onAddIdea}>
                Add Your First Idea
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <IdeaCard
                    idea={idea}
                    onApprove={onApprove}
                    onReject={onReject}
                    onConvert={onConvert}
                    onClick={() => onIdeaClick?.(idea)}
                    className={viewMode === 'list' ? 'w-full' : ''}
                  />
                </motion.div>
              ))}
            </div>

            {/* Results Count */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Showing <span className="text-white font-semibold">{filteredIdeas.length}</span> of{' '}
                <span className="text-white font-semibold">{ideas.length}</span> ideas
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default IdeasBoard;
