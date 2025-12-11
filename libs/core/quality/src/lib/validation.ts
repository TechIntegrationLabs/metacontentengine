/**
 * Pre-Publish Validation Service
 *
 * Performs comprehensive checks before allowing article publication
 */

import type {
  Article,
  ValidationCheck,
  ValidationResult,
  ValidationConfig,
} from '@content-engine/types';
import { DEFAULT_VALIDATION_CONFIG } from '@content-engine/types';
import type { QualityScore } from './types';

interface ValidationContext {
  article: Article;
  qualityScore?: QualityScore;
  config: ValidationConfig;
}

/**
 * Validate article before publishing
 */
export function validateArticle(
  article: Article,
  qualityScore?: QualityScore,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const checks: ValidationCheck[] = [];

  // Run all validation checks
  checks.push(...validateContent(article, config));
  checks.push(...validateQuality(article, qualityScore, config));
  checks.push(...validateSEO(article, config));
  checks.push(...validateCompliance(article, config));

  // Calculate summary
  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const skippedCount = checks.filter(c => c.status === 'skipped').length;
  const blockers = checks.filter(c => c.status === 'fail' && c.isBlocking);

  const canPublish = blockers.length === 0;

  return {
    canPublish,
    checks,
    passCount,
    failCount,
    warningCount,
    skippedCount,
    blockers,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Content validation checks
 */
function validateContent(article: Article, config: ValidationConfig): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Word count
  checks.push({
    id: 'content-word-count-min',
    category: 'content',
    name: 'Minimum Word Count',
    description: `Article must have at least ${config.minWordCount} words`,
    status: article.wordCount >= config.minWordCount ? 'pass' : 'fail',
    message: article.wordCount >= config.minWordCount
      ? `${article.wordCount} words`
      : `Only ${article.wordCount} words (need ${config.minWordCount - article.wordCount} more)`,
    autoFixAvailable: false,
    isBlocking: true,
  });

  if (config.maxWordCount) {
    checks.push({
      id: 'content-word-count-max',
      category: 'content',
      name: 'Maximum Word Count',
      description: `Article should not exceed ${config.maxWordCount} words`,
      status: article.wordCount <= config.maxWordCount ? 'pass' : 'warning',
      message: article.wordCount <= config.maxWordCount
        ? `${article.wordCount} words`
        : `${article.wordCount} words (${article.wordCount - config.maxWordCount} over limit)`,
      autoFixAvailable: false,
      isBlocking: false,
    });
  }

  // Title length
  const titleLength = article.title.length;
  const titleStatus =
    titleLength < config.minTitleLength ? 'fail' :
    titleLength > config.maxTitleLength ? 'warning' : 'pass';

  checks.push({
    id: 'content-title-length',
    category: 'content',
    name: 'Title Length',
    description: `Title should be ${config.minTitleLength}-${config.maxTitleLength} characters`,
    status: titleStatus,
    message: `${titleLength} characters`,
    autoFixAvailable: false,
    isBlocking: titleLength < config.minTitleLength,
  });

  // Meta description
  const metaDesc = article.seo.metaDescription || '';
  const metaDescLength = metaDesc.length;

  if (config.requireMetaDescription) {
    checks.push({
      id: 'content-meta-description',
      category: 'content',
      name: 'Meta Description',
      description: `Meta description required (${config.minMetaDescriptionLength}-${config.maxMetaDescriptionLength} characters)`,
      status: !metaDesc
        ? 'fail'
        : metaDescLength < config.minMetaDescriptionLength || metaDescLength > config.maxMetaDescriptionLength
        ? 'warning'
        : 'pass',
      message: !metaDesc
        ? 'Missing meta description'
        : `${metaDescLength} characters`,
      autoFixAvailable: !metaDesc,
      isBlocking: !metaDesc,
    });
  }

  // Featured image
  if (config.requireFeaturedImage) {
    checks.push({
      id: 'content-featured-image',
      category: 'content',
      name: 'Featured Image',
      description: 'Article must have a featured image',
      status: article.featuredImageUrl ? 'pass' : 'fail',
      message: article.featuredImageUrl ? 'Image set' : 'No featured image',
      autoFixAvailable: false,
      isBlocking: true,
    });
  }

  return checks;
}

/**
 * Quality validation checks
 */
function validateQuality(
  article: Article,
  qualityScore: QualityScore | undefined,
  config: ValidationConfig
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  if (!qualityScore) {
    checks.push({
      id: 'quality-score-missing',
      category: 'quality',
      name: 'Quality Analysis',
      description: 'Quality analysis not performed',
      status: 'warning',
      message: 'Run quality analysis before publishing',
      autoFixAvailable: false,
      isBlocking: true,
    });
    return checks;
  }

  // Overall quality score
  checks.push({
    id: 'quality-score-threshold',
    category: 'quality',
    name: 'Quality Score',
    description: `Overall quality must be at least ${config.minQualityScore}/100`,
    status: qualityScore.overall >= config.minQualityScore ? 'pass' : 'fail',
    message: `Score: ${qualityScore.overall}/100`,
    autoFixAvailable: false,
    isBlocking: true,
  });

  // AI detection score (humanness)
  if (article.humanScore !== undefined) {
    checks.push({
      id: 'quality-ai-detection',
      category: 'quality',
      name: 'AI Detection',
      description: `Content should score below ${config.maxAiDetectionScore} on AI detection`,
      status: article.humanScore <= config.maxAiDetectionScore ? 'pass' : 'warning',
      message: `AI detection: ${article.humanScore}% (${100 - article.humanScore}% human-like)`,
      autoFixAvailable: true,
      isBlocking: false,
    });
  }

  // Critical issues
  const criticalIssues = qualityScore.issues.filter(
    i => i.severity === 'error'
  );

  if (!config.allowCriticalIssues && criticalIssues.length > 0) {
    checks.push({
      id: 'quality-critical-issues',
      category: 'quality',
      name: 'Critical Issues',
      description: 'No critical quality issues allowed',
      status: 'fail',
      message: `${criticalIssues.length} critical issue(s) found`,
      autoFixAvailable: criticalIssues.some(i => i.autoFixable),
      isBlocking: true,
    });
  }

  return checks;
}

/**
 * SEO validation checks
 */
function validateSEO(article: Article, config: ValidationConfig): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const content = article.content.toLowerCase();
  const title = article.title.toLowerCase();
  const keyword = article.primaryKeyword?.toLowerCase() || '';

  // Focus keyword
  if (config.requireFocusKeyword) {
    checks.push({
      id: 'seo-focus-keyword',
      category: 'seo',
      name: 'Focus Keyword',
      description: 'Article must have a primary focus keyword',
      status: keyword ? 'pass' : 'fail',
      message: keyword ? `"${article.primaryKeyword}"` : 'No focus keyword set',
      autoFixAvailable: false,
      isBlocking: true,
    });
  }

  // Keyword in title
  if (config.requireKeywordInTitle && keyword) {
    checks.push({
      id: 'seo-keyword-in-title',
      category: 'seo',
      name: 'Keyword in Title',
      description: 'Focus keyword should appear in title',
      status: title.includes(keyword) ? 'pass' : 'warning',
      message: title.includes(keyword) ? 'Present' : 'Missing from title',
      autoFixAvailable: false,
      isBlocking: false,
    });
  }

  // Keyword in first paragraph
  if (config.requireKeywordInFirstParagraph && keyword) {
    const firstParagraph = content.split('\n\n')[0] || '';
    checks.push({
      id: 'seo-keyword-in-first-paragraph',
      category: 'seo',
      name: 'Keyword in First Paragraph',
      description: 'Focus keyword should appear early in content',
      status: firstParagraph.includes(keyword) ? 'pass' : 'warning',
      message: firstParagraph.includes(keyword) ? 'Present' : 'Missing from introduction',
      autoFixAvailable: false,
      isBlocking: false,
    });
  }

  // Heading structure
  if (config.requireHeadingStructure) {
    const hasH1 = content.includes('<h1') || content.includes('# ');
    const hasH2 = content.includes('<h2') || content.includes('## ');

    checks.push({
      id: 'seo-heading-structure',
      category: 'seo',
      name: 'Heading Structure',
      description: 'Article should have proper heading hierarchy',
      status: hasH1 && hasH2 ? 'pass' : 'warning',
      message: hasH1 && hasH2 ? 'Valid structure' : 'Missing headings',
      autoFixAvailable: false,
      isBlocking: false,
    });
  }

  // Internal links
  const internalLinkCount = (content.match(/href="[^"]*"/g) || [])
    .filter(link => !link.includes('http'))
    .length;

  checks.push({
    id: 'seo-internal-links',
    category: 'seo',
    name: 'Internal Links',
    description: `Should have ${config.minInternalLinks}-${config.maxInternalLinks || '∞'} internal links`,
    status: internalLinkCount >= config.minInternalLinks
      ? (config.maxInternalLinks && internalLinkCount > config.maxInternalLinks ? 'warning' : 'pass')
      : 'warning',
    message: `${internalLinkCount} internal link(s)`,
    autoFixAvailable: true,
    isBlocking: false,
  });

  // External links
  if (config.minExternalLinks !== undefined) {
    const externalLinkCount = (content.match(/href="https?:\/\//g) || []).length;

    checks.push({
      id: 'seo-external-links',
      category: 'seo',
      name: 'External Links',
      description: `Should have ${config.minExternalLinks}-${config.maxExternalLinks || '∞'} external links`,
      status: externalLinkCount >= config.minExternalLinks
        ? (config.maxExternalLinks && externalLinkCount > config.maxExternalLinks ? 'warning' : 'pass')
        : 'warning',
      message: `${externalLinkCount} external link(s)`,
      autoFixAvailable: false,
      isBlocking: false,
    });
  }

  // Image alt tags
  if (config.requireImageAltTags) {
    const images = content.match(/<img[^>]*>/g) || [];
    const imagesWithAlt = images.filter(img => img.includes('alt=')).length;
    const missingAlt = images.length - imagesWithAlt;

    if (images.length > 0) {
      checks.push({
        id: 'seo-image-alt-tags',
        category: 'seo',
        name: 'Image Alt Tags',
        description: 'All images should have alt text',
        status: missingAlt === 0 ? 'pass' : 'warning',
        message: missingAlt === 0
          ? `All ${images.length} images have alt text`
          : `${missingAlt} of ${images.length} images missing alt text`,
        autoFixAvailable: false,
        isBlocking: false,
      });
    }
  }

  return checks;
}

/**
 * Compliance validation checks
 */
function validateCompliance(article: Article, config: ValidationConfig): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  const content = article.content.toLowerCase();

  // Banned phrases
  if (config.bannedPhrases.length > 0) {
    const foundPhrases = config.bannedPhrases.filter(phrase =>
      content.includes(phrase.toLowerCase())
    );

    checks.push({
      id: 'compliance-banned-phrases',
      category: 'compliance',
      name: 'Banned Phrases',
      description: 'Content should not contain banned phrases',
      status: foundPhrases.length === 0 ? 'pass' : 'warning',
      message: foundPhrases.length === 0
        ? 'No banned phrases found'
        : `Found: ${foundPhrases.join(', ')}`,
      autoFixAvailable: true,
      isBlocking: false,
    });
  }

  // Link domain validation
  const links = article.content.match(/href="(https?:\/\/[^"]+)"/g) || [];
  const domains = links.map(link => {
    const match = link.match(/https?:\/\/([^\/]+)/);
    return match ? match[1] : '';
  }).filter(Boolean);

  // Blocked domains
  if (config.blockedDomains && config.blockedDomains.length > 0) {
    const blockedFound = domains.filter(domain =>
      config.blockedDomains!.some(blocked => domain.includes(blocked))
    );

    if (blockedFound.length > 0) {
      checks.push({
        id: 'compliance-blocked-domains',
        category: 'compliance',
        name: 'Blocked Domains',
        description: 'Content links to blocked domains',
        status: 'fail',
        message: `Links to blocked domains: ${blockedFound.join(', ')}`,
        autoFixAvailable: false,
        isBlocking: true,
      });
    }
  }

  // Allowed domains (if whitelist specified)
  if (config.allowedDomains && config.allowedDomains.length > 0) {
    const externalDomains = domains.filter(domain =>
      !config.allowedDomains!.some(allowed => domain.includes(allowed))
    );

    if (externalDomains.length > 0) {
      checks.push({
        id: 'compliance-allowed-domains',
        category: 'compliance',
        name: 'Domain Whitelist',
        description: 'External links must be to allowed domains',
        status: 'warning',
        message: `Links to non-whitelisted domains: ${externalDomains.join(', ')}`,
        autoFixAvailable: false,
        isBlocking: false,
      });
    }
  }

  // Content freshness
  if (config.maxContentAge) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(article.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    checks.push({
      id: 'compliance-content-freshness',
      category: 'compliance',
      name: 'Content Freshness',
      description: `Content should be updated within ${config.maxContentAge} days`,
      status: daysSinceUpdate <= config.maxContentAge ? 'pass' : 'warning',
      message: `Last updated ${daysSinceUpdate} days ago`,
      autoFixAvailable: false,
      isBlocking: false,
    });
  }

  return checks;
}

/**
 * Get auto-fixable checks
 */
export function getAutoFixableChecks(result: ValidationResult): ValidationCheck[] {
  return result.checks.filter(check =>
    check.autoFixAvailable && (check.status === 'fail' || check.status === 'warning')
  );
}

/**
 * Get category summary
 */
export function getCategorySummary(result: ValidationResult) {
  const categories = ['content', 'quality', 'seo', 'compliance'] as const;

  return categories.map(category => {
    const categoryChecks = result.checks.filter(c => c.category === category);
    const passed = categoryChecks.filter(c => c.status === 'pass').length;
    const failed = categoryChecks.filter(c => c.status === 'fail').length;
    const warnings = categoryChecks.filter(c => c.status === 'warning').length;

    return {
      category,
      total: categoryChecks.length,
      passed,
      failed,
      warnings,
      percentage: categoryChecks.length > 0
        ? Math.round((passed / categoryChecks.length) * 100)
        : 100,
    };
  });
}
