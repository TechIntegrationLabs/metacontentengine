# Pre-Publish Validation UI Guide

## Component Overview

The validation system provides three main UI components for different use cases.

## 1. PrePublishChecklist

**Purpose:** Full-featured validation interface for article editors

**Features:**
- Expandable category sections (Content, Quality, SEO, Compliance)
- Progress bars per category
- Individual check items with status icons
- Auto-fix buttons for fixable issues
- Re-validation trigger
- Blocking issue highlights

**When to Use:**
- Article editor sidebar
- Pre-publish modal dialog
- Publishing workflow page

**Props:**
```typescript
interface PrePublishChecklistProps {
  result: ValidationResult;           // Validation result
  onAutoFix?: (checkId: string) => void;  // Auto-fix handler
  onRevalidate?: () => void;          // Re-validate handler
  isValidating?: boolean;             // Loading state
  fixingCheckIds?: string[];          // Currently fixing checks
  className?: string;
}
```

**Example:**
```tsx
<PrePublishChecklist
  result={validationResult}
  onAutoFix={handleAutoFix}
  onRevalidate={handleRevalidate}
  isValidating={false}
  fixingCheckIds={[]}
/>
```

**Visual Structure:**
```
┌─────────────────────────────────────────────────┐
│ 📋 Pre-Publish Validation          [Re-validate]│
├─────────────────────────────────────────────────┤
│ 🛡️ Cannot Publish                               │
│ 15 of 20 checks passed (75%)                    │
│                                                  │
│ ✅ Passed: 15  ❌ Failed: 3  ⚠️ Warnings: 2     │
│                                                  │
│ Blocking Issues:                                │
│ • Minimum Word Count                            │
│ • Meta Description                              │
│ • Focus Keyword                                 │
└─────────────────────────────────────────────────┘

┌─ 📄 Content Requirements ────────── 3/5 ────▼─┐
│ ════════════════════════ 60%                   │
│                                                 │
│ ❌ Minimum Word Count [BLOCKING]               │
│    Article must have at least 800 words        │
│    Only 650 words (need 150 more)              │
│                                                 │
│ ✅ Title Length                                 │
│    Title should be 30-70 characters            │
│    45 characters                                │
│                                                 │
│ ❌ Meta Description [BLOCKING]  [Auto-Fix]     │
│    Meta description required (120-160 chars)   │
│    Missing meta description                    │
└─────────────────────────────────────────────────┘

┌─ ✨ Quality Standards ──────────── 2/3 ────▼─┐
│ ══════════════════════ 67%                     │
│                                                 │
│ ✅ Quality Score                                │
│    Overall quality must be at least 70/100     │
│    Score: 75/100                                │
│                                                 │
│ ⚠️  AI Detection                [Auto-Fix]     │
│    Content should score below 30 on AI detect  │
│    AI detection: 35% (65% human-like)          │
└─────────────────────────────────────────────────┘
```

## 2. ValidationSummaryBadge

**Purpose:** Compact status indicator for quick validation overview

**Sizes:**
- `sm` - Small badge for tight spaces
- `md` - Medium badge (default)
- `lg` - Large badge for emphasis

**Display Modes:**
- Compact (icon + status text only)
- Detailed (includes counts and breakdown)

**When to Use:**
- Article list cards
- Status bars
- Toolbar indicators
- Dashboard widgets

**Props:**
```typescript
interface ValidationSummaryBadgeProps {
  result: ValidationResult;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}
```

**Example (Compact):**
```tsx
<ValidationSummaryBadge
  result={validationResult}
  size="sm"
  showDetails={false}
/>
```

**Visual (Compact):**
```
┌──────────────────────────┐
│ 🛡️ Cannot Publish        │
└──────────────────────────┘

┌──────────────────────────┐
│ ⚠️  Ready with Warnings  │
└──────────────────────────┘

┌──────────────────────────┐
│ ✅ Ready to Publish      │
└──────────────────────────┘
```

**Example (Detailed):**
```tsx
<ValidationSummaryBadge
  result={validationResult}
  size="md"
  showDetails={true}
/>
```

**Visual (Detailed):**
```
┌─────────────────────────────────────────┐
│ 🛡️ Cannot Publish                       │
│ 15 of 20 checks passed (75%)            │
├─────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │✅ 15 │ │❌ 3 │ │⚠️  2│ │○ 0 │       │
│ │Pass │ │Fail │ │Warn │ │Skip│       │
│ └─────┘ └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────────────┤
│ 3 blocking issue(s) must be resolved:   │
│ • Minimum Word Count                    │
│ • Meta Description                      │
│ • Focus Keyword                         │
└─────────────────────────────────────────┘
```

## 3. ValidationCheckItem

**Purpose:** Individual validation check display with auto-fix capability

**When to Use:**
- Custom validation UIs
- Validation detail pages
- Inline editor warnings

**Props:**
```typescript
interface ValidationCheckItemProps {
  check: ValidationCheck;
  onAutoFix?: (checkId: string) => void;
  isFixing?: boolean;
  className?: string;
}
```

**Example:**
```tsx
<ValidationCheckItem
  check={check}
  onAutoFix={handleAutoFix}
  isFixing={false}
/>
```

