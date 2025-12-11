import { FileText, CheckCircle, Clock, TrendingUp, Users, FolderOpen } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { PerformanceChart } from './PerformanceChart';
import { DateRangePicker } from './DateRangePicker';
import type { AnalyticsData, DateRangeFilter } from '@content-engine/types';

interface AnalyticsDashboardProps {
  data: AnalyticsData | null;
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter) => void;
  isLoading?: boolean;
  className?: string;
}

export function AnalyticsDashboard({
  data,
  dateRange,
  onDateRangeChange,
  isLoading = false,
  className = '',
}: AnalyticsDashboardProps) {
  const metrics = data?.metrics;
  const chartData = data?.chartData || [];
  const topContributors = data?.topContributors || [];
  const topCategories = data?.topCategories || [];

  return (
    <div className={['space-y-6', className].join(' ')}>
      {/* Header with date picker */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Analytics
          </h1>
          <p className="text-slate-400 mt-1">
            Track content performance and team productivity
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Articles"
          value={metrics?.totalArticles.toLocaleString() || '0'}
          subtitle="All content pieces"
          icon={<FileText className="w-4 h-4 text-indigo-400" />}
          colorClass="indigo"
          isLoading={isLoading}
        />

        <MetricCard
          title="Published"
          value={metrics?.publishedCount.toLocaleString() || '0'}
          subtitle="Live on site"
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
          colorClass="emerald"
          isLoading={isLoading}
        />

        <MetricCard
          title="In Progress"
          value={metrics?.draftCount.toLocaleString() || '0'}
          subtitle="Being created"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          colorClass="amber"
          isLoading={isLoading}
        />

        <MetricCard
          title="Avg Quality"
          value={metrics ? `${Math.round(metrics.averageQualityScore)}%` : '0%'}
          subtitle="Content score"
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
          colorClass="purple"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart
          data={chartData}
          type="line"
          title="Article Production"
          height={320}
          showArticles={true}
          showWords={false}
          showQuality={false}
          isLoading={isLoading}
        />

        <PerformanceChart
          data={chartData}
          type="bar"
          title="Words Generated"
          height={320}
          showArticles={false}
          showWords={true}
          showQuality={false}
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-display font-bold text-white">Top Contributors</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="h-4 bg-slate-700 rounded w-32" />
                  <div className="h-4 bg-slate-700 rounded w-16" />
                </div>
              ))}
            </div>
          ) : topContributors.length === 0 ? (
            <p className="text-slate-500 text-sm">No contributor data available</p>
          ) : (
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{contributor.name}</p>
                      <p className="text-xs text-slate-500">
                        {contributor.totalWords.toLocaleString()} words
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-400">
                      {contributor.articles} articles
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.round(contributor.avgQuality)}% quality
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FolderOpen className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-display font-bold text-white">Top Categories</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-slate-700 rounded w-24" />
                    <div className="h-3 bg-slate-700 rounded w-12" />
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full w-full" />
                </div>
              ))}
            </div>
          ) : topCategories.length === 0 ? (
            <p className="text-slate-500 text-sm">No category data available</p>
          ) : (
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{category.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-slate-500">
                        {Math.round(category.percentage)}%
                      </p>
                      <p className="text-sm font-bold text-orange-400">{category.count}</p>
                    </div>
                  </div>
                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-display font-bold text-white">Content Insights</h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-700 rounded w-24" />
                <div className="h-6 bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Words</p>
              <p className="text-2xl font-display font-bold text-white">
                {metrics?.totalWordsGenerated.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Content generated</p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Scheduled</p>
              <p className="text-2xl font-display font-bold text-white">
                {metrics?.scheduledCount || '0'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Ready to publish</p>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-1">Publish Rate</p>
              <p className="text-2xl font-display font-bold text-white">
                {metrics?.totalArticles
                  ? `${Math.round((metrics.publishedCount / metrics.totalArticles) * 100)}%`
                  : '0%'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Of all articles</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
