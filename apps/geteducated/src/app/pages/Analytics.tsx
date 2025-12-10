import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Users,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  BarChart2,
  PieChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from 'recharts';

const trafficData = [
  { date: 'Jan 1', views: 4200, visitors: 2800 },
  { date: 'Jan 2', views: 3800, visitors: 2400 },
  { date: 'Jan 3', views: 5100, visitors: 3200 },
  { date: 'Jan 4', views: 4700, visitors: 2900 },
  { date: 'Jan 5', views: 5800, visitors: 3600 },
  { date: 'Jan 6', views: 6200, visitors: 3900 },
  { date: 'Jan 7', views: 5400, visitors: 3400 },
  { date: 'Jan 8', views: 7100, visitors: 4200 },
  { date: 'Jan 9', views: 6800, visitors: 4100 },
  { date: 'Jan 10', views: 8200, visitors: 5100 },
  { date: 'Jan 11', views: 7500, visitors: 4600 },
  { date: 'Jan 12', views: 8900, visitors: 5400 },
  { date: 'Jan 13', views: 9200, visitors: 5800 },
  { date: 'Jan 14', views: 8400, visitors: 5200 },
];

const contentPerformance = [
  { category: 'Education', articles: 24, views: 45000 },
  { category: 'Careers', articles: 18, views: 32000 },
  { category: 'Technology', articles: 12, views: 28000 },
  { category: 'Finance', articles: 8, views: 15000 },
  { category: 'Lifestyle', articles: 5, views: 8000 },
];

const topArticles = [
  { title: 'Complete Guide to Online MBA Programs', views: 12453, trend: 15 },
  { title: 'Data Science Certifications Worth Your Investment', views: 8921, trend: 23 },
  { title: 'Understanding Accreditation: What It Means', views: 7234, trend: -5 },
  { title: 'Career Transition: From Traditional to Tech', views: 6102, trend: 8 },
  { title: 'How to Choose the Right Online Platform', views: 5234, trend: 12 },
];

const sourceData = [
  { name: 'Organic Search', value: 45, color: '#6366f1' },
  { name: 'Direct', value: 25, color: '#8b5cf6' },
  { name: 'Social Media', value: 18, color: '#f97316' },
  { name: 'Referral', value: 12, color: '#10b981' },
];

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('14d');

  const stats = [
    {
      label: 'Total Views',
      value: '156,432',
      change: '+12.5%',
      trend: 'up',
      icon: Eye
    },
    {
      label: 'Unique Visitors',
      value: '42,891',
      change: '+8.3%',
      trend: 'up',
      icon: Users
    },
    {
      label: 'Avg. Time on Page',
      value: '4:32',
      change: '+0:45',
      trend: 'up',
      icon: Clock
    },
    {
      label: 'Published Articles',
      value: '67',
      change: '+12',
      trend: 'up',
      icon: FileText
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Analytics</h1>
          <p className="text-slate-500 mt-1">Track content performance and audience insights</p>
        </div>
        <div className="flex items-center space-x-2">
          {['7d', '14d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                timeRange === range
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              ].join(' ')}
            >
              {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-void-900/50 rounded-xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className={[
                  'flex items-center space-x-1 text-sm',
                  stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                ].join(' ')}>
                  {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <div className="col-span-2 bg-void-900/50 rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Traffic Overview</h3>
              <p className="text-sm text-slate-500">Page views and unique visitors</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-400">Views</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-slate-400">Visitors</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0c14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Traffic Sources</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {sourceData.map((source, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-sm text-slate-400">{source.name}</span>
                </div>
                <span className="text-sm font-medium text-white">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Performing Articles</h3>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
          </div>
          <div className="space-y-4">
            {topArticles.map((article, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm font-bold text-indigo-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{article.title}</p>
                  <p className="text-xs text-slate-500">{article.views.toLocaleString()} views</p>
                </div>
                <div className={[
                  'flex items-center space-x-1 text-sm',
                  article.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                ].join(' ')}>
                  {article.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{article.trend >= 0 ? '+' : ''}{article.trend}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content by Category */}
        <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Content by Category</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0c14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="views" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
