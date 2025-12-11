/**
 * Catalog Stats Widget Component
 *
 * Overview widget showing catalog statistics with pie chart and metrics.
 * Displays total entries, topic distribution, sync health, and coverage.
 */

import React from 'react';
import {
  Database,
  Tag,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TopicDistribution {
  topic: string;
  count: number;
  percentage: number;
}

interface CatalogStats {
  total_entries: number;
  active_entries: number;
  pillar_entries: number;
  synced_entries: number;
  error_entries: number;
  pending_entries: number;
  total_topics: number;
  total_keywords: number;
  avg_links_per_entry: number;
  coverage_percentage: number;
  topic_distribution: TopicDistribution[];
}

interface CatalogStatsWidgetProps {
  stats: CatalogStats;
  className?: string;
}

const COLORS = [
  '#f97316', // forge-orange
  '#6366f1', // forge-indigo
  '#8b5cf6', // forge-purple
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function CatalogStatsWidget({ stats, className = '' }: CatalogStatsWidgetProps) {
  const getSyncHealthColor = () => {
    const errorRate = stats.total_entries > 0 ? (stats.error_entries / stats.total_entries) * 100 : 0;
    if (errorRate === 0) return 'text-emerald-400';
    if (errorRate < 5) return 'text-blue-400';
    if (errorRate < 15) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSyncHealthLabel = () => {
    const errorRate = stats.total_entries > 0 ? (stats.error_entries / stats.total_entries) * 100 : 0;
    if (errorRate === 0) return 'Excellent';
    if (errorRate < 5) return 'Good';
    if (errorRate < 15) return 'Fair';
    return 'Poor';
  };

  const getCoverageColor = () => {
    if (stats.coverage_percentage >= 80) return 'text-emerald-400';
    if (stats.coverage_percentage >= 60) return 'text-blue-400';
    if (stats.coverage_percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getCoverageBarColor = () => {
    if (stats.coverage_percentage >= 80) return 'bg-emerald-500';
    if (stats.coverage_percentage >= 60) return 'bg-blue-500';
    if (stats.coverage_percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Prepare pie chart data (top 6 topics + "Other")
  const topTopics = stats.topic_distribution.slice(0, 6);
  const otherTopics = stats.topic_distribution.slice(6);
  const otherCount = otherTopics.reduce((sum, t) => sum + t.count, 0);

  const pieData = [
    ...topTopics.map((t) => ({ name: t.topic, value: t.count })),
    ...(otherCount > 0 ? [{ name: 'Other', value: otherCount }] : []),
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-3 py-2">
          <p className="text-sm text-white font-medium">{payload[0].name}</p>
          <p className="text-xs text-gray-400">
            {payload[0].value} entries ({Math.round((payload[0].value / stats.total_entries) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-forge-orange/10 rounded-lg">
          <Database className="w-6 h-6 text-forge-orange" />
        </div>
        <div>
          <h3 className="text-lg font-display font-semibold text-white">
            Catalog Overview
          </h3>
          <p className="text-sm text-gray-400">
            Statistics and health metrics
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-void-900/50 rounded-lg border border-white/5">
          <div className="text-xs text-gray-500 mb-1">Total Entries</div>
          <div className="text-2xl font-bold text-white">
            {stats.total_entries.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.active_entries} active
          </div>
        </div>

        <div className="p-4 bg-void-900/50 rounded-lg border border-white/5">
          <div className="text-xs text-gray-500 mb-1">Pillar Content</div>
          <div className="text-2xl font-bold text-forge-purple">
            {stats.pillar_entries}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.total_entries > 0
              ? Math.round((stats.pillar_entries / stats.total_entries) * 100)
              : 0}% of total
          </div>
        </div>

        <div className="p-4 bg-void-900/50 rounded-lg border border-white/5">
          <div className="text-xs text-gray-500 mb-1">Topics</div>
          <div className="text-2xl font-bold text-forge-indigo">
            {stats.total_topics}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.total_keywords} keywords
          </div>
        </div>

        <div className="p-4 bg-void-900/50 rounded-lg border border-white/5">
          <div className="text-xs text-gray-500 mb-1">Avg Links</div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats.avg_links_per_entry.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">per entry</div>
        </div>
      </div>

      {/* Sync Health */}
      <div className="mb-6 p-4 bg-void-900/50 rounded-lg border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${getSyncHealthColor()}`} />
            <span className="text-sm font-medium text-gray-300">Sync Health</span>
          </div>
          <span className={`text-sm font-semibold ${getSyncHealthColor()}`}>
            {getSyncHealthLabel()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Synced</div>
            <div className="text-emerald-400 font-semibold">{stats.synced_entries}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Pending</div>
            <div className="text-orange-400 font-semibold">{stats.pending_entries}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Errors</div>
            <div className="text-red-400 font-semibold">{stats.error_entries}</div>
          </div>
        </div>
      </div>

      {/* Coverage Percentage */}
      <div className="mb-6 p-4 bg-void-900/50 rounded-lg border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-forge-orange" />
            <span className="text-sm font-medium text-gray-300">Catalog Coverage</span>
          </div>
          <span className={`text-sm font-semibold ${getCoverageColor()}`}>
            {stats.coverage_percentage}%
          </span>
        </div>
        <div className="h-2 bg-void-950 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getCoverageBarColor()}`}
            style={{ width: `${stats.coverage_percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Percentage of site content indexed in catalog
        </p>
      </div>

      {/* Topic Distribution Chart */}
      {pieData.length > 0 && (
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-forge-indigo" />
            <h4 className="text-sm font-medium text-gray-300">Topic Distribution</h4>
          </div>

          {/* Pie Chart */}
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-400 truncate">{entry.name}</span>
                <span className="text-gray-500 ml-auto">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogStatsWidget;
