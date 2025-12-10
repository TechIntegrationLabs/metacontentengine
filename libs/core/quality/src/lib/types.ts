// Quality Scoring Types

export interface QualityScore {
  overall: number; // 0-100
  readability: ReadabilityScore;
  seo: SeoScore;
  humanness: HumannessScore;
  structure: StructureScore;
  voice: VoiceScore;
  issues: QualityIssue[];
  suggestions: AutoFixSuggestion[];
}

export interface ReadabilityScore {
  score: number; // 0-100
  fleschKincaid: number; // Grade level
  fleschReadingEase: number; // 0-100 (higher = easier)
  gunningFog: number; // Grade level
  smog: number; // Grade level
  averageSentenceLength: number;
  averageWordLength: number;
  complexWordPercentage: number;
  passiveVoicePercentage: number;
}

export interface SeoScore {
  score: number; // 0-100
  keywordDensity: number; // Percentage
  keywordInTitle: boolean;
  keywordInFirstParagraph: boolean;
  keywordInHeadings: boolean;
  headingStructure: boolean; // H1 -> H2 -> H3 hierarchy
  metaTitleLength: number;
  metaDescriptionLength: number;
  internalLinks: number;
  externalLinks: number;
  imageAltTags: boolean;
  contentLength: number;
}

export interface HumannessScore {
  score: number; // 0-100
  aiPatterns: AiPattern[];
  repetitivePhrasesCount: number;
  sentenceVariety: number; // 0-100
  personalPronouns: number;
  contractions: number;
  idiomCount: number;
  transitionVariety: number; // 0-100
  predictability: number; // 0-100 (lower = better)
}

export interface AiPattern {
  pattern: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  locations: number[]; // Character positions
}

export interface StructureScore {
  score: number; // 0-100
  hasIntroduction: boolean;
  hasConclusion: boolean;
  headingCount: number;
  paragraphCount: number;
  averageParagraphLength: number;
  bulletListCount: number;
  numberedListCount: number;
  hasToc: boolean;
  sectionBalance: number; // 0-100 (100 = well-balanced)
}

export interface VoiceScore {
  score: number; // 0-100
  formalityMatch: number; // 0-100
  signaturePhrasesUsed: number;
  phrasesToAvoidFound: string[];
  toneConsistency: number; // 0-100
  styleProxyMatch: number; // 0-100
}

export interface QualityIssue {
  type: IssueType;
  severity: 'info' | 'warning' | 'error';
  message: string;
  location?: {
    start: number;
    end: number;
    text: string;
  };
  suggestion?: string;
  autoFixable: boolean;
}

export type IssueType =
  | 'readability'
  | 'seo'
  | 'ai_detected'
  | 'structure'
  | 'voice'
  | 'grammar'
  | 'spelling'
  | 'banned_phrase'
  | 'keyword_stuffing'
  | 'passive_voice'
  | 'sentence_length'
  | 'repetition';

export interface AutoFixSuggestion {
  issueType: IssueType;
  original: string;
  replacement: string;
  location: {
    start: number;
    end: number;
  };
  confidence: number; // 0-100
  explanation: string;
}

export interface QualityConfig {
  targetAudience?: 'general' | 'academic' | 'professional' | 'casual';
  targetReadabilityGrade?: number; // Grade level (8-12 typical)
  minWordCount?: number;
  maxWordCount?: number;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  bannedPhrases?: string[];
  requiredElements?: string[];
  voiceProfile?: VoiceProfile;
}

export interface VoiceProfile {
  formalityScale: number; // 1-10
  description: string;
  signaturePhrases: string[];
  phrasesToAvoid: string[];
  transitionWords: string[];
  styleProxy?: string;
}

export interface QualityThresholds {
  minimum: number; // Reject below this
  acceptable: number; // Needs review
  good: number; // Auto-approve
  excellent: number; // Feature candidate
}

export const DEFAULT_THRESHOLDS: QualityThresholds = {
  minimum: 60,
  acceptable: 70,
  good: 80,
  excellent: 90,
};
