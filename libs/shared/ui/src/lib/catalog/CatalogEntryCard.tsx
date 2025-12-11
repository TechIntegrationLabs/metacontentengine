/**
 * Catalog Entry Card Component
 *
 * Individual catalog entry card showing title, URL, topics, keywords, and stats.
 * Includes sync status, edit/delete actions, and selection checkbox.
 */

import React, { useState } from 'react';
import {
  ExternalLink,
  Tag,
  Hash,
  Link2,
  RefreshCw,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
} from 'lucide-react';
import type { SiteCatalogEntry } from '@content-engine/types';

interface CatalogEntryCardProps {
  entry: SiteCatalogEntry;
  selected?: boolean;
  onSelect?: () => void;
  onSync?: () => void;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<SiteCatalogEntry>) => void;
  className?: string;
}

export function CatalogEntryCard({
  entry,
  selected = false,
  onSelect,
  onSync,
  onDelete,
  onUpdate,
  className = '',
}: CatalogEntryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const getSyncStatusIcon = () => {
    switch (entry.sync_status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncStatusColor = () => {
    switch (entry.sync_status) {
      case 'synced':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleTogglePillar = () => {
    onUpdate?.({ is_pillar: !entry.is_pillar });
  };

  const handleToggleActive = () => {
    onUpdate?.({ is_active: !entry.is_active });
  };

  return (
    <div
      className={`glass-card p-5 transition-all hover:border-forge-orange/30 relative ${
        selected ? 'ring-2 ring-forge-orange' : ''
      } ${!entry.is_active ? 'opacity-60' : ''} ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Selection Checkbox */}
      {(isHovering || selected) && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-4 h-4 rounded border-white/20 bg-void-900 text-forge-orange focus:ring-forge-orange focus:ring-offset-0"
          />
        </div>
      )}

      {/* Pillar Badge */}
      {entry.is_pillar && (
        <div className="absolute top-4 right-12">
          <div className="flex items-center gap-1 px-2 py-1 bg-forge-purple/20 border border-forge-purple/30 rounded-full text-xs text-forge-purple">
            <Star className="w-3 h-3 fill-current" />
            <span>Pillar</span>
          </div>
        </div>
      )}

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 glass-card py-1 z-30">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onSync?.();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Entry
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleTogglePillar();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                {entry.is_pillar ? 'Remove Pillar Status' : 'Mark as Pillar'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleToggleActive();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {entry.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <hr className="my-1 border-white/10" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (confirm(`Delete "${entry.title}"?`)) {
                    onDelete?.();
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Entry
              </button>
            </div>
          </>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-white mb-2 pr-20 line-clamp-2">
        {entry.title}
      </h3>

      {/* URL */}
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-forge-indigo hover:text-forge-orange transition-colors flex items-center gap-1 mb-3 line-clamp-1"
      >
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{entry.url}</span>
      </a>

      {/* Excerpt */}
      {entry.excerpt && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {entry.excerpt}
        </p>
      )}

      {/* Topics */}
      {entry.topics.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <Tag className="w-3 h-3 text-forge-indigo" />
            <span className="text-xs text-gray-500">Topics</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {entry.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 bg-forge-indigo/10 border border-forge-indigo/20 text-forge-indigo rounded text-xs"
              >
                {topic}
              </span>
            ))}
            {entry.topics.length > 3 && (
              <span className="px-2 py-0.5 text-gray-500 text-xs">
                +{entry.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Keywords */}
      {entry.keywords.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Hash className="w-3 h-3 text-forge-purple" />
            <span className="text-xs text-gray-500">Keywords</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {entry.keywords.slice(0, 3).map((keyword) => (
              <span
                key={keyword}
                className="px-2 py-0.5 bg-forge-purple/10 border border-forge-purple/20 text-forge-purple rounded text-xs"
              >
                {keyword}
              </span>
            ))}
            {entry.keywords.length > 3 && (
              <span className="px-2 py-0.5 text-gray-500 text-xs">
                +{entry.keywords.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Links To</div>
          <div className="text-base font-semibold text-emerald-400">
            {entry.times_linked_to}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Links From</div>
          <div className="text-base font-semibold text-blue-400">
            {entry.times_linked_from}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Score</div>
          <div className="text-base font-semibold text-gray-300">
            {entry.relevance_score !== null ? Math.round(entry.relevance_score) : '-'}
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className={`flex items-center gap-2 px-2 py-1 rounded border text-xs ${getSyncStatusColor()}`}>
          {getSyncStatusIcon()}
          <span className="capitalize">{entry.sync_status}</span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(entry.last_synced_at)}
        </div>
      </div>

      {/* Error Message */}
      {entry.sync_error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {entry.sync_error}
        </div>
      )}
    </div>
  );
}

export default CatalogEntryCard;
