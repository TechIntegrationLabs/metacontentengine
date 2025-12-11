# Help System UI Components

A comprehensive help system for the Meta Content Engine with contextual documentation, tooltips, keyboard shortcuts, onboarding tours, and feature highlights.

## Components

### HelpPanel

A slide-out panel for browsing help articles and documentation.

```tsx
import { HelpPanel } from '@content-engine/ui';

function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsHelpOpen(true)}>Help</button>

      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        context="content-forge" // Shows contextual help for current page
        supportEmail="support@perdia.ai"
      />
    </>
  );
}
```

**Features:**
- Contextual help based on current page
- Full-text search across all articles
- Categorized sections (Getting Started, Features, FAQ)
- Video tutorial placeholders
- Direct support contact link

### HelpTooltip

Inline contextual help with markdown support.

```tsx
import { HelpTooltip } from '@content-engine/ui';

function FeatureTitle() {
  return (
    <div className="flex items-center gap-2">
      <h2>Content Forge</h2>
      <HelpTooltip
        title="About Content Forge"
        content="Generate AI-powered content with **contributor personas** for authentic voice matching."
        learnMoreUrl="/docs/content-forge"
        position="bottom"
        trigger="hover" // or "click"
      />
    </div>
  );
}
```

**Features:**
- Markdown content support
- Configurable positioning (top, bottom, left, right)
- Hover or click triggers
- Learn more links
- Auto-adjusts position to stay in viewport

### KeyboardShortcuts

Modal displaying all keyboard shortcuts with search.

```tsx
import { KeyboardShortcuts } from '@content-engine/ui';

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts = [
    {
      id: 'save',
      keys: ['Cmd', 'S'],
      description: 'Save article',
      category: 'Editor',
      action: () => console.log('Save triggered'),
    },
    // ... more shortcuts
  ];

  return (
    <KeyboardShortcuts
      isOpen={showShortcuts}
      onClose={() => setShowShortcuts(false)}
      shortcuts={shortcuts}
      onShortcutTrigger={(id) => console.log('Triggered:', id)}
    />
  );
}
```

**Features:**
- Press `?` to toggle modal
- Platform-aware (Cmd on Mac, Ctrl on Windows/Linux)
- Search/filter shortcuts
- Grouped by category
- Active shortcut listening when modal is open

### OnboardingTour

Interactive step-by-step tour for first-time users.

```tsx
import { OnboardingTour } from '@content-engine/ui';

function App() {
  const [showTour, setShowTour] = useState(true);

  const tourSteps = [
    {
      id: 'welcome',
      target: '#dashboard',
      title: 'Welcome to Perdia!',
      content: 'Let\'s take a quick tour of the platform.',
      placement: 'center',
    },
    {
      id: 'content-forge',
      target: '#content-forge-link',
      title: 'Content Forge',
      content: 'Generate AI content here with contributor personas.',
      placement: 'bottom',
      highlightElement: true,
      action: {
        label: 'Try it now',
        onClick: () => navigate('/content-forge'),
      },
    },
    // ... more steps
  ];

  return (
    <OnboardingTour
      steps={tourSteps}
      isActive={showTour}
      onComplete={() => setShowTour(false)}
      onSkip={() => setShowTour(false)}
      storageKey="onboarding-completed" // Prevents showing again
      showProgress
      allowSkip
    />
  );
}
```

**Features:**
- Spotlight highlighting of target elements
- Step-by-step navigation
- Progress indicator
- Optional action buttons per step
- LocalStorage persistence
- Skip/complete tracking

### FeatureHighlight

Callout for new features with dismissible badge.

```tsx
import { FeatureHighlight } from '@content-engine/ui';

function Page() {
  return (
    <FeatureHighlight
      featureId="quality-analysis"
      title="Quality Analysis"
      description="We've added automated quality scoring for all your content!"
      badgeText="New Feature"
      position="bottom-right"
      showIndicator
      actionLabel="Try it now"
      onAction={() => navigate('/quality')}
      onDismiss={() => console.log('Dismissed')}
      autoShow
      delayMs={1000}
    />
  );
}
```

**Features:**
- Animated pulsing indicator
- Compact badge that expands on click
- Configurable positioning
- Auto-show with delay
- LocalStorage for dismiss tracking
- Optional action button

