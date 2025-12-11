import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  FileText,
  Calendar,
  BarChart2,
  Loader2,
  RefreshCw,
  Palmtree
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useArticles, Article } from '@content-engine/hooks';

type FilterStatus = 'all' | 'draft' | 'review' | 'published' | 'scheduled';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
  review: { label: 'Review', color: 'text-pcc-gold', bgColor: 'bg-pcc-gold/10' },
  published: { label: 'Published', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  scheduled: { label: 'Scheduled', color: 'text-pcc-coral', bgColor: 'bg-pcc-coral/10' },
  drafting: { label: 'Drafting', color: 'text-pcc-teal', bgColor: 'bg-pcc-teal/10' },
  humanizing: { label: 'Humanizing', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
};

const Articles: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    articles,
    isLoading,
    error,
    deleteArticle,
    refetch
  } = useArticles({
    supabase,
    filters: {
      search: searchQuery || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    setDeletingId(id);
    try {
      await deleteArticle(id);
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Failed to delete article');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      drafts: articles.filter(a => a.status === 'draft' || a.status === 'drafting').length,
      avgQuality: articles.length > 0
        ? Math.round(articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / articles.filter(a => a.quality_score).length)
        : 0,
    };
  }, [articles]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-400">Failed to load articles</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-pcc-teal text-white rounded-lg hover:bg-pcc-teal/90 transition-colors"
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
          <h1 className="text-3xl font-display font-bold text-white flex items-center space-x-3">
            <Palmtree className="w-8 h-8 text-pcc-teal" />
            <span>Articles</span>
          </h1>
          <p className="text-slate-500 mt-1">Manage your content library</p>
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
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pcc-coral to-pcc-gold hover:from-pcc-coral/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all shadow-lg shadow-pcc-coral/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Article</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1">
            <FileText className="w-4 h-4 text-pcc-teal" />
            <span className="text-xs text-slate-500 uppercase">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase">Published</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.published}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Edit3 className="w-4 h-4 text-pcc-gold" />
            <span className="text-xs text-slate-500 uppercase">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.drafts}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart2 className="w-4 h-4 text-pcc-coral" />
            <span className="text-xs text-slate-500 uppercase">Avg Quality</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgQuality || '--'}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-void-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center space-x-2 px-4 py-3 bg-void-900/50 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/10 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="capitalize">{filterStatus === 'all' ? 'All Status' : filterStatus}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-void-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              {(['all', 'draft', 'review', 'published', 'scheduled'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-white/5 transition-colors capitalize ${
                    filterStatus === status ? 'text-pcc-teal bg-pcc-teal/5' : 'text-slate-400'
                  }`}
                >
                  {status === 'all' ? 'All Status' : status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-pcc-teal animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">No articles found</p>
          <button
            onClick={() => navigate('/forge')}
            className="px-4 py-2 bg-pcc-teal text-white rounded-lg hover:bg-pcc-teal/90 transition-colors"
          >
            Create your first article
          </button>
        </div>
      )}

      {/* Articles Table */}
      {!isLoading && articles.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Words</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const status = statusConfig[article.status] || statusConfig.draft;
                return (
                  <tr
                    key={article.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate(`/articles/${article.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-pcc-teal/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-pcc-teal" />
                        </div>
                        <div>
                          <p className="text-white font-medium truncate max-w-[300px]">{article.title}</p>
                          {article.categories && article.categories.length > 0 && (
                            <p className="text-xs text-slate-500">{article.categories[0]}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${status.color} ${status.bgColor}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {article.quality_score ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                article.quality_score >= 90 ? 'bg-emerald-500' :
                                article.quality_score >= 80 ? 'bg-pcc-teal' :
                                article.quality_score >= 70 ? 'bg-pcc-gold' : 'bg-pcc-coral'
                              }`}
                              style={{ width: `${article.quality_score}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-400">{article.quality_score}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400">
                      {article.word_count?.toLocaleString() || '--'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {formatDate(article.updated_at)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/articles/${article.id}`)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          disabled={deletingId === article.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === article.id ? (
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
