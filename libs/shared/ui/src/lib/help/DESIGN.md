# Help System Design Patterns

## Visual Hierarchy

### Component Layering (z-index)
```
z-[100] - OnboardingTour (highest - blocks everything)
z-50    - HelpPanel, KeyboardShortcuts, FeatureHighlight
z-40    - Overlay/Backdrop
z-10    - HelpTooltip
```

## Color Palette

### Background Layers
```css
/* Deep void backgrounds */
bg-void-950  → #02040a (deepest)
bg-void-900  → #1a1c24 (panels)

/* Glass surfaces */
bg-glass-200/30 → rgba(glass, 0.3) with backdrop-blur
bg-glass-200/50 → rgba(glass, 0.5) for hover states
```

### Accent Colors
```css
/* Primary actions */
from-forge-orange to-forge-purple  → #f97316 to #8b5cf6

/* Feature categories */
forge-orange  → #f97316 (generation, actions)
forge-purple  → #8b5cf6 (quality, highlights)
forge-indigo  → #6366f1 (navigation, shortcuts)
```

### Text Colors
```css
text-white       → Headers, primary text
text-glass-300   → Body text, descriptions
text-glass-400   → Labels, secondary text
text-glass-500   → Disabled, tertiary text
```

## Glass-Morphism Pattern

### Standard Glass Card
```tsx
<div className="
  bg-void-900/95           // 95% opacity dark background
  backdrop-blur-xl         // Heavy blur effect
  border border-glass-200  // Subtle frosted border
  rounded-xl               // Rounded corners
  shadow-2xl               // Deep shadow
  shadow-black/50          // Black shadow at 50%
">
```

### Interactive Glass Card
```tsx
<div className="
  bg-glass-200/30
  hover:bg-glass-200/50
  transition-all
  backdrop-blur-xl
  border border-glass-200
  rounded-lg
">
```

## Animation Patterns

### Panel Slide-in (Right)
```tsx
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
>
```

### Modal Fade + Scale
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 20 }}
  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
>
```

### Tooltip Appear
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
```

### Pulsing Indicator
```tsx
<motion.div
  animate={{
    scale: [1, 1.3, 1],
    opacity: [1, 0.7, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
```

## Button Styles

### Primary Gradient Button
```tsx
<button className="
  flex items-center gap-2
  py-2 px-4
  bg-gradient-to-r from-forge-orange to-forge-purple
  text-white font-medium
  rounded-lg
  hover:shadow-lg hover:shadow-forge-orange/25
  transition-all
">
```

### Secondary Glass Button
```tsx
<button className="
  p-2
  rounded-lg
  hover:bg-glass-200/50
  transition-colors
  text-glass-400 hover:text-white
">
```

### Icon-only Button
```tsx
<button className="
  w-10 h-10
  rounded-lg
  bg-forge-orange/20
  flex items-center justify-center
  hover:bg-forge-orange/30
  transition-colors
">
  <Icon className="w-5 h-5 text-forge-orange" />
</button>
```

## Input Styles

### Search Input
```tsx
<input className="
  w-full pl-11 pr-4 py-3
  bg-glass-200/50
  border border-glass-300
  rounded-lg
  text-white placeholder-glass-400
  focus:outline-none
  focus:ring-2 focus:ring-forge-orange/50
  focus:border-forge-orange
  transition-all
" />
```

## Badge Styles

### Keyboard Key Badge
```tsx
<kbd className="
  px-2 py-1 min-w-[28px]
  bg-glass-200/50
  border border-glass-300
  rounded
  text-xs font-mono text-glass-300
  shadow-sm
">
  ⌘
</kbd>
```

### Status Badge
```tsx
<span className="
  px-2 py-0.5
  bg-forge-orange/20
  border border-forge-orange/30
  rounded-full
  text-forge-orange
  text-xs font-semibold
  uppercase tracking-wide
">
  New
</span>
```

## Icon Containers

### Gradient Icon Circle
```tsx
<div className="
  w-10 h-10
  rounded-lg
  bg-gradient-to-br from-forge-orange to-forge-purple
  flex items-center justify-center
">
  <Icon className="w-5 h-5 text-white" />
</div>
```

### Glass Icon Container
```tsx
<div className="
  w-8 h-8
  rounded-full
  bg-gradient-to-br from-forge-orange to-forge-purple
  flex items-center justify-center
  text-white text-sm font-bold
">
  1
</div>
```

## List Styles