### useFeatureHighlights Hook

Manage multiple feature highlights programmatically.

```tsx
import { useFeatureHighlights, FeatureHighlight } from '@content-engine/ui';

function App() {
  const { showFeature, hideFeature, isFeatureActive } = useFeatureHighlights();

  useEffect(() => {
    // Show feature after user completes action
    if (userCompletedSetup) {
      showFeature('quality-analysis');
    }
  }, [userCompletedSetup]);

  return (
    <>
      {isFeatureActive('quality-analysis') && (
        <FeatureHighlight
          featureId="quality-analysis"
          title="Quality Analysis"
          description="Check it out!"
          onDismiss={() => hideFeature('quality-analysis')}
        />
      )}
    </>
  );
}
```

## Integration Example

Complete example showing all components working together:

```tsx
import { useState } from 'react';
import {
  HelpPanel,
  HelpTooltip,
  KeyboardShortcuts,
  OnboardingTour,
  FeatureHighlight,
  useFeatureHighlights,
} from '@content-engine/ui';

function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTour, setShowTour] = useState(!localStorage.getItem('tour-completed'));
  const { showFeature, hideFeature, isFeatureActive } = useFeatureHighlights();

  // Keyboard shortcut to open help (?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' && e.ctrlKey) {
        setIsHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tourSteps = [
    {
      id: 'dashboard',
      target: '#dashboard',
      title: 'Dashboard',
      content: 'Your content analytics at a glance',
      placement: 'center' as const,
    },
    // ... more steps
  ];

  const shortcuts = [
    {
      id: 'help',
      keys: ['Ctrl', 'H'],
      description: 'Open help panel',
      category: 'Navigation',
    },
    // ... more shortcuts
  ];

  return (
    <div className="app">
      {/* Main content with inline help */}
      <header className="flex items-center gap-2">
        <h1>Content Forge</h1>
        <HelpTooltip
          content="Generate **AI-powered content** with contributor personas"
          learnMoreUrl="/docs/content-forge"
        />
      </header>

      {/* Help Panel */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        context="content-forge"
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        steps={tourSteps}
        isActive={showTour}
        onComplete={() => setShowTour(false)}
        onSkip={() => setShowTour(false)}
      />

      {/* Feature Highlight */}
      {isFeatureActive('new-quality-feature') && (
        <FeatureHighlight
          featureId="new-quality-feature"
          title="Quality Analysis"
          description="Automated content quality scoring is here!"
          actionLabel="Try it"
          onAction={() => navigate('/quality')}
          onDismiss={() => hideFeature('new-quality-feature')}
        />
      )}
    </div>
  );
}
```

## Styling

All components use the Kinetic Modernism design system:

- **Glass morphism** panels with backdrop blur
- **Void/forge** color scheme (dark backgrounds with orange/purple accents)
- **Smooth animations** with Framer Motion
- **Accessible** focus states
- **Mobile-friendly** responsive layouts

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Focus trap in modals
- Screen reader announcements
- High contrast mode compatible

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- React 19+
- Requires Framer Motion, Lucide React, React Markdown

## LocalStorage Keys

Components use localStorage for persistence:

- **OnboardingTour**: `onboarding-tour-completed` (or custom via `storageKey` prop)
- **FeatureHighlight**: `feature-highlight-dismissed-{featureId}` (or custom via `storageKey` prop)
- **KeyboardShortcuts**: No persistence (modal state only)

## Best Practices

1. **Contextual Help**: Always provide `context` prop to HelpPanel based on current page
2. **Keyboard Shortcuts**: Document all shortcuts in KeyboardShortcuts modal
3. **Onboarding**: Keep tours short (3-5 steps max)
4. **Feature Highlights**: Use sparingly for truly new features
5. **Tooltips**: Keep content concise, use markdown for emphasis
6. **Accessibility**: Always provide meaningful labels and descriptions

## TypeScript Support

All components are fully typed with exported interfaces:

```typescript
import type {
  HelpPanelProps,
  HelpTooltipProps,
  KeyboardShortcutsProps,
  OnboardingTourProps,
  FeatureHighlightProps,
  HelpArticle,
  HelpSection,
  TourStep,
  KeyboardShortcut,
} from '@content-engine/ui';
```
