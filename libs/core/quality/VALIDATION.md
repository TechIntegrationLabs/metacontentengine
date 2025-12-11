# Pre-Publish Validation System

Comprehensive validation checks for articles before publishing to ensure content quality, SEO optimization, and compliance.

## Overview

The validation system performs four categories of checks:

1. **Content Requirements** - Basic content structure and metadata
2. **Quality Standards** - Quality score and AI detection thresholds
3. **SEO Optimization** - Search engine optimization best practices
4. **Compliance** - Content policy and domain restrictions

## Installation

The validation system is part of the `@content-engine/quality` library:

```typescript
import {
  validateArticle,
  getAutoFixableChecks,
  getCategorySummary,
} from '@content-engine/quality';

import type {
  ValidationCheck,
  ValidationResult,
  ValidationConfig,
  DEFAULT_VALIDATION_CONFIG,
} from '@content-engine/types';
```

## Usage

### Basic Validation

```typescript
import { validateArticle } from '@content-engine/quality';
import type { Article, QualityScore } from '@content-engine/types';

// Validate article with default configuration
const result = validateArticle(article, qualityScore);

if (result.canPublish) {
  console.log('Article is ready to publish!');
  await publishArticle(article);
} else {
  console.log(`${result.blockers.length} blocking issues found:`);
  result.blockers.forEach(blocker => {
    console.log(`- ${blocker.name}: ${blocker.message}`);
  });
}
```

### Custom Configuration

```typescript
import { validateArticle, DEFAULT_VALIDATION_CONFIG } from '@content-engine/quality';

const customConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  minWordCount: 1500,
  minQualityScore: 80,
  requireFeaturedImage: false,
  bannedPhrases: ['click here', 'learn more', 'as mentioned above'],
};

const result = validateArticle(article, qualityScore, customConfig);
```

### Auto-Fix Suggestions

```typescript
import { getAutoFixableChecks } from '@content-engine/quality';

const result = validateArticle(article, qualityScore);
const fixableChecks = getAutoFixableChecks(result);

console.log(`${fixableChecks.length} issues can be auto-fixed`);

fixableChecks.forEach(check => {
  if (check.id === 'compliance-banned-phrases') {
    // Apply auto-fix logic
    console.log(`Fixing: ${check.name}`);
  }
});
```

### Category Summary

```typescript
import { getCategorySummary } from '@content-engine/quality';

const result = validateArticle(article, qualityScore);
const summary = getCategorySummary(result);

summary.forEach(category => {
  console.log(`${category.category}: ${category.passed}/${category.total} (${category.percentage}%)`);
});
```

## Validation Categories

### 1. Content Requirements

Validates basic content structure and metadata:

| Check | Blocking | Auto-Fix | Description |
|-------|----------|----------|-------------|
| Minimum Word Count | Yes | No | Article meets minimum word count |
| Maximum Word Count | No | No | Article within recommended length |
| Title Length | Yes | No | Title between min/max characters |
| Meta Description | Yes | Yes | Meta description present and correct length |
| Featured Image | Yes | No | Article has featured image set |

**Configuration:**
```typescript
{
  minWordCount: 800,
  maxWordCount: 5000,
  minTitleLength: 30,
  maxTitleLength: 70,
  requireMetaDescription: true,
  minMetaDescriptionLength: 120,
  maxMetaDescriptionLength: 160,
  requireFeaturedImage: true,
}
```

### 2. Quality Standards

Validates content quality metrics:

| Check | Blocking | Auto-Fix | Description |
|-------|----------|----------|-------------|
| Quality Score | Yes | No | Overall quality above threshold |
| AI Detection | No | Yes | Content passes AI detection check |
| Critical Issues | Yes | Partial | No critical quality issues |

**Configuration:**
```typescript
{
  minQualityScore: 70,
  maxAiDetectionScore: 30,
  allowCriticalIssues: false,
}
```

### 3. SEO Optimization

Validates search engine optimization:

| Check | Blocking | Auto-Fix | Description |
|-------|----------|----------|-------------|
| Focus Keyword | Yes | No | Primary keyword defined |
| Keyword in Title | No | No | Keyword appears in title |
| Keyword in First Paragraph | No | No | Keyword in introduction |
| Heading Structure | No | No | Valid H1/H2 hierarchy |
| Internal Links | No | Yes | Appropriate internal linking |
| External Links | No | No | Outbound links present |
| Image Alt Tags | No | No | All images have alt text |

**Configuration:**
```typescript
{
  requireFocusKeyword: true,
  requireKeywordInTitle: true,
  requireKeywordInFirstParagraph: true,
  requireHeadingStructure: true,
  minInternalLinks: 2,
  maxInternalLinks: 10,
  minExternalLinks: 1,
  maxExternalLinks: 5,
  requireImageAltTags: true,
}
```

### 4. Compliance Checks

Validates content policies and restrictions:

| Check | Blocking | Auto-Fix | Description |
|-------|----------|----------|-------------|
| Banned Phrases | No | Yes | No banned phrases found |
| Blocked Domains | Yes | No | No links to blocked domains |
| Domain Whitelist | No | No | External links to allowed domains |
| Content Freshness | No | No | Content recently updated |

**Configuration:**
```typescript
{
  bannedPhrases: ['click here', 'read more here', 'as mentioned above'],
  allowedDomains: undefined, // ['example.com', 'trusted-site.com']
  blockedDomains: ['spam-site.com', 'low-quality.net'],
  maxContentAge: undefined, // Days since last update
}
```

## Validation Result Structure

