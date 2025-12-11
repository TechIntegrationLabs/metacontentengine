import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import type { ContributorPerformance } from '@content-engine/types';
import { GlassCard } from '../components/GlassCard';

interface ContributorPerformanceChartProps {
  performances: ContributorPerformance[];
  contributorName?: string;
  className?: string;
  chartType?: 'line' | 'area';
}

interface ChartDataPoint {
  period: string;
  quality: number;
  articles: number;
}

export default function ContributorPerformanceChart({
  performances,
  contributorName,
  className = '',
  chartType = 'area',
}: ContributorPerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>(
    'month'
  );
  const [selectedMetric, setSelectedMetric] = useState<'quality' | 'articles' | 'both'>('both');

  // Filter performances by selected period
  const filteredPerformances = performances.filter((p) => p.period === selectedPeriod);

  // Transform data for chart
  const chartData: ChartDataPoint[] = filteredPerformances.map((perf, index) => ({
    period: getPeriodLabel(perf.period, index),
    quality: perf.averageQuality,
    articles: perf.articlesPublished,
  }));

  // Calculate overall trend
  const overallTrend = calculateOverallTrend(performances);

  function getPeriodLabel(period: string, index: number): string {
    const periods = {
      week: `Week ${index + 1}`,
      month: `Month ${index + 1}`,
      quarter: `Q${index + 1}`,
      all: 'All Time',
    };
    return periods[period as keyof typeof periods] || period;
  }

  function calculateOverallTrend(
    perfs: ContributorPerformance[]
  ): 'up' | 'down' | 'stable' {
    if (perfs.length === 0) return 'stable';

    const recentPerfs = perfs.slice(-3);
    const upCount = recentPerfs.filter((p) => p.trend === 'up').length;
    const downCount = recentPerfs.filter((p) => p.trend === 'down').length;

    if (upCount > downCount) return 'up';
    if (downCount > upCount) return 'down';
    return 'stable';
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'down':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'Improving';
      case 'down':
        return 'Declining';
      default:
        return 'Stable';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-void-700">
          <p className="text-xs font-semibold text-void-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-void-400 capitalize">{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.value}
                {entry.name === 'quality' && '/100'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard variant="panel" className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-void-100">
            {contributorName ? `${contributorName} Performance` : 'Performance Over Time'}
          </h2>
          <p className="text-xs text-void-400 mt-1">
            Track quality scores and article output
          </p>
        </div>

        {/* Overall Trend Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getTrendColor(
            overallTrend
          )}`}
        >
          {getTrendIcon(overallTrend)}
          <span className="text-xs font-semibold">{getTrendLabel(overallTrend)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-4">
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-void-400" />
          <div className="flex gap-1 p-1 rounded-lg bg-void-900/50 border border-void-700/50">
            {(['week', 'month', 'quarter', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedPeriod === period
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-void-400 hover:text-void-200 hover:bg-void-800/50'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-void-900/50 border border-void-700/50">
          {(['quality', 'articles', 'both'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedMetric === metric
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-void-400 hover:text-void-200 hover:bg-void-800/50'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-void-400">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No performance data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1c24" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-void-300 capitalize">{value}</span>
                  )}
                />
                {(selectedMetric === 'quality' || selectedMetric === 'both') && (
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="#8b5cf6"
                    fill="url(#colorQuality)"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(selectedMetric === 'articles' || selectedMetric === 'both') && (
                  <Area
                    type="monotone"
                    dataKey="articles"
                    stroke="#6366f1"
                    fill="url(#colorArticles)"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1c24" opacity={0.3} />
                <XAxis
                  dataKey="period"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-void-300 capitalize">{value}</span>
                  )}
                />
                {(selectedMetric === 'quality' || selectedMetric === 'both') && (
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(selectedMetric === 'articles' || selectedMetric === 'both') && (
                  <Line
                    type="monotone"
                    dataKey="articles"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Trends */}
      {performances.length > 0 && (
        <div className="mt-6 pt-4 border-t border-void-700/50">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-void-400 mb-3">
            Recent Performance
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {performances.slice(-3).map((perf, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-void-900/30 border border-void-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-void-400 capitalize">{perf.period}</span>
                  {getTrendIcon(perf.trend)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-void-400">Quality:</span>
                    <span className="text-void-100 font-semibold">
                      {perf.averageQuality}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-void-400">Articles:</span>
                    <span className="text-void-100 font-semibold">
                      {perf.articlesPublished}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