### Article List Item
```tsx
<button className="
  w-full text-left
  p-3
  rounded-lg
  hover:bg-glass-200/50
  transition-all
  group
">
  <h4 className="
    text-white font-medium
    mb-1
    group-hover:text-forge-orange
    transition-colors
  ">
    Title
  </h4>
  <p className="text-sm text-glass-400">
    Description
  </p>
</button>
```

## Progress Indicators

### Dot Navigation
```tsx
<div className="flex items-center gap-1.5">
  {steps.map((_, index) => (
    <button
      className={`
        w-2 h-2 rounded-full transition-all
        ${index === current
          ? 'bg-forge-orange w-6'
          : index < current
          ? 'bg-forge-orange/50'
          : 'bg-glass-400'
        }
      `}
    />
  ))}
</div>
```

## Tooltip Arrow

### Dynamic Arrow Positioning
```tsx
const arrowClasses = {
  top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r',
  bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l',
  left: 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t',
  right: 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b',
};

<div className={`
  absolute w-2 h-2
  bg-void-800
  border-glass-200
  rotate-45
  ${arrowClasses[position]}
`} />
```

## Backdrop Patterns

### Modal Backdrop
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="
    fixed inset-0
    bg-black/50
    backdrop-blur-sm
    z-40
  "
/>
```

### Tour Spotlight
```tsx
<div
  className="
    absolute w-full h-full
    rounded-lg
    border-2 border-forge-orange
    shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]
    animate-pulse
  "
/>
```

## Markdown Styling

### Prose Container
```tsx
<div className="prose prose-invert prose-glass max-w-none">
  <ReactMarkdown
    components={{
      p: ({ children }) => (
        <p className="text-glass-300 text-sm leading-relaxed">
          {children}
        </p>
      ),
      strong: ({ children }) => (
        <strong className="text-white font-semibold">
          {children}
        </strong>
      ),
      code: ({ children }) => (
        <code className="
          px-1.5 py-0.5
          bg-glass-200/50
          rounded
          text-forge-orange
          text-xs font-mono
        ">
          {children}
        </code>
      ),
    }}
  />
</div>
```

## Responsive Patterns

### Mobile-Friendly Panel
```tsx
<div className="
  w-full sm:w-[480px]  // Full width mobile, 480px desktop
  fixed right-0 top-0
  h-full
">
```

### Adaptive Grid
```tsx
<div className="
  grid grid-cols-1 md:grid-cols-2
  gap-6
">
```

## Accessibility Patterns

### Focus States
```tsx
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-forge-orange/50
  focus:border-forge-orange
  rounded-lg
">
```

### Screen Reader Only
```tsx
<span className="sr-only">
  Help information
</span>
<HelpCircle aria-hidden="true" />
```

## Best Practices

### 1. Consistent Spacing
- Padding: `p-6` for panels, `p-4` for cards, `p-2` for small elements
- Gaps: `gap-6` for grids, `gap-3` for inline items, `gap-2` for tight groups
- Margins: `mb-4` for sections, `mb-2` for labels

### 2. Consistent Rounding
- Panels: `rounded-xl` (12px)
- Cards: `rounded-lg` (8px)
- Buttons: `rounded-lg` (8px)
- Badges: `rounded-full` (9999px)

### 3. Consistent Transitions
- Default: `transition-all`
- Colors only: `transition-colors`
- Duration: 150-300ms (handled by Tailwind defaults)

### 4. Consistent Shadows
- Panels: `shadow-2xl shadow-black/50`
- Cards: `shadow-lg`
- Buttons (hover): `hover:shadow-lg hover:shadow-forge-orange/25`

### 5. Consistent Blur
- Heavy blur (panels): `backdrop-blur-xl`
- Medium blur (tooltips): `backdrop-blur-lg`
- Light blur (overlays): `backdrop-blur-sm`

## Component-Specific Patterns

### HelpPanel
- Right-aligned slide-in
- Glass panel with heavy blur
- Searchable with instant filtering
- Hierarchical content sections

### HelpTooltip
- Auto-positioning with viewport detection
- Arrow pointing to trigger
- Rich content with markdown
- Compact and unobtrusive

### KeyboardShortcuts
- Centered modal
- Platform-aware key rendering
- Categorized shortcuts
- Searchable list

### OnboardingTour
- Spotlight highlighting
- Step-by-step navigation
- Progress indicator
- Overlay with backdrop

### FeatureHighlight
- Corner positioning
- Animated indicator
- Expandable badge → card
- Dismissible with tracking
