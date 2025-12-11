import { useState } from 'react';
import { HelpCircle, Sparkles, Keyboard, BookOpen, Compass } from 'lucide-react';
import { HelpPanel } from './HelpPanel';
import { HelpTooltip } from './HelpTooltip';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { OnboardingTour } from './OnboardingTour';
import { FeatureHighlight, useFeatureHighlights } from './FeatureHighlight';

/**
 * Demo component showcasing all Help System components
 * Use this for testing and as a reference implementation
 */
export function HelpSystemDemo() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { showFeature, hideFeature, isFeatureActive } = useFeatureHighlights();

  const tourSteps = [
    {
      id: 'welcome',
      target: '#demo-container',
      title: 'Welcome to the Help System!',
      content: 'This interactive tour will show you all the help features available.',
      placement: 'center' as const,
    },
    {
      id: 'help-panel',
      target: '#help-panel-btn',
      title: 'Help Panel',
      content: 'Click here to open the comprehensive help documentation.',
      placement: 'bottom' as const,
      highlightElement: true,
    },
    {
      id: 'tooltips',
      target: '#tooltip-demo',
      title: 'Inline Tooltips',
      content: 'Hover over the help icon for contextual information.',
      placement: 'bottom' as const,
      highlightElement: true,
    },
    {
      id: 'shortcuts',
      target: '#shortcuts-btn',
      title: 'Keyboard Shortcuts',
      content: 'View all keyboard shortcuts by pressing "?" or clicking here.',
      placement: 'bottom' as const,
      highlightElement: true,
    },
  ];

  const shortcuts = [
    {
      id: 'help',
      keys: ['?'],
      description: 'Open keyboard shortcuts',
      category: 'Help',
    },
    {
      id: 'search',
      keys: ['Cmd', 'K'],
      description: 'Search help articles',
      category: 'Navigation',
    },
    {
      id: 'tour',
      keys: ['Cmd', 'Shift', 'T'],
      description: 'Start onboarding tour',
      category: 'Help',
    },
  ];

  return (
    <div id="demo-container" className="min-h-screen bg-void-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-forge-orange to-forge-purple flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">Help System Demo</h1>
          <p className="text-glass-400 text-lg">
            Interactive demonstration of all help components
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Help Panel Card */}
          <div
            id="help-panel-btn"
            className="bg-glass-200/30 backdrop-blur-xl border border-glass-200 rounded-xl p-6 space-y-4 hover:bg-glass-200/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forge-orange/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-forge-orange" />
              </div>
              <h3 className="text-xl font-bold text-white">Help Panel</h3>
            </div>
            <p className="text-glass-300">
              Comprehensive slide-out panel with searchable help articles, FAQs, and
              support contact.
            </p>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="w-full py-2 px-4 bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
            >
              Open Help Panel
            </button>
          </div>

          {/* Tooltips Card */}
          <div
            id="tooltip-demo"
            className="bg-glass-200/30 backdrop-blur-xl border border-glass-200 rounded-xl p-6 space-y-4 hover:bg-glass-200/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forge-purple/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-forge-purple" />
              </div>
              <h3 className="text-xl font-bold text-white">Help Tooltips</h3>
            </div>
            <p className="text-glass-300">
              Inline contextual help with markdown support and learn more links.
            </p>
            <div className="flex items-center gap-2 p-4 bg-glass-200/20 rounded-lg">
              <span className="text-white">Hover for help</span>
              <HelpTooltip
                title="Inline Help Demo"
                content="This tooltip supports **markdown** formatting and can include `code` snippets!"
                learnMoreUrl="#"
                learnMoreText="View documentation"
                position="top"
                trigger="hover"
              />
            </div>
          </div>

          {/* Keyboard Shortcuts Card */}
          <div
            id="shortcuts-btn"
            className="bg-glass-200/30 backdrop-blur-xl border border-glass-200 rounded-xl p-6 space-y-4 hover:bg-glass-200/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forge-indigo/20 flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-forge-indigo" />
              </div>
              <h3 className="text-xl font-bold text-white">Keyboard Shortcuts</h3>
            </div>
            <p className="text-glass-300">
              Searchable modal showing all keyboard shortcuts, grouped by category.
            </p>
            <button
              onClick={() => setShowShortcuts(true)}
              className="w-full py-2 px-4 bg-gradient-to-r from-forge-indigo to-forge-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-indigo/25 transition-all"
            >
              View Shortcuts (or press ?)
            </button>
          </div>

          {/* Onboarding Tour Card */}
          <div className="bg-glass-200/30 backdrop-blur-xl border border-glass-200 rounded-xl p-6 space-y-4 hover:bg-glass-200/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forge-orange/20 flex items-center justify-center">
                <Compass className="w-5 h-5 text-forge-orange" />
              </div>
              <h3 className="text-xl font-bold text-white">Onboarding Tour</h3>
            </div>
            <p className="text-glass-300">
              Step-by-step interactive tour with element highlighting and progress
              tracking.
            </p>
            <button
              onClick={() => setShowTour(true)}
              className="w-full py-2 px-4 bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
            >
              Start Tour
            </button>
          </div>

          {/* Feature Highlight Card */}
          <div className="bg-glass-200/30 backdrop-blur-xl border border-glass-200 rounded-xl p-6 space-y-4 hover:bg-glass-200/40 transition-all md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-forge-purple/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-forge-purple" />
              </div>
              <h3 className="text-xl font-bold text-white">Feature Highlights</h3>
            </div>
            <p className="text-glass-300">
              Animated callouts for new features with pulsing indicators and dismissible
              badges.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => showFeature('demo-feature-1')}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-forge-purple to-forge-indigo text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-purple/25 transition-all"
              >
                Show Feature (Top Right)
              </button>
              <button
                onClick={() => showFeature('demo-feature-2')}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
              >
                Show Feature (Bottom Left)
              </button>
            </div>
          </div>
        </div>

        {/* Implementation Note */}
        <div className="bg-glass-200/20 border border-glass-200 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forge-orange animate-pulse" />
            Implementation Note
          </h4>
          <p className="text-glass-300 text-sm">
            All components use LocalStorage to persist user preferences (e.g., dismissed
            features, completed tours). Check the browser console for state changes and
            interactions.
          </p>
        </div>
      </div>

      {/* Help System Components */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        context="demo"
      />

      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />

      <OnboardingTour
        steps={tourSteps}
        isActive={showTour}
        onComplete={() => setShowTour(false)}
        onSkip={() => setShowTour(false)}
        storageKey="help-demo-tour-completed"
      />

      {isFeatureActive('demo-feature-1') && (
        <FeatureHighlight
          featureId="demo-feature-1"
          title="New Feature Demo"
          description="This is a new feature highlight positioned at the top-right of the screen!"
          badgeText="New"
          position="top-right"
          showIndicator
          actionLabel="Check it out"
          onAction={() => alert('Feature action triggered!')}
          onDismiss={() => hideFeature('demo-feature-1')}
          autoShow={false}
        />
      )}

      {isFeatureActive('demo-feature-2') && (
        <FeatureHighlight
          featureId="demo-feature-2"
          title="Another Feature"
          description="This feature highlight appears at the bottom-left with a different style!"
          badgeText="What's New"
          position="bottom-left"
          showIndicator
          onDismiss={() => hideFeature('demo-feature-2')}
          autoShow={false}
        />
      )}
    </div>
  );
}
