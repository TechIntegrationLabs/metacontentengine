/**
 * Catalog Sync Panel Component
 *
 * Sync configuration panel for sitemap URL, schedule, and status.
 * Shows sync progress, errors, and last sync timestamp.
 */

import React, { useState } from 'react';
import {
  RefreshCw,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Play,
  Pause,
} from 'lucide-react';

interface SyncConfig {
  sitemap_url: string | null;
  schedule: 'manual' | 'daily' | 'weekly';
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: 'idle' | 'running' | 'success' | 'error';
  sync_error: string | null;
  total_entries: number;
  synced_entries: number;
  failed_entries: number;
  is_enabled: boolean;
}

interface CatalogSyncPanelProps {
  config: SyncConfig;
  onUpdateConfig?: (updates: Partial<SyncConfig>) => void;
  onSyncNow?: () => void;
  onToggleSync?: () => void;
  className?: string;
}

export function CatalogSyncPanel({
  config,
  onUpdateConfig,
  onSyncNow,
  onToggleSync,
  className = '',
}: CatalogSyncPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState(config.sitemap_url || '');
  const [schedule, setSchedule] = useState(config.schedule);

  const handleSave = () => {
    onUpdateConfig?.({
      sitemap_url: sitemapUrl.trim() || null,
      schedule,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSitemapUrl(config.sitemap_url || '');
    setSchedule(config.schedule);
    setIsEditing(false);
  };

  const getSyncStatusIcon = () => {
    switch (config.sync_status) {
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSyncStatusColor = () => {
    switch (config.sync_status) {
      case 'running':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getSyncProgress = () => {
    if (config.total_entries === 0) return 0;
    return Math.round((config.synced_entries / config.total_entries) * 100);
  };

  const getScheduleLabel = (sched: string) => {
    switch (sched) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      default:
        return 'Manual';
    }
  };

  return (
    <div className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-forge-indigo/10 rounded-lg">
            <Globe className="w-6 h-6 text-forge-indigo" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-white">
              Catalog Sync
            </h3>
            <p className="text-sm text-gray-400">
              Configure automatic sitemap syncing
            </p>
          </div>
        </div>
        <button
          onClick={onToggleSync}
          className={`p-2 rounded-lg transition-colors ${
            config.is_enabled
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
          }`}
          title={config.is_enabled ? 'Disable sync' : 'Enable sync'}
        >
          {config.is_enabled ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Current Status */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border mb-6 ${getSyncStatusColor()}`}>
        {getSyncStatusIcon()}
        <div className="flex-1">
          <div className="text-sm font-medium capitalize">
            {config.sync_status === 'running' ? 'Syncing...' : config.sync_status}
          </div>
          {config.sync_status === 'running' && config.total_entries > 0 && (
            <div className="text-xs mt-1">
              {config.synced_entries} of {config.total_entries} entries ({getSyncProgress()}%)
            </div>
          )}
        </div>
        {config.sync_status === 'running' && (
          <div className="text-xs">
            {getSyncProgress()}%
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {config.sync_status === 'running' && (
        <div className="mb-6">
          <div className="h-2 bg-void-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${getSyncProgress()}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {config.sync_error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-400 mb-1">Sync Error</div>
              <div className="text-xs text-red-300">{config.sync_error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        {/* Sitemap URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sitemap URL
          </label>
          {isEditing ? (
            <input
              type="url"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
              className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-forge-indigo/50 focus:outline-none transition-colors"
            />
          ) : (
            <div className="px-4 py-2 bg-void-900/50 border border-white/5 rounded-lg text-gray-400 truncate">
              {config.sitemap_url || 'Not configured'}
            </div>
          )}
        </div>

        {/* Sync Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sync Schedule
          </label>
          {isEditing ? (
            <div className="grid grid-cols-3 gap-2">
              {(['manual', 'daily', 'weekly'] as const).map((sched) => (
                <button
                  key={sched}
                  onClick={() => setSchedule(sched)}
                  className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                    schedule === sched
                      ? 'bg-forge-indigo/20 border-forge-indigo/50 text-forge-indigo'
                      : 'bg-void-900 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {getScheduleLabel(sched)}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 bg-void-900/50 border border-white/5 rounded-lg text-gray-400">
              {getScheduleLabel(config.schedule)}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Save Buttons */}
      <div className="flex items-center gap-2 mb-6">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-forge-indigo/10 hover:bg-forge-indigo/20 text-forge-indigo rounded-lg transition-colors text-sm font-medium"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Edit Configuration
          </button>
        )}
      </div>

      {/* Sync Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Entries</div>
          <div className="text-lg font-semibold text-white">
            {config.total_entries.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Synced</div>
          <div className="text-lg font-semibold text-emerald-400">
            {config.synced_entries.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Failed</div>
          <div className="text-lg font-semibold text-red-400">
            {config.failed_entries.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Sync Timestamps */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Last Sync</span>
          <span className="text-gray-300">{formatDate(config.last_sync_at)}</span>
        </div>
        {config.schedule !== 'manual' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Next Sync</span>
            <span className="text-gray-300">{formatDate(config.next_sync_at)}</span>
          </div>
        )}
      </div>

      {/* Sync Now Button */}
      <button
        onClick={onSyncNow}
        disabled={config.sync_status === 'running' || !config.is_enabled || !config.sitemap_url}
        className="w-full px-4 py-3 bg-forge-orange/10 hover:bg-forge-orange/20 text-forge-orange rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${config.sync_status === 'running' ? 'animate-spin' : ''}`} />
        {config.sync_status === 'running' ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}

export default CatalogSyncPanel;
