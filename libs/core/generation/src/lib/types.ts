export interface AIProviderConfig {
  provider: 'grok' | 'claude' | 'stealthgpt' | 'openai' | 'gemini';
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
  metadata?: {
    provider: string;
    mode?: string;
    tone?: string;
    tokensUsed?: number;
    estimatedDetectionScore?: number;
  };
}

export interface AIProvider {
  name: string;
  generateContent(request: GenerationRequest): Promise<GenerationResult>;
  generateOutline(topic: string, contentType: string): Promise<ArticleOutline>;
  humanizeContent(request: HumanizationRequest): Promise<HumanizationResult>;
}

// ===== StealthGPT-specific Types =====

/**
 * StealthGPT Tone options
 * - PhD: Advanced academic writing with no grammatical errors
 * - College: Academic but accessible (recommended for professional content)
 * - High School: Simpler vocabulary and structure
 */
export type StealthGPTTone = 'PhD' | 'College' | 'High School';

/**
 * StealthGPT Mode options
 * - Low: Light humanization, best for SEO/web content
 * - Medium: Balanced bypass for professional use
 * - High: Maximum undetectability (recommended)
 */
export type StealthGPTMode = 'Low' | 'Medium' | 'High';

/**
 * Detector types that StealthGPT optimizes for
 */
export type StealthGPTDetector = 'gptzero' | 'originality' | 'copyleaks' | 'turnitin';

/**
 * Options for humanizing content with StealthGPT
 */
export interface StealthGPTHumanizeOptions {
  /** Tone/sophistication level of the output */
  tone?: StealthGPTTone;
  /** Humanization intensity level */
  mode?: StealthGPTMode;
  /** Use the 10x more powerful business model */
  business?: boolean;
  /** Detector to optimize against */
  detector?: StealthGPTDetector;
  /** Maximum iterations per chunk (default: 3) */
  maxIterations?: number;
  /** Target detection threshold (default: 25) */
  detectionThreshold?: number;
  /** Progress callback for UI updates */
  onProgress?: (progress: StealthGPTProgress) => void;
  /** Enable multilingual mode */
  isMultilingual?: boolean;
}

/**
 * Progress information during humanization
 */
export interface StealthGPTProgress {
  /** Current phase of humanization */
  phase: 'chunking' | 'humanizing' | 'detecting' | 'iterating' | 'complete';
  /** Current chunk being processed (1-indexed) */
  chunk: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Current iteration within the chunk */
  iteration: number;
  /** Maximum iterations allowed */
  maxIterations: number;
  /** Current detection score (if available) */
  detectionScore?: number;
  /** Status message */
  message?: string;
}

/**
 * Result of StealthGPT humanization
 */
export interface StealthGPTHumanizeResult {
  /** Whether the humanization was successful */
  success: boolean;
  /** Original content before humanization */
  originalContent: string;
  /** Humanized content */
  humanizedContent: string;
  /** Total iterations performed across all chunks */
  totalIterations: number;
  /** Detection scores */
  detectionScores: {
    /** Estimated score before humanization */
    before: number;
    /** Average score after humanization */
    after: number;
  };
  /** Number of chunks processed */
  chunksProcessed: number;
  /** Detailed chunk information */
  chunks?: StealthGPTChunkResult[];
  /** Error message if failed */
  error?: string;
  /** Processing metadata */
  metadata?: {
    provider: string;
    tone: StealthGPTTone;
    mode: StealthGPTMode;
    business: boolean;
    detector: StealthGPTDetector;
    processingTimeMs: number;
  };
}

/**
 * Result for a single chunk
 */
export interface StealthGPTChunkResult {
  /** Chunk index (0-indexed) */
  index: number;
  /** Original chunk content */
  original: string;
  /** Humanized chunk content */
  humanized: string;
  /** Number of iterations needed */
  iterations: number;
  /** Initial detection score */
  initialScore: number;
  /** Final detection score */
  finalScore: number;
  /** Whether target threshold was achieved */
  thresholdMet: boolean;
}

/**
 * Detection analysis result
 */
export interface StealthGPTDetectionResult {
  /** Detection likelihood score (0-100) */
  score: number;
  /** Detected AI patterns found */
  patterns: string[];
  /** Risk level assessment */
  riskLevel: 'low' | 'medium' | 'high';
  /** Recommendation for humanization mode */
  suggestedMode: StealthGPTMode;
  /** Whether content needs humanization */
  needsHumanization: boolean;
}

/**
 * Configuration for StealthGPT provider
 */
export interface StealthGPTProviderConfig {
  /** API key for StealthGPT */
  apiKey: string;
  /** Supabase URL for Edge Function proxy (optional) */
  supabaseUrl?: string;
  /** Supabase anon key for Edge Function auth (optional) */
  supabaseAnonKey?: string;
  /** Force use of Edge Function even in development */
  useEdgeFunction?: boolean;
  /** Default humanization options */
  defaultOptions?: Partial<StealthGPTHumanizeOptions>;
}
