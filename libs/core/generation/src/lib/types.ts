export interface AIProviderConfig {
  provider: 'grok' | 'claude' | 'openai' | 'gemini';
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationRequest {
  topic: string;
  contentType: string;
  contributorId: string;
  contributorVoice: ContributorVoice;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  targetWordCount?: number;
  outline?: ArticleOutline;
  seoOptimize?: boolean;
}

export interface ContributorVoice {
  formalityScale: number;
  description: string;
  guidelines?: string;
  signaturePhrases: string[];
  transitionWords: string[];
  phrasesToAvoid: string[];
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

export interface GenerationResult {
  success: boolean;
  content?: string;
  title?: string;
  excerpt?: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  error?: string;
}

export interface HumanizationRequest {
  content: string;
  contributorVoice: ContributorVoice;
  aggressiveness: 'light' | 'medium' | 'heavy';
}

export interface HumanizationResult {
  success: boolean;
  content: string;
  changes: number;
  error?: string;
}

export interface AIProvider {
  name: string;
  generateContent(request: GenerationRequest): Promise<GenerationResult>;
  generateOutline(topic: string, contentType: string): Promise<ArticleOutline>;
  humanizeContent(request: HumanizationRequest): Promise<HumanizationResult>;
}
