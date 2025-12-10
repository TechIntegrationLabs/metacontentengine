import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Zap, FileText, TrendingUp, Users, Clock, Activity, PenTool, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useArticles, useContributors, useTenant } from '@content-engine/hooks';

// Helper function to format time ago
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Helper to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'published': return 'emerald';
    case 'humanizing': return 'amber';
    case 'drafting': return 'indigo';
    case 'review': return 'purple';
    case 'ready': return 'cyan';
    case 'scheduled': return 'blue';
    default: return 'slate';
  }
}

export function Dashboard() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { articles, isLoading: articlesLoading } = useArticles({
    supabase,
    filters: { limit: 100 }
  });
  const { contributors, isLoading: contributorsLoading } = useContributors({
    supabase,
    filters: { isActive: true }
  });

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalArticles = articles.length;
    const totalWords = articles.reduce((sum, a) => sum + (a.word_count || 0), 0);
    const avgQuality = articles.length > 0
      ? articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / articles.filter(a => a.quality_score).length
      : 0;

    return {
      totalArticles,
      totalWords,
      avgQuality: avgQuality || 0,
      activeContributors: contributors.length,
    };
  }, [articles, contributors]);

  // Get recent activity (last 10 updated articles)
  const recentActivity = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4)
      .map(article => ({
        id: article.id,
        title: article.title,
        status: article.status,
        time: timeAgo(article.updated_at),
        color: getStatusColor(article.status),
      }));
  }, [articles]);

  // Generate chart data from articles (articles per day for last 7 days)
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data: { name: string; articles: number; score: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      const dayArticles = articles.filter(a => {
        const articleDate = new Date(a.created_at);
        return articleDate.toDateString() === date.toDateString();
      });

      const avgScore = dayArticles.length > 0
        ? dayArticles.reduce((sum, a) => sum + (a.quality_score || 80), 0) / dayArticles.length
        : 80;

      data.push({
        name: dayName,
        articles: dayArticles.length,
        score: Math.round(avgScore),
      });
    }

    return data;
  }, [articles]);

  const isLoading = tenantLoading || articlesLoading || contributorsLoading;

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto flex items-center justify-center h-[400px]">
        <div className="flex items-center space-x-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-slide-up pb-10">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Command Center</h1>
          <p className="text-slate-400 mt-1">Real-time overview of your content production engine.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 bg-void-900/50 px-3 py-1.5 rounded-lg border border-white/5">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 lg:row-span-2 glass-card rounded-2xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Production Velocity</h3>
              <p className="text-sm text-slate-400">Articles generated this week</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#02040a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="articles" stroke="#6366f1" strokeWidth={3} fill="url(#colorArticles)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Total Articles</p>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">
            {stats.totalArticles.toLocaleString()}
          </h3>
          <div className="flex items-center text-slate-500 text-xs mt-1">
            <span>All time</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Words Generated</p>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">
            {stats.totalWords >= 1000
              ? `${(stats.totalWords / 1000).toFixed(1)}k`
              : stats.totalWords.toLocaleString()}
          </h3>
          <div className="flex items-center text-slate-500 text-xs mt-1">
            <span>Total word count</span>
          </div>
        </div>

        <div className="lg:col-span-1 lg:row-span-2 glass-card rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" /> Live Feed
          </h3>
          <div className="space-y-3 flex-1">
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                  <div className={['mt-1.5 w-2 h-2 rounded-full',
                    item.color === 'emerald' ? 'bg-emerald-500' :
                    item.color === 'amber' ? 'bg-amber-500' :
                    item.color === 'indigo' ? 'bg-indigo-500' :
                    item.color === 'purple' ? 'bg-purple-500' :
                    item.color === 'cyan' ? 'bg-cyan-500' :
                    item.color === 'blue' ? 'bg-blue-500' : 'bg-slate-500'
                  ].join(' ')} />
                  <div className="flex-1">
                    <p className="text-slate-200 text-sm truncate">{item.title}</p>
                    <div className="flex justify-between mt-1">
                      <span className={['text-[10px] uppercase',
                        item.color === 'emerald' ? 'text-emerald-400' :
                        item.color === 'amber' ? 'text-amber-400' :
                        item.color === 'indigo' ? 'text-indigo-400' :
                        item.color === 'purple' ? 'text-purple-400' :
                        item.color === 'cyan' ? 'text-cyan-400' :
                        item.color === 'blue' ? 'text-blue-400' : 'text-slate-400'
                      ].join(' ')}>{item.status}</span>
                      <span className="text-slate-600 text-[10px]">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Avg Quality</p>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">
            {stats.avgQuality > 0 ? stats.avgQuality.toFixed(1) : '--'}
          </h3>
          <div className="flex items-center text-slate-500 text-xs mt-1">
            <span>Quality score</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Contributors</p>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">
            {stats.activeContributors}
          </h3>
          <div className="flex items-center text-slate-500 text-xs mt-1">
            <span>Active personas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
