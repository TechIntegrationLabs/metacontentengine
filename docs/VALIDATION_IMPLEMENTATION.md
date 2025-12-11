# Pre-Publish Validation Implementation

## Overview

Comprehensive pre-publish validation system for the Meta Content Engine that checks content requirements, quality standards, SEO optimization, and compliance before allowing articles to be published.

## Implementation Summary

### Files Created

#### Types (`libs/shared/types/`)
- **src/lib/validation.ts** - Core validation type definitions
  - `ValidationCheck` - Individual check result
  - `ValidationResult` - Complete validation result
  - `ValidationConfig` - Configuration options
  - `DEFAULT_VALIDATION_CONFIG` - Default configuration preset

#### Service (`libs/core/quality/`)
- **src/lib/validation.ts** - Validation service implementation
  - `validateArticle()` - Main validation function
  - `validateContent()` - Content requirements checks
  - `validateQuality()` - Quality standards checks
  - `validateSEO()` - SEO optimization checks
  - `validateCompliance()` - Compliance checks
  - `getAutoFixableChecks()` - Get fixable issues
  - `getCategorySummary()` - Category-level summary

#### UI Components (`libs/shared/ui/src/lib/validation/`)
- **PrePublishChecklist.tsx** - Full validation checklist with expandable sections
- **ValidationCheckItem.tsx** - Individual check item with auto-fix button
- **ValidationSummaryBadge.tsx** - Compact summary badge component
- **ValidationDemo.tsx** - Example/demo implementation
- **index.ts** - Component exports

#### Documentation
- **libs/core/quality/VALIDATION.md** - Comprehensive usage documentation
- **docs/VALIDATION_IMPLEMENTATION.md** - This file

## Validation Categories

### 1. Content Requirements
Checks basic content structure and metadata:
- Minimum/maximum word count
- Title length (30-70 characters)
- Meta description (120-160 characters)
- Featured image presence

### 2. Quality Standards
Validates content quality metrics:
- Overall quality score threshold (≥70)
- AI detection score (≤30)
- No critical quality issues

### 3. SEO Optimization
Ensures search engine best practices:
- Focus keyword defined
- Keyword in title
- Keyword in first paragraph
- Valid heading structure (H1/H2)
- Internal links (2-10)
- External links (1-5)
- Image alt tags

### 4. Compliance
Validates content policies:
- No banned phrases
- No blocked domains
- Domain whitelist validation
- Content freshness checks

## Usage Examples

### Basic Validation

```typescript
import { validateArticle } from '@content-engine/quality';
import type { Article, QualityScore } from '@content-engine/types';

const result = validateArticle(article, qualityScore);

if (result.canPublish) {
  await publishArticle(article);
} else {
  console.log(`${result.blockers.length} blocking issues found`);
}
```

### UI Integration

```tsx
import { PrePublishChecklist } from '@content-engine/ui';

function ArticleEditor() {
  const [validationResult, setValidationResult] = useState<ValidationResult>();

  const handleValidate = () => {
    const result = validateArticle(article, qualityScore);
    setValidationResult(result);
  };

  return (
    <div>
      <button onClick={handleValidate}>Validate Article</button>

      {validationResult && (
        <PrePublishChecklist
          result={validationResult}
          onAutoFix={handleAutoFix}
          onRevalidate={handleValidate}
        />
      )}
    </div>
  );
}
```

### Custom Configuration

```typescript
import { DEFAULT_VALIDATION_CONFIG } from '@content-engine/types';

const customConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  minWordCount: 1500,
  minQualityScore: 80,
  bannedPhrases: ['click here', 'learn more'],
};

const result = validateArticle(article, qualityScore, customConfig);
```

## Auto-Fix Capabilities

The following checks support automatic fixing:

- **Meta Description** - Generate from excerpt or first paragraph
- **AI Detection** - Re-humanize content
- **Banned Phrases** - Replace with approved alternatives
- **Internal Links** - Suggest relevant internal links
- **Critical Issues** - Apply auto-fix suggestions from quality analysis

## UI Components

### PrePublishChecklist
Full validation interface with:
- Overall validation summary
- Category-grouped checks
- Expandable/collapsible sections
- Progress bars per category
- Auto-fix buttons for fixable checks
- Re-validation trigger

### ValidationSummaryBadge
Compact status badge showing:
- Can publish / Cannot publish status
- Pass/fail/warning counts
- Overall completion percentage
- Blocking issues list (when expanded)

