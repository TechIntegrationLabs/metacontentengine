/**
 * Pre-Publish Validation Types
 */

export type ValidationCategory = 'content' | 'quality' | 'seo' | 'compliance';
export type ValidationStatus = 'pass' | 'fail' | 'warning' | 'skipped';

export interface ValidationCheck {
  id: string;
  category: ValidationCategory;
  name: string;
  description: string;
  status: ValidationStatus;
  message?: string;
  autoFixAvailable?: boolean;
  isBlocking?: boolean; // Prevents publishing if failed
}

export interface ValidationResult {
  canPublish: boolean;
  checks: ValidationCheck[];
  passCount: number;
  failCount: number;
  warningCount: number;
  skippedCount: number;
  blockers: ValidationCheck[];
  timestamp: string;
}

export interface ValidationConfig {
  // Content requirements
  minWordCount: number;
  maxWordCount?: number;
  minTitleLength: number;
  maxTitleLength: number;
  requireMetaDescription: boolean;
  minMetaDescriptionLength: number;
  maxMetaDescriptionLength: number;
  requireFeaturedImage: boolean;

  // Quality requirements
  minQualityScore: number;
  maxAiDetectionScore: number; // Lower = more human
  allowCriticalIssues: boolean;

  // SEO requirements
  requireFocusKeyword: boolean;
  requireKeywordInTitle: boolean;
  requireKeywordInFirstParagraph: boolean;
  requireHeadingStructure: boolean;
  minInternalLinks: number;
  maxInternalLinks?: number;
  minExternalLinks?: number;
  maxExternalLinks?: number;
  requireImageAltTags: boolean;

  // Compliance
  bannedPhrases: string[];
  allowedDomains?: string[]; // For external links
  blockedDomains?: string[]; // For external links
  maxContentAge?: number; // Days since last update for republishing
  checkPlagiarism?: boolean;
  requireLegalDisclaimer?: boolean;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  // Content
  minWordCount: 800,
  maxWordCount: 5000,
  minTitleLength: 30,
  maxTitleLength: 70,
  requireMetaDescription: true,
  minMetaDescriptionLength: 120,
  maxMetaDescriptionLength: 160,
  requireFeaturedImage: true,

  // Quality
  minQualityScore: 70,
  maxAiDetectionScore: 30,
  allowCriticalIssues: false,

  // SEO
  requireFocusKeyword: true,
  requireKeywordInTitle: true,
  requireKeywordInFirstParagraph: true,
  requireHeadingStructure: true,
  minInternalLinks: 2,
  maxInternalLinks: 10,
  minExternalLinks: 1,
  maxExternalLinks: 5,
  requireImageAltTags: true,

  // Compliance
  bannedPhrases: [
    'click here',
    'read more here',
    'as mentioned above',
    'in conclusion',
    'to sum up',
  ],
  allowedDomains: undefined,
  blockedDomains: ['spam-site.com', 'low-quality.net'],
  maxContentAge: undefined,
  checkPlagiarism: false,
  requireLegalDisclaimer: false,
};
