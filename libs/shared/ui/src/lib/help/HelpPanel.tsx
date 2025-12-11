import { useState, useMemo } from 'react';
import { X, Search, Book, FileText, Video, Mail, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  videoUrl?: string;
}

export interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // Current page/feature context
  sections?: HelpSection[];
  supportEmail?: string;
  onArticleClick?: (articleId: string) => void;
}

const defaultSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Book className="w-5 h-5" />,
    content: [
      {
        id: 'magic-setup',
        title: 'Magic Setup',
        description: 'Set up your brand DNA in minutes',
        content: 'Learn how to analyze your brand and configure your voice...',
        category: 'getting-started',
      },
      {
        id: 'first-content',
        title: 'Generate Your First Content',
        description: 'Create AI-powered content with personas',
        content: 'Step-by-step guide to generating content...',
        category: 'getting-started',
      },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    icon: <FileText className="w-5 h-5" />,
    content: [
      {
        id: 'content-forge',
        title: 'Content Forge',
        description: 'AI-powered content generation pipeline',
        content: 'Understand the generation pipeline...',
        category: 'features',
      },
      {
        id: 'contributors',
        title: 'Contributor Personas',
        description: 'Manage AI writing personas',
        content: 'Create and configure contributor personas...',
        category: 'features',
      },
      {
        id: 'quality-analysis',
        title: 'Quality Analysis',
        description: 'Automated content quality scoring',
        content: 'Learn how quality scores are calculated...',
        category: 'features',
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: <FileText className="w-5 h-5" />,
    content: [
      {
        id: 'api-keys',
        title: 'How do I configure API keys?',
        description: 'API key setup and management',
        content: 'Navigate to Settings > API Keys to configure your AI provider keys...',
        category: 'faq',
      },
      {
        id: 'wordpress-publish',
        title: 'How do I publish to WordPress?',
        description: 'WordPress integration setup',
        content: 'Configure your WordPress credentials in Settings...',
        category: 'faq',
      },
    ],
  },
];

export function HelpPanel({
  isOpen,
  onClose,
  context,
  sections = defaultSections,
  supportEmail = 'support@perdia.ai',
  onArticleClick,
}: HelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Filter articles based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    return sections
      .map((section) => ({
        ...section,
        content: section.content.filter(
          (article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((section) => section.content.length > 0);
  }, [sections, searchQuery]);

  // Get contextual articles based on current page
  const contextualArticles = useMemo(() => {
    if (!context) return [];

    return sections
      .flatMap((section) => section.content)
      .filter((article) =>
        article.category.toLowerCase().includes(context.toLowerCase()) ||
        article.title.toLowerCase().includes(context.toLowerCase())
      )
      .slice(0, 3);
  }, [context, sections]);

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
    onArticleClick?.(article.id);
  };

  const handleBack = () => {
    setSelectedArticle(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-void-900/95 backdrop-blur-xl border-l border-glass-200 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-forge-orange to-forge-purple flex items-center justify-center">
                  <Book className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Help Center</h2>
                  {context && (
                    <p className="text-sm text-glass-400 capitalize">{context}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-glass-200/50 transition-colors text-glass-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-glass-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-glass-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-glass-200/50 border border-glass-300 rounded-lg text-white placeholder-glass-400 focus:outline-none focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {selectedArticle ? (
                  // Article View
                  <motion.div
                    key="article"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 text-glass-400 hover:text-white transition-colors mb-6"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span className="text-sm">Back to articles</span>
                    </button>

                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedArticle.title}
                    </h3>
                    <p className="text-glass-400 mb-6">{selectedArticle.description}</p>

                    {selectedArticle.videoUrl && (
                      <div className="mb-6 rounded-lg overflow-hidden bg-glass-200/50 aspect-video flex items-center justify-center">
                        <Video className="w-12 h-12 text-glass-400" />
                        <p className="text-glass-400 ml-3">Video tutorial</p>
                      </div>
                    )}

                    <div className="prose prose-invert prose-glass max-w-none">
                      <div className="text-glass-300 whitespace-pre-wrap">
                        {selectedArticle.content}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // List View
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Contextual Help */}
                    {contextualArticles.length > 0 && !searchQuery && (
                      <div className="p-6 border-b border-glass-200">
                        <h3 className="text-sm font-semibold text-glass-400 uppercase tracking-wider mb-4">
                          Related to this page
                        </h3>
                        <div className="space-y-2">
                          {contextualArticles.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => handleArticleClick(article)}
                              className="w-full text-left p-3 rounded-lg bg-forge-orange/10 border border-forge-orange/20 hover:bg-forge-orange/20 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-white font-medium mb-1 group-hover:text-forge-orange transition-colors">
                                    {article.title}
                                  </h4>
                                  <p className="text-sm text-glass-400">
                                    {article.description}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-glass-400 group-hover:text-forge-orange transition-colors flex-shrink-0 mt-1" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Sections */}
                    {filteredSections.map((section) => (
                      <div key={section.id} className="p-6 border-b border-glass-200 last:border-b-0">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="text-forge-orange">{section.icon}</div>
                          <h3 className="text-sm font-semibold text-glass-400 uppercase tracking-wider">
                            {section.title}
                          </h3>
                        </div>

                        <div className="space-y-2">
                          {section.content.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => handleArticleClick(article)}
                              className="w-full text-left p-3 rounded-lg hover:bg-glass-200/50 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-white font-medium mb-1 group-hover:text-forge-orange transition-colors">
                                    {article.title}
                                  </h4>
                                  <p className="text-sm text-glass-400">
                                    {article.description}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-glass-400 group-hover:text-forge-orange transition-colors flex-shrink-0 mt-1" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {filteredSections.length === 0 && (
                      <div className="p-12 text-center">
                        <Search className="w-12 h-12 text-glass-400 mx-auto mb-4" />
                        <p className="text-glass-400">No articles found</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-glass-200">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Support</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