### ValidationCheckItem
Individual check display with:
- Status icon (pass/fail/warning/skipped)
- Check name and description
- Result message
- Auto-fix button (when available)
- Blocking indicator

## Integration Points

### Article Editor
Add validation panel to article editor sidebar or pre-publish modal.

### Publishing Workflow
Gate publishing action behind validation:
```typescript
const handlePublish = async () => {
  const validation = validateArticle(article, qualityScore);

  if (!validation.canPublish) {
    showValidationModal(validation);
    return;
  }

  await publishArticle(article);
};
```

### Bulk Publishing
Validate multiple articles before batch publishing:
```typescript
const articlesToPublish = articles.filter(article => {
  const validation = validateArticle(article);
  return validation.canPublish;
});
```

## Configuration Presets

### Default (Blog Posts)
```typescript
minWordCount: 800
minQualityScore: 70
requireFeaturedImage: true
```

### Long-Form Content
```typescript
minWordCount: 2000
maxWordCount: 10000
minInternalLinks: 5
```

### News Articles
```typescript
minWordCount: 500
maxWordCount: 1500
maxContentAge: 7 days
```

### SEO-Focused
```typescript
minQualityScore: 80
requireKeywordInTitle: true
minInternalLinks: 3
```

## Future Enhancements

- [ ] Plagiarism detection integration
- [ ] Real-time validation during editing
- [ ] Custom validation rules via plugins
- [ ] A/B testing for thresholds
- [ ] Machine learning recommendations
- [ ] Validation history tracking
- [ ] Per-tenant configuration UI
- [ ] Validation webhooks/notifications

## Testing

### Unit Tests
Test individual validation functions:
```typescript
describe('validateContent', () => {
  it('should fail when word count is below minimum', () => {
    const article = createArticle({ wordCount: 500 });
    const result = validateArticle(article);

    expect(result.canPublish).toBe(false);
    expect(result.blockers).toContainEqual(
      expect.objectContaining({ id: 'content-word-count-min' })
    );
  });
});
```

### Integration Tests
Test full validation flow:
```typescript
it('should prevent publishing when validation fails', async () => {
  const article = createInvalidArticle();
  const result = validateArticle(article);

  expect(result.canPublish).toBe(false);
  expect(() => publishArticle(article)).toThrow();
});
```

## Performance Considerations

- Validation runs client-side (no API calls)
- All checks complete in <100ms for typical articles
- Results can be cached and revalidated on content change
- Auto-fix operations may trigger re-validation

## Accessibility

- All validation states have proper ARIA labels
- Keyboard navigation supported
- Screen reader friendly status announcements
- Color-blind safe status indicators (icons + colors)

## API Reference

### Functions

```typescript
// Validate article with optional config
validateArticle(
  article: Article,
  qualityScore?: QualityScore,
  config?: ValidationConfig
): ValidationResult

// Get checks that can be auto-fixed
getAutoFixableChecks(
  result: ValidationResult
): ValidationCheck[]

// Get per-category summary
getCategorySummary(
  result: ValidationResult
): CategorySummary[]
```

### Types

```typescript
ValidationCheck {
  id: string
  category: 'content' | 'quality' | 'seo' | 'compliance'
  name: string
  description: string
  status: 'pass' | 'fail' | 'warning' | 'skipped'
  message?: string
  autoFixAvailable?: boolean
  isBlocking?: boolean
}

ValidationResult {
  canPublish: boolean
  checks: ValidationCheck[]
  passCount: number
  failCount: number
  warningCount: number
  skippedCount: number
  blockers: ValidationCheck[]
  timestamp: string
}

ValidationConfig {
  // Content
  minWordCount: number
  maxWordCount?: number
  requireMetaDescription: boolean
  requireFeaturedImage: boolean

  // Quality
  minQualityScore: number
  maxAiDetectionScore: number

  // SEO
  requireFocusKeyword: boolean
  minInternalLinks: number

  // Compliance
  bannedPhrases: string[]
  blockedDomains?: string[]
  // ... see VALIDATION.md for full config
}
```

## Exports

```typescript
// From @content-engine/quality
export {
  validateArticle,
  getAutoFixableChecks,
  getCategorySummary,
}

// From @content-engine/types
export {
  ValidationCheck,
  ValidationResult,
  ValidationConfig,
  DEFAULT_VALIDATION_CONFIG,
}

// From @content-engine/ui
export {
  PrePublishChecklist,
  ValidationCheckItem,
  ValidationSummaryBadge,
  ValidationDemo,
}
```

---

**Implementation Date:** 2025-12-10
**Status:** ✅ Complete and Ready for Integration