```typescript
interface ValidationResult {
  canPublish: boolean;          // Overall pass/fail
  checks: ValidationCheck[];     // All validation checks
  passCount: number;             // Number of passed checks
  failCount: number;             // Number of failed checks
  warningCount: number;          // Number of warnings
  skippedCount: number;          // Number of skipped checks
  blockers: ValidationCheck[];   // Blocking issues (prevents publish)
  timestamp: string;             // ISO timestamp
}

interface ValidationCheck {
  id: string;                    // Unique check identifier
  category: ValidationCategory;  // 'content' | 'quality' | 'seo' | 'compliance'
  name: string;                  // Display name
  description: string;           // User-friendly description
  status: ValidationStatus;      // 'pass' | 'fail' | 'warning' | 'skipped'
  message?: string;              // Result message
  autoFixAvailable?: boolean;    // Can be automatically fixed
  isBlocking?: boolean;          // Prevents publishing if failed
}
```

## UI Components

The validation system includes pre-built React components:

### PrePublishChecklist

Full validation checklist with expandable sections:

```tsx
import { PrePublishChecklist } from '@content-engine/ui';

function ArticleEditor() {
  const [result, setResult] = useState<ValidationResult>();
  const [fixingCheckIds, setFixingCheckIds] = useState<string[]>([]);

  const handleAutoFix = async (checkId: string) => {
    setFixingCheckIds(prev => [...prev, checkId]);
    // Apply fix...
    await autoFixCheck(checkId);
    setFixingCheckIds(prev => prev.filter(id => id !== checkId));
  };

  return (
    <PrePublishChecklist
      result={result}
      onAutoFix={handleAutoFix}
      onRevalidate={() => setResult(validateArticle(article, qualityScore))}
      isValidating={false}
      fixingCheckIds={fixingCheckIds}
    />
  );
}
```

### ValidationSummaryBadge

Compact summary badge:

```tsx
import { ValidationSummaryBadge } from '@content-engine/ui';

<ValidationSummaryBadge
  result={validationResult}
  size="md"
  showDetails={true}
/>
```

### ValidationCheckItem

Individual check item with auto-fix button:

```tsx
import { ValidationCheckItem } from '@content-engine/ui';

<ValidationCheckItem
  check={check}
  onAutoFix={handleAutoFix}
  isFixing={isFixing}
/>
```

### ValidationDemo

Complete demo/example implementation:

```tsx
import { ValidationDemo } from '@content-engine/ui';

<ValidationDemo
  article={article}
  qualityScore={qualityScore}
  onPublish={handlePublish}
/>
```

## Integration Examples

### Article Editor Integration

```tsx
import { useState } from 'react';
import { validateArticle } from '@content-engine/quality';
import { PrePublishChecklist, ValidationSummaryBadge } from '@content-engine/ui';

function ArticlePublisher({ article, qualityScore }) {
  const [validation, setValidation] = useState(null);

  const handleValidate = () => {
    const result = validateArticle(article, qualityScore);
    setValidation(result);
  };

  const handlePublish = async () => {
    if (validation?.canPublish) {
      await publishToWordPress(article);
    }
  };

  return (
    <div>
      <h2>Publish Article</h2>

      {validation && <ValidationSummaryBadge result={validation} />}

      <button onClick={handleValidate}>Validate</button>
      <button
        onClick={handlePublish}
        disabled={!validation?.canPublish}
      >
        Publish
      </button>

      {validation && <PrePublishChecklist result={validation} />}
    </div>
  );
}
```

### Publishing Pipeline Integration

```tsx
import { validateArticle } from '@content-engine/quality';

async function publishingPipeline(article: Article, qualityScore?: QualityScore) {
  // Step 1: Validate
  const validation = validateArticle(article, qualityScore);

  if (!validation.canPublish) {
    throw new Error(
      `Cannot publish: ${validation.blockers.length} blocking issues`
    );
  }

  // Step 2: Auto-fix warnings (optional)
  const fixableChecks = getAutoFixableChecks(validation);
  for (const check of fixableChecks) {
    await applyAutoFix(article, check.id);
  }

  // Step 3: Publish
  await publishArticle(article);

  return { success: true, validation };
}
```

## Best Practices

1. **Validate Early**: Run validation during content creation, not just before publishing
2. **Custom Configs**: Adjust validation rules per tenant or content type
3. **Auto-Fix Carefully**: Review auto-fixes before applying to avoid unintended changes
4. **User Feedback**: Show clear, actionable messages for failed checks
5. **Progressive Enhancement**: Allow warnings to be overridden with user confirmation
6. **Audit Trail**: Log validation results for compliance and quality tracking

## Configuration Presets

### Blog Post (Default)
```typescript
const blogConfig = DEFAULT_VALIDATION_CONFIG;
```

### Long-Form Content
```typescript
const longFormConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  minWordCount: 2000,
  maxWordCount: 10000,
  minInternalLinks: 5,
};
```

### News Article
```typescript
const newsConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  minWordCount: 500,
  maxWordCount: 1500,
  maxContentAge: 7, // Must be updated within 7 days
};
```

### SEO-Focused
```typescript
const seoConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  requireKeywordInTitle: true,
  requireKeywordInFirstParagraph: true,
  minInternalLinks: 3,
  requireImageAltTags: true,
  minQualityScore: 80,
};
```

## Future Enhancements

- [ ] Plagiarism detection integration
- [ ] Readability score requirements
- [ ] Legal disclaimer validation
- [ ] Custom validation rules via plugins
- [ ] Real-time validation during editing
- [ ] A/B testing for validation thresholds
- [ ] Machine learning for optimal config recommendations
