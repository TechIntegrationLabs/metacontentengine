/**
 * EditorSidebarExample
 *
 * Example implementation showing how to integrate the EditorSidebar
 * into an article editor component.
 *
 * This is a reference implementation - copy and adapt for your use case.
 */

import { useState } from 'react';
import { EditorSidebar, EditorSidebarTab } from './EditorSidebar';

export function EditorSidebarExample() {
  // Editor state
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<EditorSidebarTab>('overview');

  // Computed values
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const characterCount = content.length;

  // Sample data for demo
  const sampleKeywords = ['content engine', 'AI writing', 'meta content'];
  const sampleLinkSuggestions = [
    { title: 'Getting Started Guide', url: '/getting-started', relevance: 0.92 },
    { title: 'Content Strategy Tips', url: '/content-strategy', relevance: 0.85 },
    { title: 'SEO Best Practices', url: '/seo-guide', relevance: 0.78 },
  ];
  const sampleMedia = [
    { id: '1', url: 'https://via.placeholder.com/300', alt: 'Sample image', size: 150000 },
    { id: '2', url: 'https://via.placeholder.com/300', alt: 'Another image', size: 200000 },
  ];
  const sampleRevisions = [
    { id: '1', timestamp: new Date('2025-12-10T10:00:00'), author: 'John Doe', changes: 'Updated introduction' },
    { id: '2', timestamp: new Date('2025-12-10T09:30:00'), author: 'Jane Smith', changes: 'Fixed typos' },
    { id: '3', timestamp: new Date('2025-12-10T09:00:00'), author: 'John Doe', changes: 'Initial draft' },
  ];

  return (
    <div className="flex h-screen bg-void-950">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Header */}
        <div className="p-6 border-b border-white/10">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-white placeholder-slate-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Meta description..."
            className="w-full mt-2 text-sm bg-transparent border-none outline-none text-slate-400 placeholder-slate-600"
          />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your article..."
            className="w-full h-full min-h-[500px] bg-transparent border-none outline-none text-white placeholder-slate-500 resize-none font-display"
            style={{ fontSize: '16px', lineHeight: '1.75' }}
          />
        </div>
      </div>

      {/* Editor Sidebar */}
      <EditorSidebar
        defaultOpen={true}
        defaultTab="overview"
        wordCount={wordCount}
        characterCount={characterCount}
        title={title}
        description={description}
        url="example.com/articles/your-article-slug"
        keywords={sampleKeywords}
        content={content}
        targetWordMin={800}
        targetWordMax={1200}
        linkSuggestions={sampleLinkSuggestions}
        media={sampleMedia}
        revisions={sampleRevisions}
        onTabChange={(tab) => {
          setActiveTab(tab);
          console.log('Tab changed to:', tab);
        }}
      />
    </div>
  );
}

export default EditorSidebarExample;
