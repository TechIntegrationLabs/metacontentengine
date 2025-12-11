/**
 * Site Catalog Manager Component
 *
 * Main catalog management view with search, filtering, and bulk actions.
 * Displays catalog entries in a table/grid format with sorting and pagination.
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
  Globe,
  MoreVertical,
} from 'lucide-react';
import type { SiteCatalogEntry } from '@content-engine/types';
import { CatalogEntryCard } from './CatalogEntryCard';

interface SiteCatalogManagerProps {
  entries: SiteCatalogEntry[];
  isLoading?: boolean;
  onSync?: (entryIds?: string[]) => void;
  onDelete?: (entryIds: string[]) => void;
  onUpdate?: (entryId: string, updates: Partial<SiteCatalogEntry>) => void;
  onAddEntry?: (url: string) => void;
  onImportSitemap?: (url: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'table';
type SortField = 'title' | 'url' | 'last_synced_at' | 'times_linked_to' | 'relevance_score';
type SortDirection = 'asc' | 'desc';

export function SiteCatalogManager({
  entries,
  isLoading = false,
  onSync,
  onDelete,
  onUpdate,
  onAddEntry,
  onImportSitemap,
  className = '',
}: SiteCatalogManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('last_synced_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [newEntryUrl, setNewEntryUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');

  // Extract unique topics and keywords
  const allTopics = Array.from(new Set(entries.flatMap((e) => e.topics))).sort();
  const allKeywords = Array.from(new Set(entries.flatMap((e) => e.keywords))).sort();

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !entry.title.toLowerCase().includes(query) &&
          !entry.url.toLowerCase().includes(query) &&
          !entry.excerpt?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Topic filter
      if (selectedTopics.length > 0) {
        if (!selectedTopics.some((topic) => entry.topics.includes(topic))) {
          return false;
        }
      }

      // Keyword filter
      if (selectedKeywords.length > 0) {
        if (!selectedKeywords.some((keyword) => entry.keywords.includes(keyword))) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to comparable values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map((e) => e.id)));
    }
  };

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleBulkSync = () => {
    if (selectedEntries.size > 0) {
      onSync?.(Array.from(selectedEntries));
      setSelectedEntries(new Set());
    } else {
      onSync?.();
    }
  };

  const handleBulkDelete = () => {
    if (selectedEntries.size > 0 && confirm(`Delete ${selectedEntries.size} entries?`)) {
      onDelete?.(Array.from(selectedEntries));
      setSelectedEntries(new Set());
    }
  };

  const handleAddEntry = () => {
    if (newEntryUrl.trim()) {
      onAddEntry?.(newEntryUrl.trim());
      setNewEntryUrl('');
      setShowAddModal(false);
    }
  };

  const handleImportSitemap = () => {
    if (sitemapUrl.trim()) {
      onImportSitemap?.(sitemapUrl.trim());
      setSitemapUrl('');
      setShowSitemapModal(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Site Catalog</h2>
          <p className="text-sm text-gray-400">
            Manage your site's content catalog for intelligent internal linking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSitemapModal(true)}
            className="px-4 py-2 bg-forge-indigo/10 hover:bg-forge-indigo/20 text-forge-indigo rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Sitemap
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-forge-orange/10 hover:bg-forge-orange/20 text-forge-orange rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, URL, or content..."
            className="w-full pl-10 pr-4 py-3 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forge-orange/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Topic Filter */}
          <div className="relative">
            <button className="px-3 py-1.5 bg-void-900 border border-white/10 rounded-lg text-sm text-gray-300 hover:border-forge-indigo/50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`}
            </button>
            {/* TODO: Add dropdown menu for topic selection */}
          </div>

          {/* Keyword Filter */}
          <div className="relative">
            <button className="px-3 py-1.5 bg-void-900 border border-white/10 rounded-lg text-sm text-gray-300 hover:border-forge-purple/50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Keywords {selectedKeywords.length > 0 && `(${selectedKeywords.length})`}
            </button>
            {/* TODO: Add dropdown menu for keyword selection */}
          </div>

          {/* Clear Filters */}
          {(selectedTopics.length > 0 || selectedKeywords.length > 0 || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopics([]);
                setSelectedKeywords([]);
              }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          )}

          <div className="flex-1" />

          {/* Results Count */}
          <span className="text-sm text-gray-400">
            {filteredEntries.length} of {entries.length} entries
          </span>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <div className="glass-card p-4 flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkSync}
              className="px-4 py-2 bg-forge-indigo/10 hover:bg-forge-indigo/20 text-forge-indigo rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Entries Grid */}
      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-forge-orange animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading catalog entries...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No catalog entries found</p>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery || selectedTopics.length > 0 || selectedKeywords.length > 0
              ? 'Try adjusting your filters'
              : 'Add entries manually or import from a sitemap'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-forge-orange/10 hover:bg-forge-orange/20 text-forge-orange rounded-lg transition-colors text-sm font-medium"
          >
            Add First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <CatalogEntryCard
              key={entry.id}
              entry={entry}
              selected={selectedEntries.has(entry.id)}
              onSelect={() => handleSelectEntry(entry.id)}
              onSync={() => onSync?.([entry.id])}
              onDelete={() => onDelete?.([entry.id])}
              onUpdate={(updates) => onUpdate?.(entry.id, updates)}
            />
          ))}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-lg font-display font-semibold text-white mb-4">
              Add Catalog Entry
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter the URL of the page you want to add to your catalog. We'll fetch and index the
              content automatically.
            </p>
            <input
              type="url"
              value={newEntryUrl}
              onChange={(e) => setNewEntryUrl(e.target.value)}
              placeholder="https://example.com/article-url"
              className="w-full px-4 py-3 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forge-orange/50 focus:outline-none transition-colors mb-4"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddEntry}
                disabled={!newEntryUrl.trim()}
                className="flex-1 px-4 py-2 bg-forge-orange/10 hover:bg-forge-orange/20 text-forge-orange rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Entry
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEntryUrl('');
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Sitemap Modal */}
      {showSitemapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-lg font-display font-semibold text-white mb-4">
              Import from Sitemap
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter your sitemap URL to automatically import all pages into your catalog.
            </p>
            <input
              type="url"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
              className="w-full px-4 py-3 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forge-indigo/50 focus:outline-none transition-colors mb-4"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportSitemap}
                disabled={!sitemapUrl.trim()}
                className="flex-1 px-4 py-2 bg-forge-indigo/10 hover:bg-forge-indigo/20 text-forge-indigo rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Sitemap
              </button>
              <button
                onClick={() => {
                  setShowSitemapModal(false);
                  setSitemapUrl('');
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SiteCatalogManager;
