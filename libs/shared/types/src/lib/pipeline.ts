/**
 * Content Generation Pipeline Types
 */

export enum PipelineStage {
  IDLE = 'IDLE',
  CONTEXT = 'CONTEXT',
  RESEARCH = 'RESEARCH',
  OUTLINE = 'OUTLINE',
  AUTHOR_ASSIGNMENT = 'AUTHOR_ASSIGNMENT',
  DRAFTING = 'DRAFTING',
  HUMANIZING = 'HUMANIZING',
  ENHANCING = 'ENHANCING',
  SEO_OPTIMIZATION = 'SEO_OPTIMIZATION',
  QA = 'QA',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface PipelineRun {
  id: string;
  tenantId: string;

  // Input
  topic: string;
  primaryKeyword?: string;
  contentType: string;
  contributorId: string;

  // Status
  stage: PipelineStage;
  progress: number; // 0-100
  error?: string;

  // Output
  articleId?: string;
  generatedContent?: string;
  outline?: ArticleOutline;

  // Metrics
  tokensUsed: number;
  estimatedCost: number;
  duration?: number; // milliseconds

  // Timestamps
  startedAt: string;
  completedAt?: string;
}

export interface ArticleOutline {
  title: string;
  hook: string;
  sections: OutlineSection[];
  conclusion: string;
  targetWordCount: number;
}

export interface OutlineSection {
  heading: string;
  level: 1 | 2 | 3;
  keyPoints: string[];
  targetWords: number;
}

export interface GenerationRequest {
  topic: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  contentType: string;
  contributorId: string;

  // Options
  targetWordCount?: number;
  tone?: string;
  includeImages?: boolean;
  includeFAQ?: boolean;

  // Research
  competitorUrls?: string[];
  referenceUrls?: string[];

  // SEO
  seoOptimize?: boolean;
  internalLinks?: string[];
}

export interface GenerationResult {
  success: boolean;
  articleId?: string;

  content?: string;
  title?: string;
  excerpt?: string;

  seo?: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
  };

  stats?: {
    wordCount: number;
    readingTime: number;
    tokensUsed: number;
    cost: number;
  };

  qualityMetrics?: {
    overallScore: number;
    readabilityScore: number;
    seoScore: number;
    humanScore: number;
  };

  error?: string;
}

export interface HumanizationRequest {
  content: string;
  contributorId: string;
  aggressiveness: 'light' | 'medium' | 'heavy';
  preserveStructure: boolean;
}

export interface HumanizationResult {
  success: boolean;
  content: string;
  originalHumanScore: number;
  newHumanScore: number;
  changesApplied: number;
}

// AI Provider configuration
export interface AIProviderConfig {
  provider: 'grok' | 'claude' | 'openai' | 'gemini';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AIUsage {
  id: string;
  tenantId: string;
  provider: string;
  model: string;

  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;

  operation: 'generation' | 'humanization' | 'seo' | 'research' | 'qa';
  pipelineRunId?: string;

  createdAt: string;
}
