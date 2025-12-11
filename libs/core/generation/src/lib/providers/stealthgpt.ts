/**
 * StealthGPT Provider
 *
 * Content humanization service to make AI-generated content
 * undetectable by AI detection tools while preserving voice and quality.
 *
 * StealthGPT API: https://stealthgpt.ai/
 *
 * OPTIMIZATION NOTES (from StealthGPT docs):
 * - Split text into 150-200 word chunks (~1200 chars) for best results
 * - Use iterative rephrasing (2-3 passes) for maximum bypass
 * - business: true uses 10x more powerful model
 * - Don't manually edit output - regenerate instead
 * - Check howLikelyToBeDetected score, retry if > 25
 *
 * CORS NOTE:
 * In production, requests are proxied through a Supabase Edge Function
 * to avoid CORS issues. Set supabaseUrl in config.
 */

import {
  AIProvider,
  GenerationRequest,
  GenerationResult,
  HumanizationRequest,
  HumanizationResult,
  ArticleOutline,
  ContributorVoice,
  StealthGPTProviderConfig,
  StealthGPTHumanizeOptions,
  StealthGPTHumanizeResult,
  StealthGPTProgress,
  StealthGPTChunkResult,
  StealthGPTDetectionResult,
  StealthGPTTone,
  StealthGPTMode,
  StealthGPTDetector,
} from '../types';

const STEALTHGPT_API_URL = 'https://stealthgpt.ai/api/stealthify';

/**
 * Default configuration for StealthGPT humanization
 * Optimized for maximum undetectability per StealthGPT docs
 */
const DEFAULT_OPTIONS: Required<Omit<StealthGPTHumanizeOptions, 'onProgress'>> = {
  tone: 'PhD',
  mode: 'Medium',
  business: true,
  detector: 'gptzero',
  maxIterations: 3,
  detectionThreshold: 25,
  isMultilingual: false,
};

/**
 * Chunk configuration
 * Per StealthGPT docs: 150-200 words = ~1000-1400 chars
 */
const CHUNK_CONFIG = {
  /** Optimal chunk size in characters (~200 words) */
  optimal: 1200,
  /** Maximum chunk size before splitting */
  max: 1500,
  /** Minimum chunk size to process (ignore smaller) */
  min: 50,
};

