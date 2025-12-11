# Editor Sidebar Components

Collapsible sidebar UI components for the Meta Content Engine article editor with contextual tools.

## Components

### `EditorSidebar`
Main sidebar container with tabbed interface supporting multiple tools.

**Features:**
- 5 tabs: Overview, SEO, Links, Media, History
- Smooth collapse/expand animations
- Mobile-responsive (bottom sheet on mobile, side panel on desktop)
- Tab state persistence via localStorage
- Fully customizable with props

**Usage:**
```tsx
import { EditorSidebar } from '@content-engine/ui';

<EditorSidebar
  wordCount={1250}
  characterCount={7500}
  title="How to Build a Modern Web App"
  description="Learn the latest techniques for building scalable web applications"
  url="example.com/how-to-build-modern-web-app"
  keywords={['web development', 'react', 'typescript']}
  content={articleContent}
  targetWordMin={800}
  targetWordMax={1200}
  linkSuggestions={[
    { title: 'Getting Started with React', url: '/react-guide', relevance: 0.85 }
  ]}
  onTabChange={(tab) => console.log('Active tab:', tab)}
/>
```

### `EditorPanel`
Generic collapsible panel wrapper for sidebar content sections.

**Features:**
- Collapsible header with smooth animations
- Scrollable content area with custom scrollbar
- Action buttons support
- Loading state indicator
- Icon support

**Usage:**
```tsx
import { EditorPanel } from '@content-engine/ui';
import { Search } from 'lucide-react';

<EditorPanel
  title="SEO Analysis"
  icon={<Search className="w-4 h-4" />}
  defaultCollapsed={false}
  isLoading={false}
  actions={<button>Refresh</button>}
>
  <p>Panel content goes here</p>
</EditorPanel>
```

### `WordCountWidget`
Displays word count statistics with visual indicators.

**Features:**
- Current word count with formatting
- Target range progress bar
- Reading time estimate (225 WPM)
- Character count
- Color-coded status (below/on/above target)

**Usage:**
```tsx
import { WordCountWidget } from '@content-engine/ui';

<WordCountWidget
  wordCount={1250}
  characterCount={7500}
  targetMin={800}
  targetMax={1200}
/>
```

### `SeoPreviewWidget`
Google search preview and SEO analysis widget.

**Features:**
- Google SERP preview
- Meta title/description length indicators
- Keyword density analysis
- Color-coded validation (good/warning/error)
- Real-time character counting

**Usage:**
```tsx
import { SeoPreviewWidget } from '@content-engine/ui';

<SeoPreviewWidget
  title="How to Build a Modern Web App"
  description="Learn the latest techniques for building scalable web applications with React, TypeScript, and more."
  url="example.com/how-to-build-modern-web-app"
  keywords={['web development', 'react', 'typescript']}
  content={articleContent}
/>
```

## Design System

### Colors
- Uses `void` (dark backgrounds) and `forge` (accent colors) from Kinetic Modernism design system
- Glass-morphism with `glass-card` class
- Orange/indigo accent gradient for primary actions

### Typography
- Manrope for headings
- Space Grotesk for body text
- JetBrains Mono for code/metrics

### Icons
- Lucide React icon library
- Consistent 4px (w-4 h-4) sizing for panel icons
- Color-coded by status

### Animations
- Framer Motion for smooth transitions
- `spring` animation for sidebar slide
- `ease-in-out` for collapsible panels
- Duration: 200ms for quick interactions

## Mobile Responsiveness

**Desktop (lg+):**
- Side panel (384px width)
- Vertical tab navigation
- Fixed right side of editor

**Mobile (<lg):**
- Bottom sheet (max 70vh height)
- Horizontal scrollable tabs
- Drag handle for easy dismissal
- Floating toggle button when closed

## State Persistence

The sidebar automatically persists its state to `localStorage`:
- `isOpen`: Whether sidebar is expanded/collapsed
- `activeTab`: Currently selected tab

Storage key: `editor-sidebar-state`

## Custom Scrollbar

Uses `custom-scrollbar` class for styled scrollbars in overflow areas:
- Thin, minimal design
- Matches glass-morphism aesthetic
- Auto-hides when not hovering (on supported browsers)

## Tab Content

Each tab renders different content:

1. **Overview** - Word count widget + quality preview panel
2. **SEO** - SEO preview widget with Google SERP preview
3. **Links** - Internal link suggestions list
4. **Media** - Grid of attached images
5. **History** - Revision history timeline

## Example Integration

```tsx
import { useState } from 'react';
import { EditorSidebar } from '@content-engine/ui';

function ArticleEditor() {
  const [content, setContent] = useState('');

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const characterCount = content.length;

  return (
    <div className="flex h-screen">
      {/* Editor content */}
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-8"
        />
      </div>

      {/* Sidebar */}
      <EditorSidebar
        wordCount={wordCount}
        characterCount={characterCount}
        title="Article Title"
        description="Meta description"
        url="example.com/article"
        keywords={['keyword1', 'keyword2']}
        content={content}
      />
    </div>
  );
}
```

## Future Enhancements

Planned features for future versions:
- AI-powered content suggestions
- Real-time collaboration indicators
- Grammar and readability analysis
- Image optimization suggestions
- Broken link checker
- Schema markup validator
- Social media preview cards
