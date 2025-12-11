/**
 * IdeasBoard Component
 *
 * Full content ideas management board with filtering, creation,
 * and bulk operations.
 */

import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  LayoutGrid,
  List,
  Sparkles,
  Target,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import type { ContentIdea } from '@content-engine/types';
import { IdeaCard } from './IdeaCard';

interface IdeasBoardProps {
  ideas: ContentIdea[];
  isLoading?: boolean;
  onCreateIdea: () => void;
  onApproveIdea: (id: string) => Promise<void>;
  onRejectIdea: (id: string) => Promise<void>;
  onConvertIdea: (id: string) => Promise<void>;
  onSelectIdea: (idea: ContentIdea) => void;
  onGenerateIdeas?: () => void;
  onRefresh?: () => void;
  className?: string;
}

type StatusFilter = 'all' | ContentIdea['status'];
type PriorityFilter = 'all' | ContentIdea['priority'];
type SourceFilter = 'all' | ContentIdea['source'];
type SortField = 'createdAt' | 'priority' | 'searchVolume' | 'keywordDifficulty';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const PRIORITY_ORDER: Record<ContentIdea['priority'], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function IdeasBoard({
  ideas,
  isLoading = false,
  onCreateIdea,
  onApproveIdea,
  onRejectIdea,
  onConvertIdea,
  onSelectIdea,
  onGenerateIdeas,
  onRefresh,
  className = '',
}: IdeasBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = [...ideas];

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
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
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

  const stats = useMemo(() => {
    return {
      total: ideas.length,
      new: ideas.filter((i) => i.status === 'new').length,
      approved: ideas.filter((i) => i.status === 'approved').length,
      inProgress: ideas.filter((i) => i.status === 'in_progress').length,
      completed: ideas.filter((i) => i.status === 'completed').length,
    };
  }, [ideas]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSourceFilter('all');
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all';

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="glass-card p-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-700/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Lightbulb className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Content Ideas</h2>
            <p className="text-sm text-gray-400">{stats.total} ideas in your backlog</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          {onGenerateIdeas && (
            <button
              onClick={onGenerateIdeas}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Ideas
            </button>
          )}

          <button
            onClick={onCreateIdea}
            className="px-4 py-2 bg-forge-orange hover:bg-forge-orange/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Idea
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('new')}
          className={`glass-card p-4 text-left transition-all ${
            statusFilter === 'new' ? 'ring-2 ring-purple-500' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">New Ideas</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.new}</p>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`glass-card p-4 text-left transition-all ${
            statusFilter === 'approved' ? 'ring-2 ring-emerald-500' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Approved</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.approved}</p>
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`glass-card p-4 text-left transition-all ${
            statusFilter === 'in_progress' ? 'ring-2 ring-blue-500' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`glass-card p-4 text-left transition-all ${
            statusFilter === 'completed' ? 'ring-2 ring-cyan-500' : 'hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completed}</p>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search ideas, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              hasActiveFilters
                ? 'border-forge-orange text-forge-orange'
                : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 bg-forge-orange/20 text-forge-orange text-xs rounded">
                Active
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-3 py-2 bg-void-900 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-forge-orange/50"
            >
              <option value="createdAt">Date Created</option>
              <option value="priority">Priority</option>
              <option value="searchVolume">Search Volume</option>
              <option value="keywordDifficulty">Keyword Difficulty</option>
            </select>
            <button
              onClick={() => toggleSort(sortField)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {sortDirection === 'desc' ? (
                <SortDesc className="w-5 h-5" />
              ) : (
                <SortAsc className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 p-1 bg-void-900 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 bg-void-900 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-forge-orange/50"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="w-full px-3 py-2 bg-void-900 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-forge-orange/50"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="w-full px-3 py-2 bg-void-900 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-forge-orange/50"
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual</option>
                <option value="ai_generated">AI Generated</option>
                <option value="keyword_research">Keyword Research</option>
                <option value="competitor">Competitor Analysis</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="md:col-span-3">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ideas Grid/List */}
      {filteredAndSortedIdeas.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No ideas found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Start by adding your first content idea'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={onCreateIdea}
              className="px-4 py-2 bg-forge-orange hover:bg-forge-orange/90 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Idea
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredAndSortedIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onApprove={onApproveIdea}
              onReject={onRejectIdea}
              onConvert={onConvertIdea}
              onClick={onSelectIdea}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredAndSortedIdeas.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredAndSortedIdeas.length} of {ideas.length} ideas
        </div>
      )}
    </div>
  );
}

export default IdeasBoard;