/**
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

interface StealthGPTAPIResponse {
  result?: string;
  howLikelyToBeDetected?: number;
  error?: string;
}

export class StealthGPTProvider implements AIProvider {
  name = 'stealthgpt';

  private apiKey: string;
  private supabaseUrl?: string;
  private supabaseAnonKey?: string;
  private useEdgeFunction: boolean;
  private defaultOptions: Required<Omit<StealthGPTHumanizeOptions, 'onProgress'>>;
  private corsFailureDetected = false;

  constructor(config: StealthGPTProviderConfig) {
    this.apiKey = config.apiKey;
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.useEdgeFunction = config.useEdgeFunction ?? false;
    this.defaultOptions = {
      ...DEFAULT_OPTIONS,
      ...config.defaultOptions,
    };
  }

  // ===== Public API =====

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    if (this.shouldUseEdgeFunction()) {
      return !!this.getEdgeFunctionUrl();
    }
    return !!this.apiKey && this.apiKey.length > 10;
  }

  /**
   * StealthGPT is primarily a humanization service, not a content generator.
   */
  async generateContent(_request: GenerationRequest): Promise<GenerationResult> {
    return {
      success: false,
      error: 'StealthGPT is a humanization service. Use humanizeContent() or humanizeContentAdvanced() instead.',
    };
  }

  /**
   * Generate outline - not supported by StealthGPT
   */
  async generateOutline(_topic: string, _contentType: string): Promise<ArticleOutline> {
    throw new Error('StealthGPT does not support outline generation. Use Grok or Claude instead.');
  }

  /**
   * Humanize content using the standard AIProvider interface
   * For advanced features, use humanizeContentAdvanced()
   */
  async humanizeContent(request: HumanizationRequest): Promise<HumanizationResult> {
    try {
      // Map aggressiveness to StealthGPT modes
      const modeMap: Record<string, StealthGPTMode> = {
        light: 'Low',
        medium: 'Medium',
        heavy: 'High',
      };

      // Map voice profile formality to tone
      const tone = this.formalityToTone(request.contributorVoice?.formalityScale ?? 5);
      const mode = modeMap[request.aggressiveness] || 'Medium';

      const result = await this.humanizeContentAdvanced(request.content, {
        tone,
        mode,
      });

      // Apply voice profile adjustments if provided
      let finalContent = result.humanizedContent;
      if (request.contributorVoice) {
        finalContent = this.applyVoiceProfile(finalContent, request.contributorVoice);
      }

      return {
        success: result.success,
        content: finalContent,
        changes: this.estimateChanges(request.content, finalContent),
        error: result.error,
        metadata: {
          provider: 'stealthgpt',
          mode,
          tone,
          tokensUsed: 0, // StealthGPT doesn't return token counts
          estimatedDetectionScore: result.detectionScores.after,
        },
      };
    } catch (error) {
      console.error('[StealthGPT] Humanization error:', error);
      return {
        success: false,
        content: request.content,
        changes: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Advanced humanization with full control and progress callbacks
   * This is the PRIMARY method for article humanization
   */
  async humanizeContentAdvanced(
    content: string,
    options: StealthGPTHumanizeOptions = {}
  ): Promise<StealthGPTHumanizeResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };
    const { onProgress } = options;

    console.log(`[StealthGPT] Starting humanization (${content.length} chars)`);

    // Phase 1: Chunking
    this.emitProgress(onProgress, {
      phase: 'chunking',
      chunk: 0,
      totalChunks: 0,
      iteration: 0,
      maxIterations: mergedOptions.maxIterations,
      message: 'Splitting content into optimal chunks...',
    });

    const chunks = this.splitIntoOptimalChunks(content);
    console.log(`[StealthGPT] Split into ${chunks.length} chunks`);

    const chunkResults: StealthGPTChunkResult[] = [];
    let totalIterations = 0;
    let totalFinalScore = 0;

    // Phase 2: Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[StealthGPT] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

      this.emitProgress(onProgress, {
        phase: 'humanizing',
        chunk: i + 1,
        totalChunks: chunks.length,
        iteration: 0,
        maxIterations: mergedOptions.maxIterations,
        message: `Processing chunk ${i + 1} of ${chunks.length}...`,
      });

      try {
        const chunkResult = await this.humanizeChunk(chunk, i, mergedOptions, onProgress);
        chunkResults.push(chunkResult);
        totalIterations += chunkResult.iterations;
        totalFinalScore += chunkResult.finalScore;

        // Rate limiting delay between chunks
        if (i < chunks.length - 1) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`[StealthGPT] Chunk ${i + 1} failed:`, error);
        // Fall back to original chunk on error
        chunkResults.push({
          index: i,
          original: chunk,
          humanized: chunk,
          iterations: 0,
          initialScore: 100,
          finalScore: 100,
          thresholdMet: false,
        });
        totalFinalScore += 100;
      }
    }

    // Phase 3: Combine results
    const humanizedContent = chunkResults.map(r => r.humanized).join('\n\n');
    const avgFinalScore = chunks.length > 0 ? Math.round(totalFinalScore / chunks.length) : 0;

    this.emitProgress(onProgress, {
      phase: 'complete',
      chunk: chunks.length,
      totalChunks: chunks.length,
      iteration: totalIterations,
      maxIterations: mergedOptions.maxIterations,
      detectionScore: avgFinalScore,
      message: `Humanization complete! Average detection score: ${avgFinalScore}`,
    });

    console.log(`[StealthGPT] Complete! Avg score: ${avgFinalScore}, Total iterations: ${totalIterations}`);

    return {
      success: true,
      originalContent: content,
      humanizedContent,
      totalIterations,
      detectionScores: {
        before: 100, // Assume worst case before humanization
        after: avgFinalScore,
      },
      chunksProcessed: chunks.length,
      chunks: chunkResults,
      metadata: {
        provider: 'stealthgpt',
        tone: mergedOptions.tone,
        mode: mergedOptions.mode,
        business: mergedOptions.business,
        detector: mergedOptions.detector,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Analyze content for AI detection patterns (local analysis, no API call)
   */
  analyzeDetection(content: string): StealthGPTDetectionResult {
    const patterns: string[] = [];

    // Common AI-generated patterns
    const aiPatterns = [
      { pattern: /\bdelve\b/gi, name: 'delve' },
      { pattern: /\blet's explore\b/gi, name: "let's explore" },
      { pattern: /\bit's worth noting\b/gi, name: "it's worth noting" },
      { pattern: /\bIn conclusion\b/gi, name: 'In conclusion' },
      { pattern: /\bseamlessly\b/gi, name: 'seamlessly' },
      { pattern: /\brobust\b/gi, name: 'robust' },
      { pattern: /\bleverage\b/gi, name: 'leverage' },
      { pattern: /\bparadigm\b/gi, name: 'paradigm' },
      { pattern: /\bsynergy\b/gi, name: 'synergy' },
      { pattern: /\bholistic\b/gi, name: 'holistic' },
      { pattern: /\bin today's fast-paced\b/gi, name: "in today's fast-paced" },
      { pattern: /\bever-evolving\b/gi, name: 'ever-evolving' },
      { pattern: /\bgame-?changer\b/gi, name: 'game-changer' },
      { pattern: /\bunpack\b/gi, name: 'unpack' },
      { pattern: /\btap into\b/gi, name: 'tap into' },
      { pattern: /\bgroundbreaking\b/gi, name: 'groundbreaking' },
      { pattern: /\bnavigating the\b/gi, name: 'navigating the' },
    ];

    let patternCount = 0;

    for (const { pattern, name } of aiPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        patterns.push(name);
        patternCount += matches.length;
      }
    }

    // Check for uniform sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5) {
      const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
      const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
      const variance =
        sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
        sentenceLengths.length;

      if (variance < 25) {
        patterns.push('uniform sentence length');
        patternCount += 2;
      }
    }

    // Calculate score (higher = more likely AI)
    const baseScore = Math.min(100, patternCount * 8);
    const score = Math.round(baseScore);

    // Determine risk level and suggested mode
    let riskLevel: 'low' | 'medium' | 'high';
    let suggestedMode: StealthGPTMode;
    let needsHumanization: boolean;

    if (score >= 50) {
      riskLevel = 'high';
      suggestedMode = 'High';
      needsHumanization = true;
    } else if (score >= 25) {
      riskLevel = 'medium';
      suggestedMode = 'Medium';
      needsHumanization = true;
    } else if (score > 0) {
      riskLevel = 'low';
      suggestedMode = 'Low';
      needsHumanization = true;
    } else {
      riskLevel = 'low';
      suggestedMode = 'Low';
      needsHumanization = false;
    }

    return {
      score,
      patterns,
      riskLevel,
      suggestedMode,
      needsHumanization,
    };
  }

  /**
   * Get available tone options
   */
  static getToneOptions(): Array<{ value: StealthGPTTone; label: string; description: string }> {
    return [
      { value: 'High School', label: 'High School', description: 'Simpler vocabulary and structure' },
      { value: 'College', label: 'College', description: 'Academic but accessible (Recommended)' },
      { value: 'PhD', label: 'PhD', description: 'Advanced academic writing, no errors' },
    ];
  }

  /**
   * Get available mode options
   */
  static getModeOptions(): Array<{ value: StealthGPTMode; label: string; description: string }> {
    return [
      { value: 'Low', label: 'Low', description: 'Light humanization, best for SEO/web content' },
      { value: 'Medium', label: 'Medium', description: 'Balanced bypass for professional use' },
      { value: 'High', label: 'High', description: 'Maximum undetectability (Recommended)' },
    ];
  }

  /**
   * Get available detector options
   */
  static getDetectorOptions(): Array<{ value: StealthGPTDetector; label: string; description: string }> {
    return [
      { value: 'gptzero', label: 'GPTZero', description: 'Most common AI detector (Recommended)' },
      { value: 'originality', label: 'Originality.ai', description: 'Content publishers detector' },
      { value: 'copyleaks', label: 'Copyleaks', description: 'Academic and business detector' },
      { value: 'turnitin', label: 'Turnitin', description: 'Academic plagiarism checker' },
    ];
  }

  // ===== Private Methods =====

  /**
   * Process a single chunk with iterative humanization
   */
  private async humanizeChunk(
    content: string,
    chunkIndex: number,
    options: Required<Omit<StealthGPTHumanizeOptions, 'onProgress'>>,
    onProgress?: (progress: StealthGPTProgress) => void
  ): Promise<StealthGPTChunkResult> {
    let currentContent = content;
    let detectionScore = 100;
    let iterations = 0;
    const initialScore = 100;

    // Iterative rephrasing until detection score is acceptable
    while (iterations < options.maxIterations && detectionScore > options.detectionThreshold) {
      iterations++;

      this.emitProgress(onProgress, {
        phase: 'iterating',
        chunk: chunkIndex + 1,
        totalChunks: -1, // Unknown at this level
        iteration: iterations,
        maxIterations: options.maxIterations,
        detectionScore,
        message: `Iteration ${iterations}/${options.maxIterations} - Current score: ${detectionScore}`,
      });

      const response = await this.callStealthGPTWithRetry({
        prompt: currentContent,
        rephrase: true,
        tone: options.tone,
        mode: options.mode,
        business: options.business,
        isMultilingual: options.isMultilingual,
        detector: options.detector,
      });

      if (!response.result) {
        throw new Error('StealthGPT returned empty result');
      }

      currentContent = response.result;
      detectionScore = response.howLikelyToBeDetected ?? 0;

      console.log(`[StealthGPT] Chunk ${chunkIndex + 1}, Iteration ${iterations}: Score = ${detectionScore}`);

      // If we got a good score, break early
      if (detectionScore <= options.detectionThreshold) {
        console.log(`[StealthGPT] Achieved target score after ${iterations} iteration(s)`);
        break;
      }

      // Small delay between iterations
      if (iterations < options.maxIterations) {
        await this.delay(300);
      }
    }

    return {
      index: chunkIndex,
      original: content,
      humanized: currentContent,
      iterations,
      initialScore,
      finalScore: detectionScore,
      thresholdMet: detectionScore <= options.detectionThreshold,
    };
  }

  /**
   * Call StealthGPT API with retry logic
   */
  private async callStealthGPTWithRetry(
    payload: Record<string, unknown>
  ): Promise<StealthGPTAPIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await this.callStealthGPT(payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[StealthGPT] Attempt ${attempt}/${RETRY_CONFIG.maxRetries} failed:`, lastError.message);

        // Don't retry on client errors (4xx)
        if (lastError.message.includes('400') || lastError.message.includes('401') || lastError.message.includes('403')) {
          throw lastError;
        }

        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000,
            RETRY_CONFIG.maxDelayMs
          );
          console.log(`[StealthGPT] Retrying in ${Math.round(delay)}ms...`);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Make API request to StealthGPT
   * Automatically routes through Edge Function in production or on CORS failure
   */
  private async callStealthGPT(payload: Record<string, unknown>): Promise<StealthGPTAPIResponse> {
    if (!this.isConfigured()) {
      throw new Error('StealthGPT not configured - missing API key or Edge Function URL');
    }

    // Determine which method to use
    if (this.shouldUseEdgeFunction()) {
      return this.callViaEdgeFunction(payload);
    }

    // Try direct API first (development mode)
    try {
      return await this.callDirectAPI(payload);
    } catch (error) {
      // Check if this is a CORS error and fallback to Edge Function
      if (this.isCorsError(error) && this.getEdgeFunctionUrl()) {
        console.warn('[StealthGPT] CORS error detected, switching to Edge Function');
        this.corsFailureDetected = true;
        return this.callViaEdgeFunction(payload);
      }
      throw error;
    }
  }

  /**
   * Direct API call to StealthGPT (development mode)
   */
  private async callDirectAPI(payload: Record<string, unknown>): Promise<StealthGPTAPIResponse> {
    console.log('[StealthGPT] Making direct API request');

    const response = await fetch(STEALTHGPT_API_URL, {
      method: 'POST',
      headers: {
        'api-token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[StealthGPT] API error:', response.status, errorText);
      throw new Error(`StealthGPT API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Call via Supabase Edge Function (production mode, bypasses CORS)
   */
  private async callViaEdgeFunction(payload: Record<string, unknown>): Promise<StealthGPTAPIResponse> {
    const edgeFunctionUrl = this.getEdgeFunctionUrl();
    if (!edgeFunctionUrl) {
      throw new Error('Edge Function URL not configured - set supabaseUrl in config');
    }

    console.log('[StealthGPT] Making request via Edge Function');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.supabaseAnonKey) {
      headers['Authorization'] = `Bearer ${this.supabaseAnonKey}`;
      headers['apikey'] = this.supabaseAnonKey;
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[StealthGPT] Edge Function error:', response.status, errorData);
      throw new Error(
        `StealthGPT Edge Function error: ${response.status} - ${errorData.error || 'Unknown error'}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Edge Function returned unsuccessful response');
    }

    // Map Edge Function response to direct API format
    return {
      result: data.result,
      howLikelyToBeDetected: data.howLikelyToBeDetected,
    };
  }

  /**
   * Split content into optimal chunks (150-200 words each)
   * Preserves HTML/Markdown structure and sentence boundaries
   */
  private splitIntoOptimalChunks(content: string): string[] {
    const chunks: string[] = [];

    // First, try to split by headings
    const sections = this.splitByHeadings(content);

    for (const section of sections) {
      // If section is small enough, keep it as is
      if (section.length <= CHUNK_CONFIG.max) {
        if (section.trim().length >= CHUNK_CONFIG.min) {
          chunks.push(section.trim());
        }
        continue;
      }

      // Split large sections by paragraphs
      const paragraphs = section.split(/(<\/p>|<br\s*\/?>|\n\n)/gi);
      let currentChunk = '';

      for (const para of paragraphs) {
        // If adding this paragraph would exceed optimal size, save current chunk
        if (currentChunk.length + para.length > CHUNK_CONFIG.optimal && currentChunk.length > 0) {
          if (currentChunk.trim().length >= CHUNK_CONFIG.min) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = '';
        }

        currentChunk += para;

        // If current chunk is at optimal size, save it
        if (currentChunk.length >= CHUNK_CONFIG.optimal) {
          if (currentChunk.trim().length >= CHUNK_CONFIG.min) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = '';
        }
      }

      // Don't forget the last chunk
      if (currentChunk.trim().length >= CHUNK_CONFIG.min) {
        chunks.push(currentChunk.trim());
      }
    }

    return chunks.filter(chunk => chunk.length >= CHUNK_CONFIG.min);
  }

  /**
   * Split content by heading tags for structural chunking
   */
  private splitByHeadings(content: string): string[] {
    // Try H2 first
    let parts = content.split(/(?=<h2)/gi);
    if (parts.length > 1) {
      return parts.filter(p => p.trim());
    }

    // Try markdown H2
    parts = content.split(/(?=^##\s)/m);
    if (parts.length > 1) {
      return parts.filter(p => p.trim());
    }

    // Try H3
    parts = content.split(/(?=<h3)/gi);
    if (parts.length > 1) {
      return parts.filter(p => p.trim());
    }

    // Return as single chunk
    return [content];
  }

  /**
   * Emit progress callback if provided
   */
  private emitProgress(
    onProgress: ((progress: StealthGPTProgress) => void) | undefined,
    progress: StealthGPTProgress
  ): void {
    if (onProgress) {
      try {
        onProgress(progress);
      } catch (error) {
        console.warn('[StealthGPT] Progress callback error:', error);
      }
    }
  }

  /**
   * Check if we should use the Edge Function for requests
   */
  private shouldUseEdgeFunction(): boolean {
    return (this.useEdgeFunction || this.corsFailureDetected) && !!this.getEdgeFunctionUrl();
  }

  /**
   * Get the Edge Function URL
   */
  private getEdgeFunctionUrl(): string | null {
    if (!this.supabaseUrl) return null;
    return `${this.supabaseUrl}/functions/v1/stealthgpt-humanize`;
  }

  /**
   * Check if an error is likely a CORS error
   */
  private isCorsError(error: unknown): boolean {
    if (!error) return false;
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return (
      message.includes('cors') ||
      message.includes('network error') ||
      message.includes('failed to fetch') ||
      message.includes('load failed') ||
      (error instanceof TypeError) // fetch CORS errors often show as TypeError
    );
  }

  /**
   * Map formality scale (1-10) to StealthGPT tone
   */
  private formalityToTone(formality: number): StealthGPTTone {
    if (formality <= 3) return 'High School';
    if (formality <= 6) return 'College';
    return 'PhD';
  }

  /**
   * Apply voice profile adjustments to humanized content
   */
  private applyVoiceProfile(content: string, voice: ContributorVoice): string {
    let result = content;

    // Remove phrases to avoid
    if (voice.phrasesToAvoid && voice.phrasesToAvoid.length > 0) {
      for (const phrase of voice.phrasesToAvoid) {
        const regex = new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, 'gi');
        result = result.replace(regex, this.findAlternative(phrase));
      }
    }

    return result;
  }

  /**
   * Find alternative phrasing for banned phrases
   */
  private findAlternative(phrase: string): string {
    const alternatives: Record<string, string> = {
      'game changer': 'significant development',
      'game-changer': 'significant development',
      'synergy': 'collaboration',
      'leverage': 'use',
      'delve': 'explore',
      'unpack': 'explain',
      'robust': 'strong',
      'seamlessly': 'smoothly',
      'paradigm': 'approach',
      'holistic': 'comprehensive',
      'groundbreaking': 'innovative',
    };

    const lowerPhrase = phrase.toLowerCase();
    return alternatives[lowerPhrase] || '';
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Estimate number of changes made during humanization
   */
  private estimateChanges(original: string, humanized: string): number {
    const originalWords = original.toLowerCase().split(/\s+/);
    const humanizedWords = humanized.toLowerCase().split(/\s+/);

    let changes = 0;
    const maxLen = Math.max(originalWords.length, humanizedWords.length);

    for (let i = 0; i < maxLen; i++) {
      if (originalWords[i] !== humanizedWords[i]) {
        changes++;
      }
    }

    return changes;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default StealthGPTProvider;
