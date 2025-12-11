/**
 * Voice Analysis Service
 *
 * Analyzes writing samples to extract voice profile characteristics
 * including tone, formality, style patterns, and signature phrases.
 */

import { ContributorVoice } from './types';

export interface WritingSample {
  content: string;
  source?: string;
  url?: string;
  title?: string;
}

export interface VoiceAnalysisResult {
  success: boolean;
  voiceProfile?: ContributorVoice;
  metrics?: VoiceMetrics;
  error?: string;
}

export interface VoiceMetrics {
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  averageWordLength: number;
  vocabularyRichness: number;
  formalityIndicators: FormalityIndicators;
  stylePatterns: StylePatterns;
}

export interface FormalityIndicators {
  formalWords: number;
  casualWords: number;
  contractions: number;
  firstPerson: number;
  secondPerson: number;
  thirdPerson: number;
  passiveVoice: number;
}

export interface StylePatterns {
  questionFrequency: number;
  exclamationFrequency: number;
  averageParagraphLength: number;
  bulletListUsage: boolean;
  numberedListUsage: boolean;
  emphasisUsage: number; // Bold/italic usage
}

/**
 * Analyze writing samples to extract voice profile
 */
export function analyzeVoice(samples: WritingSample[]): VoiceAnalysisResult {
  if (samples.length === 0) {
    return { success: false, error: 'No writing samples provided' };
  }

  // Combine all samples for analysis
  const combinedText = samples.map(s => s.content).join('\n\n');

  try {
    const metrics = extractMetrics(combinedText);
    const voiceProfile = buildVoiceProfile(combinedText, metrics);

    return {
      success: true,
      voiceProfile,
      metrics,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

/**
 * Extract quantitative metrics from text
 */
function extractMetrics(text: string): VoiceMetrics {
  const words = getWords(text);
  const sentences = getSentences(text);
  const paragraphs = getParagraphs(text);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const averageSentenceLength = wordCount / Math.max(sentenceCount, 1);
  const averageWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(wordCount, 1);

  // Vocabulary richness (unique words / total words)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabularyRichness = uniqueWords.size / Math.max(wordCount, 1);

  const formalityIndicators = extractFormalityIndicators(text, words, sentences);
  const stylePatterns = extractStylePatterns(text, sentences, paragraphs);

  return {
    wordCount,
    sentenceCount,
    averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
    averageWordLength: Math.round(averageWordLength * 10) / 10,
    vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
    formalityIndicators,
    stylePatterns,
  };
}

/**
 * Extract formality-related indicators
 */
function extractFormalityIndicators(text: string, words: string[], sentences: string[]): FormalityIndicators {
  const lowerText = text.toLowerCase();

  // Formal word patterns
  const formalPatterns = [
    /\bfurthermore\b/gi, /\bmoreover\b/gi, /\btherefore\b/gi,
    /\bconsequently\b/gi, /\bhowever\b/gi, /\bnevertheless\b/gi,
    /\bthus\b/gi, /\bwhereas\b/gi, /\bhereby\b/gi,
  ];

  // Casual word patterns
  const casualPatterns = [
    /\bkinda\b/gi, /\bgonna\b/gi, /\bwanna\b/gi,
    /\bsorta\b/gi, /\byeah\b/gi, /\bnope\b/gi,
    /\bstuff\b/gi, /\bthing\b/gi, /\bcool\b/gi,
  ];

  const formalWords = formalPatterns.reduce((sum, p) => sum + (text.match(p) || []).length, 0);
  const casualWords = casualPatterns.reduce((sum, p) => sum + (text.match(p) || []).length, 0);

  // Contractions
  const contractions = (text.match(/\w+'\w+/g) || []).length;

  // Pronoun usage
  const firstPerson = (text.match(/\b(I|me|my|mine|we|us|our|ours)\b/gi) || []).length;
  const secondPerson = (text.match(/\b(you|your|yours)\b/gi) || []).length;
  const thirdPerson = (text.match(/\b(he|she|it|they|him|her|them|his|hers|their|theirs)\b/gi) || []).length;

  // Passive voice detection
  const passivePatterns = [
    /\b(was|were|is|are|been|being|be)\s+\w+ed\b/gi,
    /\b(was|were|is|are|been|being|be)\s+\w+en\b/gi,
  ];
  const passiveVoice = passivePatterns.reduce((sum, p) => sum + (text.match(p) || []).length, 0);

  return {
    formalWords,
    casualWords,
    contractions,
    firstPerson,
    secondPerson,
    thirdPerson,
    passiveVoice,
  };
}

/**
 * Extract style patterns
 */
function extractStylePatterns(text: string, sentences: string[], paragraphs: string[]): StylePatterns {
  const questionCount = (text.match(/\?/g) || []).length;
  const exclamationCount = (text.match(/!/g) || []).length;

  const questionFrequency = sentences.length > 0
    ? Math.round((questionCount / sentences.length) * 100) / 100
    : 0;
  const exclamationFrequency = sentences.length > 0
    ? Math.round((exclamationCount / sentences.length) * 100) / 100
    : 0;

  const paragraphLengths = paragraphs.map(p => getWords(p).length);
  const averageParagraphLength = paragraphLengths.length > 0
    ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
    : 0;

  const bulletListUsage = /^[-*]\s/m.test(text);
  const numberedListUsage = /^\d+\.\s/m.test(text);

  // Emphasis usage (bold/italic in markdown)
  const boldCount = (text.match(/\*\*[^*]+\*\*/g) || []).length;
  const italicCount = (text.match(/(?<!\*)\*[^*]+\*(?!\*)/g) || []).length;
  const emphasisUsage = boldCount + italicCount;

  return {
    questionFrequency,
    exclamationFrequency,
    averageParagraphLength: Math.round(averageParagraphLength),
    bulletListUsage,
    numberedListUsage,
    emphasisUsage,
  };
}

/**
 * Build voice profile from metrics
 */
function buildVoiceProfile(text: string, metrics: VoiceMetrics): ContributorVoice {
  // Calculate formality scale (1-10)
  const { formalityIndicators } = metrics;
  let formalityScore = 5; // Start neutral

  // Adjust based on formal vs casual words
  const formalCasualRatio = (formalityIndicators.formalWords + 1) / (formalityIndicators.casualWords + 1);
  if (formalCasualRatio > 2) formalityScore += 2;
  else if (formalCasualRatio > 1) formalityScore += 1;
  else if (formalCasualRatio < 0.5) formalityScore -= 2;
  else if (formalCasualRatio < 1) formalityScore -= 1;

  // Adjust based on contractions (more = less formal)
  const contractionRate = formalityIndicators.contractions / Math.max(metrics.sentenceCount, 1);
  if (contractionRate > 0.5) formalityScore -= 1;
  if (contractionRate > 1) formalityScore -= 1;

  // Adjust based on passive voice (more = more formal)
  const passiveRate = formalityIndicators.passiveVoice / Math.max(metrics.sentenceCount, 1);
  if (passiveRate > 0.3) formalityScore += 1;

  // Clamp to 1-10
  formalityScore = Math.max(1, Math.min(10, formalityScore));

  // Extract signature phrases (3-5 word phrases that appear multiple times)
  const signaturePhrases = extractSignaturePhrases(text);

  // Extract common transition words used
  const transitionWords = extractTransitionWords(text);

  // Build description
  const description = generateVoiceDescription(metrics, formalityScore);

  return {
    formalityScale: formalityScore,
    description,
    signaturePhrases,
    transitionWords,
    phrasesToAvoid: [], // Would need user input or AI assistance
  };
}

/**
 * Extract signature phrases from text
 */
function extractSignaturePhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const phrases: Record<string, number> = {};

  // Extract 3-word phrases
  for (let i = 0; i <= words.length - 3; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    // Filter out common phrases
    if (!isCommonPhrase(phrase)) {
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  }

  // Extract 4-word phrases
  for (let i = 0; i <= words.length - 4; i++) {
    const phrase = words.slice(i, i + 4).join(' ');
    if (!isCommonPhrase(phrase)) {
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  }

  // Return phrases that appear 2+ times, sorted by frequency
  return Object.entries(phrases)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);
}

/**
 * Check if a phrase is too common to be a signature
 */
function isCommonPhrase(phrase: string): boolean {
  const commonPhrases = [
    'in the', 'of the', 'to the', 'and the', 'for the',
    'it is', 'there is', 'this is', 'that is', 'which is',
    'you can', 'you will', 'you need', 'you should',
    'i have', 'i am', 'i will', 'i can',
    'as well as', 'in order to', 'due to the',
  ];
  return commonPhrases.some(common => phrase.includes(common));
}

/**
 * Extract commonly used transition words
 */
function extractTransitionWords(text: string): string[] {
  const transitionPatterns = [
    'however', 'therefore', 'moreover', 'furthermore', 'meanwhile',
    'consequently', 'nevertheless', 'nonetheless', 'accordingly',
    'hence', 'thus', 'similarly', 'likewise', 'alternatively',
    'specifically', 'particularly', 'notably', 'importantly',
    'additionally', 'also', 'besides', 'finally', 'ultimately',
    'first', 'second', 'third', 'lastly', 'next',
  ];

  const lowerText = text.toLowerCase();
  const foundTransitions: string[] = [];

  for (const word of transitionPatterns) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(lowerText)) {
      foundTransitions.push(word);
    }
  }

  return foundTransitions;
}

/**
 * Generate a natural language description of the voice
 */
function generateVoiceDescription(metrics: VoiceMetrics, formalityScore: number): string {
  const parts: string[] = [];

  // Formality
  if (formalityScore >= 8) {
    parts.push('Highly formal and academic');
  } else if (formalityScore >= 6) {
    parts.push('Professional and polished');
  } else if (formalityScore >= 4) {
    parts.push('Conversational yet authoritative');
  } else {
    parts.push('Casual and approachable');
  }

  // Sentence structure
  if (metrics.averageSentenceLength > 25) {
    parts.push('complex sentence structures');
  } else if (metrics.averageSentenceLength < 15) {
    parts.push('concise, punchy sentences');
  } else {
    parts.push('balanced sentence lengths');
  }

  // Engagement style
  if (metrics.stylePatterns.questionFrequency > 0.1) {
    parts.push('frequently engages readers with questions');
  }

  // Personal pronouns
  const { firstPerson, secondPerson } = metrics.formalityIndicators;
  if (secondPerson > firstPerson) {
    parts.push('reader-focused (uses "you" frequently)');
  } else if (firstPerson > secondPerson && firstPerson > 0) {
    parts.push('personal perspective (uses "I/we")');
  }

  // Vocabulary
  if (metrics.vocabularyRichness > 0.6) {
    parts.push('rich vocabulary');
  } else if (metrics.vocabularyRichness < 0.3) {
    parts.push('accessible vocabulary');
  }

  return parts.join(', ') + '.';
}

// ===== Utility Functions =====

function getWords(text: string): string[] {
  return text.match(/\b[a-zA-Z]+\b/g) || [];
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

/**
 * Analyze a URL to extract brand voice
 * This would typically call an AI service in production
 */
export async function analyzeUrlForVoice(url: string): Promise<VoiceAnalysisResult> {
  // In production, this would:
  // 1. Fetch the webpage content
  // 2. Extract text from key areas (about page, blog posts)
  // 3. Use AI to analyze brand voice
  // 4. Return structured voice profile

  // For now, return a mock result
  return {
    success: true,
    voiceProfile: {
      formalityScale: 7,
      description: 'Professional and authoritative with accessible language',
      signaturePhrases: [],
      transitionWords: ['however', 'therefore', 'additionally'],
      phrasesToAvoid: [],
    },
  };
}

export default {
  analyzeVoice,
  analyzeUrlForVoice,
};
