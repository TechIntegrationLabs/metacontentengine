import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Search,
  Link,
  Image,
  History,
  ChevronRight,
  X
} from 'lucide-react';
import { EditorPanel } from './EditorPanel';
import { WordCountWidget } from './WordCountWidget';
import { SeoPreviewWidget } from './SeoPreviewWidget';

export type EditorSidebarTab = 'overview' | 'seo' | 'links' | 'media' | 'history';

export interface EditorSidebarProps {
  defaultOpen?: boolean;
  defaultTab?: EditorSidebarTab;
  wordCount: number;
  characterCount?: number;
  title?: string;
  description?: string;
  url?: string;
  keywords?: string[];
  content?: string;
  targetWordMin?: number;
  targetWordMax?: number;
  linkSuggestions?: Array<{ title: string; url: string; relevance: number }>;
  media?: Array<{ id: string; url: string; alt: string; size: number }>;
  revisions?: Array<{ id: string; timestamp: Date; author: string; changes: string }>;
  onTabChange?: (tab: EditorSidebarTab) => void;
  className?: string;
}

const STORAGE_KEY = 'editor-sidebar-state';

export const EditorSidebar = ({
  defaultOpen = true,
  defaultTab = 'overview',
  wordCount,
  characterCount,
  title,
  description,
  url,
  keywords = [],
  content = '',
  targetWordMin = 800,
  targetWordMax = 1200,
  linkSuggestions = [],
  media = [],
  revisions = [],
  onTabChange,
  className = ''
}: EditorSidebarProps) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).isOpen : defaultOpen;
  });

  const [activeTab, setActiveTab] = useState<EditorSidebarTab>(() => {
    if (typeof window === 'undefined') return defaultTab;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).activeTab : defaultTab;
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isOpen, activeTab }));
  }, [isOpen, activeTab]);

  const handleTabChange = (tab: EditorSidebarTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'seo' as const, label: 'SEO', icon: Search },
    { id: 'links' as const, label: 'Links', icon: Link },
    { id: 'media' as const, label: 'Media', icon: Image },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="lg:hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-3xl border-t border-white/10 max-h-[70vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex items-center justify-center py-2 border-b border-white/5">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-forge-accent text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-4 max-h-[calc(70vh-8rem)] custom-scrollbar">
                {renderTabContent(activeTab, {
                  wordCount,
                  characterCount,
                  title,
                  description,
                  url,
                  keywords,
                  content,
                  targetWordMin,
                  targetWordMax,
                  linkSuggestions,
                  media,
                  revisions
                })}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 px-4 py-3 bg-gradient-to-r from-forge-accent to-orange-600 text-white font-medium rounded-xl shadow-glow-accent flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Editor Tools</span>
          </button>
        )}
      </div>

      {/* Desktop: Side Panel */}
      <div className={`hidden lg:block ${className}`}>
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full glass-card border-l border-white/10 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Editor Tools</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex flex-col gap-1 px-3 py-3 border-b border-white/5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-forge-accent/20 text-forge-accent border border-forge-accent/30'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {renderTabContent(activeTab, {
                  wordCount,
                  characterCount,
                  title,
                  description,
                  url,
                  keywords,
                  content,
                  targetWordMin,
                  targetWordMax,
                  linkSuggestions,
                  media,
                  revisions
                })}
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 48, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              onClick={() => setIsOpen(true)}
              className="h-full glass-card border-l border-white/10 flex flex-col items-center justify-center gap-4 py-8 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
              <div className="writing-mode-vertical text-sm font-medium text-slate-400">
                Editor Tools
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

function renderTabContent(
  tab: EditorSidebarTab,
  data: {
    wordCount: number;
    characterCount?: number;
    title?: string;
    description?: string;
    url?: string;
    keywords?: string[];
    content?: string;
    targetWordMin?: number;
    targetWordMax?: number;
    linkSuggestions?: Array<{ title: string; url: string; relevance: number }>;
    media?: Array<{ id: string; url: string; alt: string; size: number }>;
    revisions?: Array<{ id: string; timestamp: Date; author: string; changes: string }>;
  }
) {
  switch (tab) {
    case 'overview':
      return (
        <div className="space-y-4">
          <WordCountWidget
            wordCount={data.wordCount}
            characterCount={data.characterCount}
            targetMin={data.targetWordMin}
            targetMax={data.targetWordMax}
          />

          <EditorPanel title="Quality Preview" icon={<BarChart3 className="w-4 h-4" />}>
            <div className="space-y-2 text-sm text-slate-400">
              <p>Quality analysis will appear here once content is generated.</p>
            </div>
          </EditorPanel>
        </div>
      );

    case 'seo':
      return (
        <SeoPreviewWidget
          title={data.title}
          description={data.description}
          url={data.url}
          keywords={data.keywords}
          content={data.content}
        />
      );

    case 'links':
      return (
        <EditorPanel title="Internal Links" icon={<Link className="w-4 h-4" />}>
          {data.linkSuggestions && data.linkSuggestions.length > 0 ? (
            <div className="space-y-2">
              {data.linkSuggestions.map((link, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-forge-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{link.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{link.url}</p>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">
                      {Math.round(link.relevance * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No link suggestions available yet.</p>
          )}
        </EditorPanel>
      );

    case 'media':
      return (
        <EditorPanel title="Attached Media" icon={<Image className="w-4 h-4" />}>
          {data.media && data.media.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {data.media.map((item) => (
                <div key={item.id} className="aspect-square bg-void-800/50 rounded-lg overflow-hidden border border-white/5">
                  <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No media attached yet.</p>
          )}
        </EditorPanel>
      );

    case 'history':
      return (
        <EditorPanel title="Revision History" icon={<History className="w-4 h-4" />}>
          {data.revisions && data.revisions.length > 0 ? (
            <div className="space-y-3">
              {data.revisions.map((revision) => (
                <div key={revision.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{revision.author}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(revision.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{revision.changes}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No revision history available.</p>
          )}
        </EditorPanel>
      );

    default:
      return null;
  }
}

export default EditorSidebar;
