import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import {
  Save,
  Eye,
  Send,
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  BarChart2,
  FileText,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useArticles, Article, useTenant, useContributors } from '@content-engine/hooks';

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { getArticle, updateArticle, createArticle } = useArticles({ supabase, autoFetch: false });
  const { contributors } = useContributors({ supabase, filters: { isActive: true } });

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Article['status']>('draft');
  const [contributorId, setContributorId] = useState<string | null>(null);
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // TipTap Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We'll use custom heading extension
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-400 underline hover:text-indigo-300',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your article...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      // Content change handler if needed
    },
  });

  // Load article data
  useEffect(() => {
    const loadArticle = async () => {
      if (!id || id === 'new') {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getArticle(id);
        if (data) {
          setArticle(data);
          setTitle(data.title);
          setStatus(data.status);
          setContributorId(data.contributor_id || null);
          setPrimaryKeyword(data.primary_keyword || '');
          editor?.commands.setContent(data.content || '');
        }
      } catch (err) {
        setError('Failed to load article');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (editor) {
      loadArticle();
    }
  }, [id, getArticle, editor]);

  // Calculate word count and reading time
  const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length || 0;
  const readingTime = Math.ceil(wordCount / 200);

  // Calculate quality score (basic implementation)
  const qualityScore = Math.min(100, Math.round(
    (wordCount >= 500 ? 30 : Math.round(wordCount / 500 * 30)) +
    (title.length > 0 ? 20 : 0) +
    (editor?.getHTML().includes('<h2>') ? 15 : 0) +
    (editor?.getHTML().includes('<ul>') || editor?.getHTML().includes('<ol>') ? 10 : 0) +
    (primaryKeyword ? 15 : 0) +
    10 // Base score
  ));

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const content = editor?.getHTML() || '';
      const articleData = {
        title: title.trim(),
        slug: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content,
        status,
        contributor_id: contributorId || undefined,
        primary_keyword: primaryKeyword || undefined,
        word_count: wordCount,
        reading_time: readingTime,
        quality_score: qualityScore,
      };

      if (article?.id) {
        await updateArticle({ id: article.id, ...articleData });
      } else {
        const newArticle = await createArticle(articleData as any);
        setArticle(newArticle);
        // Update URL without reloading
        window.history.replaceState(null, '', `/articles/${newArticle.id}`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setStatus('published');
    // Save with published status
    const content = editor?.getHTML() || '';
    const articleData = {
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content,
      status: 'published' as const,
      contributor_id: contributorId || undefined,
      primary_keyword: primaryKeyword || undefined,
      word_count: wordCount,
      reading_time: readingTime,
      quality_score: qualityScore,
    };

    setIsSaving(true);
    try {
      if (article?.id) {
        await updateArticle({ id: article.id, ...articleData });
      } else {
        await createArticle(articleData as any);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        navigate('/articles');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setIsSaving(false);
    }
  };

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/articles')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {article ? 'Edit Article' : 'New Article'}
            </h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{wordCount} words</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{readingTime} min read</span>
              </span>
              {saveSuccess && (
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={[
              'px-4 py-2 rounded-lg flex items-center space-x-2 transition-all',
              isPreview
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            ].join(' ')}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center space-x-2 transition-all border border-white/10 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-h-0 bg-void-900/50 rounded-2xl border border-white/5 overflow-hidden">
          {/* Toolbar */}
          {!isPreview && (
            <div className="flex items-center p-3 border-b border-white/5 bg-void-950/30 flex-wrap gap-1">
              {/* Undo/Redo */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* Headings */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('heading', { level: 1 })
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('heading', { level: 2 })
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('heading', { level: 3 })
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* Text Formatting */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('bold')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('italic')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('underline')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Underline"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* Lists */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('bulletList')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('orderedList')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('blockquote')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* Alignment */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive({ textAlign: 'left' })
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive({ textAlign: 'center' })
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive({ textAlign: 'right' })
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-white/10 mx-2" />

              {/* Links and Code */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={setLink}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('link')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Insert Link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={[
                    'p-2 rounded-lg transition-colors',
                    editor?.isActive('codeBlock')
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  ].join(' ')}
                  title="Code Block"
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="p-6 border-b border-white/5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title..."
              className="w-full bg-transparent text-3xl font-display font-bold text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {isPreview ? (
              <div className="p-6 prose prose-invert prose-lg max-w-none">
                <h1>{title || 'Untitled Article'}</h1>
                <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '<p>No content yet...</p>' }} />
              </div>
            ) : (
              <EditorContent editor={editor} className="h-full" />
            )}
          </div>
        </div>

        {/* Right Sidebar - AI Assistant & Metadata */}
        <div className="w-80 flex flex-col space-y-4 overflow-y-auto">
          {/* AI Writing Assistant */}
          <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="font-medium text-white">AI Assistant</span>
            </div>

            <div className="space-y-2">
              <button className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors group">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-slate-300">Improve Writing</span>
                </div>
              </button>
              <button className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors group">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Generate Outline</span>
                </div>
              </button>
              <button className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors group">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300">Check Quality</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quality Score */}
          <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-medium text-white">Quality Score</span>
            </div>

            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    strokeWidth="8"
                    className="fill-none stroke-white/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={[
                      'fill-none',
                      qualityScore >= 80 ? 'stroke-emerald-500' :
                      qualityScore >= 60 ? 'stroke-amber-500' :
                      'stroke-red-500'
                    ].join(' ')}
                    style={{
                      strokeDasharray: 251.2,
                      strokeDashoffset: 251.2 * (1 - qualityScore / 100)
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{qualityScore}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Word Count</span>
                <span className={wordCount >= 500 ? 'text-emerald-400' : 'text-amber-400'}>
                  {wordCount >= 500 ? 'Good' : 'Add more content'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SEO Keyword</span>
                <span className={primaryKeyword ? 'text-emerald-400' : 'text-slate-400'}>
                  {primaryKeyword ? 'Set' : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Structure</span>
                <span className={editor?.getHTML().includes('<h2>') ? 'text-emerald-400' : 'text-amber-400'}>
                  {editor?.getHTML().includes('<h2>') ? 'Good' : 'Add headings'}
                </span>
              </div>
            </div>
          </div>

          {/* Article Settings */}
          <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="font-medium text-white mb-4">Article Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Article['status'])}
                  className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Contributor</label>
                <select
                  value={contributorId || ''}
                  onChange={(e) => setContributorId(e.target.value || null)}
                  className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Select Contributor</option>
                  {contributors.map(c => (
                    <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Primary Keyword</label>
                <input
                  type="text"
                  value={primaryKeyword}
                  onChange={(e) => setPrimaryKeyword(e.target.value)}
                  placeholder="SEO target keyword..."
                  className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
