import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useArticles, Article, ArticleStatus } from '@content-engine/hooks';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  idea: {
    label: 'Idea',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    icon: FileText
  },
  outline: {
    label: 'Outline',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    icon: FileText
  },
  drafting: {
    label: 'Drafting',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    icon: Clock
  },
  humanizing: {
    label: 'Humanizing',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    icon: AlertCircle
  },
  review: {
    label: 'In Review',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    icon: AlertCircle
  },
  ready: {
    label: 'Ready',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    icon: CheckCircle2
  },
  scheduled: {
    label: 'Scheduled',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    icon: Calendar
  },
  published: {
    label: 'Published',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    icon: CheckCircle2
  },
  archived: {
    label: 'Archived',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
    icon: FileText
  }
};

const Articles: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const {
    articles,
    isLoading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    refetch
  } = useArticles({
    supabase,
    filters: {
      status: statusFilter !== 'all' ? statusFilter as ArticleStatus : undefined,
      search: searchQuery || undefined,
      orderBy: 'updated_at',
      orderDirection: 'desc'
    }
  });

  const stats = useMemo(() => ({
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    scheduled: articles.filter(a => a.status === 'scheduled').length,
    drafts: articles.filter(a => ['idea', 'outline', 'drafting'].includes(a.status)).length,
    review: articles.filter(a => ['humanizing', 'review', 'ready'].includes(a.status)).length
  }), [articles]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    setIsDeleting(id);
    try {
      await deleteArticle(id);
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Failed to delete article');
    } finally {
      setIsDeleting(null);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-400">Failed to load articles</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Articles</h1>
          <p className="text-slate-500 mt-1">Manage and organize your content library</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-void-900/50 border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/articles/new')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Article</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Total Articles</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.published}</p>
        </div>
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">In Review</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats.review}</p>
        </div>
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Drafts</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-400">{stats.drafts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-void-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-void-900/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Status</option>
            <option value="idea">Ideas</option>
            <option value="drafting">Drafting</option>
            <option value="humanizing">Humanizing</option>
            <option value="review">In Review</option>
            <option value="ready">Ready</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <FileText className="w-12 h-12 text-slate-600" />
          <p className="text-slate-400">No articles found</p>
          <button
            onClick={() => navigate('/articles/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Create your first article
          </button>
        </div>
      )}

      {/* Articles Table */}
      {!isLoading && articles.length > 0 && (
        <div className="bg-void-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Article</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Contributor</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Quality</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Words</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const status = statusConfig[article.status] || statusConfig.idea;
                const StatusIcon = status.icon;
                const contributorName = article.contributor?.display_name || article.contributor?.name || 'Unknown';
                const contributorInitials = contributorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <tr key={article.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className="font-medium text-white hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1"
                          onClick={() => navigate(`/articles/${article.id}`)}
                        >
                          {article.title}
                        </p>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                          {article.primary_keyword && (
                            <span className="px-2 py-0.5 rounded-full bg-white/5">{article.primary_keyword}</span>
                          )}
                          <span>{article.reading_time || 0} min read</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {contributorInitials}
                        </div>
                        <span className="text-sm text-slate-300">{contributorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {article.quality_score ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                article.quality_score >= 90 ? 'bg-emerald-500' :
                                article.quality_score >= 80 ? 'bg-indigo-500' :
                                article.quality_score >= 70 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${article.quality_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-400">{article.quality_score}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">
                        {article.word_count?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/articles/${article.id}`)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {article.status === 'published' && article.published_url && (
                          <a
                            href={article.published_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
                          disabled={isDeleting === article.id}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isDeleting === article.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Articles;