**Visual (Pass):**
```
┌──────────────────────────────────────────┐
│ ✅ Title Length                          │
│    Title should be 30-70 characters      │
│    45 characters                         │
└──────────────────────────────────────────┘
```

**Visual (Fail with Auto-Fix):**
```
┌──────────────────────────────────────────┐
│ ❌ Meta Description [BLOCKING]           │
│    Meta description required (120-160)   │
│    Missing meta description              │
│                            [⚡ Auto-Fix]  │
└──────────────────────────────────────────┘
```

**Visual (Warning):**
```
┌──────────────────────────────────────────┐
│ ⚠️  AI Detection                          │
│    Content should score below 30 on AI   │
│    AI detection: 35% (65% human-like)    │
│                            [⚡ Auto-Fix]  │
└──────────────────────────────────────────┘
```

## Status Icons & Colors

### Status Types
- **Pass** ✅ - Green (#22c55e)
- **Fail** ❌ - Red (#ef4444)
- **Warning** ⚠️ - Yellow (#eab308)
- **Skipped** ○ - Gray (#6b7280)

### Category Icons
- **Content** 📄 - FileText
- **Quality** ✨ - Sparkles
- **SEO** 🔍 - Search
- **Compliance** 🛡️ - Shield

## Color Scheme (Frosted Obsidian)

### Borders & Backgrounds
```
Pass:    border-green-500/20   bg-green-500/5
Fail:    border-red-500/20     bg-red-500/5
Warning: border-yellow-500/20  bg-yellow-500/5
Skipped: border-void-700/20    bg-void-900/20
```

### Text Colors
```
Pass:    text-green-400
Fail:    text-red-400
Warning: text-yellow-400
Skipped: text-void-500
```

## Layout Examples

### Article Editor Sidebar
```tsx
function ArticleEditor() {
  return (
    <div className="grid grid-cols-[1fr_400px]">
      <div>{/* Editor */}</div>

      <aside className="p-6 space-y-6">
        {/* Quick Status */}
        <ValidationSummaryBadge
          result={validation}
          showDetails={false}
        />

        {/* Full Checklist */}
        <PrePublishChecklist
          result={validation}
          onAutoFix={handleAutoFix}
        />
      </aside>
    </div>
  );
}
```

### Pre-Publish Modal
```tsx
function PublishModal({ article, onPublish, onCancel }) {
  const [validation, setValidation] = useState(null);

  return (
    <Modal>
      <h2>Publish Article</h2>

      {/* Summary */}
      <ValidationSummaryBadge
        result={validation}
        showDetails={true}
      />

      {/* Full Checklist */}
      <PrePublishChecklist
        result={validation}
        onAutoFix={handleAutoFix}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="forge"
          onClick={onPublish}
          disabled={!validation?.canPublish}
        >
          Publish
        </Button>
      </div>
    </Modal>
  );
}
```

### Article List Card
```tsx
function ArticleCard({ article }) {
  const validation = validateArticle(article);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3>{article.title}</h3>
        <ValidationSummaryBadge
          result={validation}
          size="sm"
        />
      </div>

      <p>{article.excerpt}</p>
    </div>
  );
}
```

## Responsive Behavior

### Desktop (1024px+)
- Full checklist with all sections visible
- Side-by-side category layout
- Expanded details by default

### Tablet (768px - 1024px)
- Stacked category sections
- Collapsed details by default
- Compact summary badge

### Mobile (<768px)
- Single column layout
- Compact check items
- Small summary badge
- Touch-friendly auto-fix buttons

## Accessibility Features

### Keyboard Navigation
- `Tab` - Navigate between checks and buttons
- `Enter/Space` - Expand/collapse categories
- `Enter/Space` - Trigger auto-fix

### Screen Reader Support
- Status announcements on validation
- Check descriptions read aloud
- Auto-fix confirmation feedback
- Progress updates during fixing

### Visual Indicators
- Icons + colors for status (not color-only)
- Clear focus states
- High contrast mode support
- Reduced motion support

## Animation & Interactions

### Entrance
- Fade in from top (200ms)
- Staggered check items (50ms delay)

### Expand/Collapse
- Smooth height transition (300ms)
- Rotate chevron icon (200ms)

### Auto-Fix
- Button shows loading spinner
- Check item updates on completion
- Success confirmation (500ms)

### Progress Bars
- Animated width transition (500ms ease-out)
- Color changes on threshold crossings

## Best Practices

### Do:
✅ Show validation early in the workflow
✅ Provide clear, actionable messages
✅ Group related checks by category
✅ Offer auto-fix when possible
✅ Allow re-validation after changes
✅ Highlight blocking issues prominently

### Don't:
❌ Block user from seeing validation results
❌ Use technical jargon in messages
❌ Auto-fix without user consent
❌ Hide validation status in article lists
❌ Force validation on every keystroke
❌ Show all checks expanded by default

## Integration Checklist

- [ ] Add validation to article editor
- [ ] Show status badge in article lists
- [ ] Create pre-publish modal
- [ ] Implement auto-fix handlers
- [ ] Configure validation rules per tenant
- [ ] Add validation to publishing API
- [ ] Track validation history
- [ ] Set up monitoring for common failures

---

**Last Updated:** 2025-12-10
