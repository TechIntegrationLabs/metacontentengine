import React, { useState } from 'react';
import {
  Save,
  Eye,
  Send,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
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
  FileText
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  contributor: string;
  wordCount: number;
  qualityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  article?: Article;
  onBack: () => void;
  onSave: (article: Partial<Article>) => void;
}

const ArticleEditor: React.FC<Props> = ({ article, onBack, onSave }) => {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave({
      title,
      content,
      wordCount,
      updatedAt: new Date()
    });
    setIsSaving(false);
  };

  const toolbarGroups = [
    {
      items: [
        { icon: Undo, label: 'Undo', action: () => {} },
        { icon: Redo, label: 'Redo', action: () => {} },
      ]
    },
    {
      items: [
        { icon: Heading1, label: 'Heading 1', action: () => {} },
        { icon: Heading2, label: 'Heading 2', action: () => {} },
        { icon: Heading3, label: 'Heading 3', action: () => {} },
      ]
    },
    {
      items: [
        { icon: Bold, label: 'Bold', action: () => {} },
        { icon: Italic, label: 'Italic', action: () => {} },
        { icon: Underline, label: 'Underline', action: () => {} },
      ]
    },
    {
      items: [
        { icon: List, label: 'Bullet List', action: () => {} },
        { icon: ListOrdered, label: 'Numbered List', action: () => {} },
        { icon: Quote, label: 'Blockquote', action: () => {} },
      ]
    },
    {
      items: [
        { icon: AlignLeft, label: 'Align Left', action: () => {} },
        { icon: AlignCenter, label: 'Align Center', action: () => {} },
        { icon: AlignRight, label: 'Align Right', action: () => {} },
      ]
    },
    {
      items: [
        { icon: Link2, label: 'Insert Link', action: () => {} },
        { icon: Image, label: 'Insert Image', action: () => {} },
        { icon: Code, label: 'Code Block', action: () => {} },
      ]
    },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
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
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center space-x-2 transition-all border border-white/10"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Draft</span>
          </button>

          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all shadow-lg shadow-indigo-500/20">
            <Send className="w-4 h-4" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col min-h-0 bg-void-900/50 rounded-2xl border border-white/5 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center p-3 border-b border-white/5 bg-void-950/30 flex-wrap gap-1">
            {toolbarGroups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                <div className="flex items-center space-x-1">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={item.action}
                        title={item.label}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
                {groupIndex < toolbarGroups.length - 1 && (
                  <div className="w-px h-6 bg-white/10 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>

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
              <div className="p-6 prose prose-invert max-w-none">
                <h1>{title || 'Untitled Article'}</h1>
                <div className="whitespace-pre-wrap">{content || 'No content yet...'}</div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your article..."
                className="w-full h-full p-6 bg-transparent text-slate-300 placeholder-slate-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - AI Assistant & Metadata */}
        <div className="w-80 flex flex-col space-y-4">
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
                    className="fill-none stroke-emerald-500"
                    style={{
                      strokeDasharray: 251.2,
                      strokeDashoffset: 251.2 * (1 - 0.87)
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">87</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Readability</span>
                <span className="text-emerald-400">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SEO Score</span>
                <span className="text-amber-400">Good</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Originality</span>
                <span className="text-emerald-400">98%</span>
              </div>
            </div>
          </div>

          {/* Publishing Options */}
          <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="font-medium text-white mb-4">Publishing</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select className="w-full bg-void-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="">Select Category</option>
                  <option value="education">Education</option>
                  <option value="careers">Careers</option>
                  <option value="technology">Technology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Tags</label>
                <input
                  type="text"
                  placeholder="Add tags..."
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
