import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FileText,
  Tag,
  Globe,
  Palmtree
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useArticle, useContributors, Article } from '@content-engine/hooks';

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/10 text-slate-400' },
  { value: 'review', label: 'In Review', color: 'bg-pcc-gold/10 text-pcc-gold' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-pcc-coral/10 text-pcc-coral' },
  { value: 'published', label: 'Published', color: 'bg-emerald-500/10 text-emerald-400' },
];

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { article, isLoading, error, updateArticle } = useArticle({
    supabase,
    articleId: isNew ? undefined : id
  });

  const { contributors } = useContributors({
    supabase,
    filters: { isActive: true }
  });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    contributor_id: '',
    categories: [] as string[],
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    slug: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load article data
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        status: article.status || 'draft',
        contributor_id: article.contributor_id || '',
        categories: article.categories || [],
        tags: article.tags || [],
        seo_title: article.seo_title || '',
        seo_description: article.seo_description || '',
        slug: article.slug || '',
      });
    }
  }, [article]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setSaveError('Title is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (isNew) {
        // Create new article
        const { data, error } = await supabase
          .from('articles')
          .insert({
            ...formData,
            word_count: formData.content.split(/\s+/).filter(Boolean).length,
          })
          .select()
          .single();

        if (error) throw error;

        setSaveSuccess(true);
        setTimeout(() => {
          navigate(`/articles/${data.id}`);
        }, 1000);
      } else {
        // Update existing article
        await updateArticle({
          ...formData,
          word_count: formData.content.split(/\s+/).filter(Boolean).length,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pcc-teal animate-spin" />
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-400">Failed to load article</p>
        <button
          onClick={() => navigate('/articles')}
          className="px-4 py-2 bg-pcc-teal text-white rounded-lg hover:bg-pcc-teal/90 transition-colors"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/articles')}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center space-x-2">
              <Palmtree className="w-6 h-6 text-pcc-teal" />
              <span>{isNew ? 'New Article' : 'Edit Article'}</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {wordCount.toLocaleString()} words
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <div className="flex items-center space-x-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pcc-coral to-pcc-gold hover:from-pcc-coral/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all shadow-lg shadow-pcc-coral/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-4">
          {/* Title */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-pcc-teal uppercase tracking-wider mb-3">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter article title..."
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 transition-all"
            />
          </div>

          {/* Content */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your article content here..."
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 h-[500px] resize-none font-mono text-sm transition-all"
            />
          </div>

          {/* Excerpt */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary of the article..."
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 h-24 resize-none transition-all"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contributor */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Contributor</span>
              </div>
            </label>
            <select
              value={formData.contributor_id}
              onChange={(e) => setFormData({ ...formData, contributor_id: e.target.value })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 transition-all"
            >
              <option value="">Select contributor...</option>
              {contributors.map((contributor) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.display_name || contributor.name}
                </option>
              ))}
            </select>
          </div>

          {/* SEO Settings */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-pcc-teal" />
              <span>SEO Settings</span>
            </h3>

            <div>
              <label className="block text-xs text-slate-500 mb-2">SEO Title</label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="SEO optimized title..."
                className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-2">Meta Description</label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Meta description for search engines..."
                className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 h-20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="url-friendly-slug"
                className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 transition-all"
              />
            </div>
          </div>

          {/* Article Info (for existing articles) */}
          {!isNew && article && (
            <div className="glass-card rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-white">Article Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created</span>
                  </span>
                  <span className="text-white">{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Updated</span>
                  </span>
                  <span className="text-white">{new Date(article.updated_at).toLocaleDateString()}</span>
                </div>
                {article.quality_score && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Quality Score</span>
                    <span className={`font-bold ${
                      article.quality_score >= 90 ? 'text-emerald-400' :
                      article.quality_score >= 80 ? 'text-pcc-teal' :
                      article.quality_score >= 70 ? 'text-pcc-gold' : 'text-pcc-coral'
                    }`}>
                      {article.quality_score}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
