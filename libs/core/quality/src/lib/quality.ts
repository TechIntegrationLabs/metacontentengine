/**
 * Quality Scoring Library
 *
 * Comprehensive content quality analysis including:
 * - Readability metrics (Flesch-Kincaid, Gunning Fog, SMOG)
 * - SEO optimization scoring
 * - AI detection / humanness scoring
 * - Structure analysis
 * - Voice consistency checking
 */

import {
  QualityScore,
  QualityConfig,
  QualityIssue,
  AutoFixSuggestion,
  ReadabilityScore,
  SeoScore,
  HumannessScore,
  StructureScore,
  VoiceScore,
  AiPattern,
  DEFAULT_THRESHOLDS,
} from './types';

export * from './types';

// Common AI-generated text patterns to detect
const AI_PATTERNS = [
  { pattern: /\bdelve\b/gi, severity: 'high' as const },
  { pattern: /\bunpack\b/gi, severity: 'medium' as const },
  { pattern: /\blandscape\b/gi, severity: 'low' as const },
  { pattern: /\bleverage\b/gi, severity: 'low' as const },
  { pattern: /\bin this article\b/gi, severity: 'medium' as const },
  { pattern: /\blet's explore\b/gi, severity: 'high' as const },
  { pattern: /\bit's worth noting\b/gi, severity: 'high' as const },
  { pattern: /\bit's important to note\b/gi, severity: 'high' as const },
  { pattern: /\bIn conclusion\b/gi, severity: 'medium' as const },
  { pattern: /\bIn summary\b/gi, severity: 'medium' as const },
  { pattern: /\bMoreover\b/gi, severity: 'low' as const },
  { pattern: /\bFurthermore\b/gi, severity: 'low' as const },
  { pattern: /\bAdditionally\b/gi, severity: 'low' as const },
  { pattern: /\bNavigating\b/gi, severity: 'medium' as const },
  { pattern: /\bTap into\b/gi, severity: 'medium' as const },
  { pattern: /\bembarking\b/gi, severity: 'high' as const },
  { pattern: /\bjourney\b/gi, severity: 'low' as const },
  { pattern: /\brealm\b/gi, severity: 'medium' as const },
  { pattern: /\bunlock\b/gi, severity: 'medium' as const },
  { pattern: /\bseamlessly\b/gi, severity: 'high' as const },
  { pattern: /\brobust\b/gi, severity: 'medium' as const },
  { pattern: /\bcomprehensive\b/gi, severity: 'low' as const },
  { pattern: /\bholistic\b/gi, severity: 'medium' as const },
  { pattern: /\bsynergy\b/gi, severity: 'high' as const },
  { pattern: /\bparadigm\b/gi, severity: 'high' as const },
  { pattern: /\bspearhead\b/gi, severity: 'high' as const },
  { pattern: /\bpivotal\b/gi, severity: 'medium' as const },
  { pattern: /\bfoster\b/gi, severity: 'medium' as const },
  { pattern: /\bcultivate\b/gi, severity: 'medium' as const },
  { pattern: /\bflourish\b/gi, severity: 'medium' as const },
  { pattern: /\bAs we navigate\b/gi, severity: 'high' as const },
  { pattern: /\bin today's fast-paced\b/gi, severity: 'high' as const },
  { pattern: /\bever-evolving\b/gi, severity: 'high' as const },
  { pattern: /\bdigital age\b/gi, severity: 'medium' as const },
  { pattern: /\bgame-changer\b/gi, severity: 'high' as const },
];

// Complex words (3+ syllables) for readability calculations
const COMPLEX_WORD_REGEX = /\b\w*[aeiouy]{1}\w*[aeiouy]{1}\w*[aeiouy]{1}\w*\b/gi;

/**
 * Main quality scoring function
 */
export function analyzeQuality(content: string, config: QualityConfig = {}): QualityScore {
  const text = stripMarkdown(content);
  const words = getWords(text);
  const sentences = getSentences(text);
  const paragraphs = getParagraphs(content);

  const readability = analyzeReadability(text, words, sentences);
  const seo = analyzeSeo(content, text, config);
  const humanness = analyzeHumanness(text, sentences);
  const structure = analyzeStructure(content, paragraphs);
  const voice = analyzeVoice(text, config.voiceProfile);

  const issues = collectIssues(readability, seo, humanness, structure, voice, config);
  const suggestions = generateAutoFixSuggestions(content, issues);

  // Calculate weighted overall score
  const overall = calculateOverallScore(readability, seo, humanness, structure, voice);

  return {
    overall,
    readability,
    seo,
    humanness,
    structure,
    voice,
    issues,
    suggestions,
  };
}

/**
 * Calculate overall quality score with weights
 */
function calculateOverallScore(
  readability: ReadabilityScore,
  seo: SeoScore,
  humanness: HumannessScore,
  structure: StructureScore,
  voice: VoiceScore
): number {
  const weights = {
    readability: 0.20,
    seo: 0.20,
    humanness: 0.30, // Heavily weighted for AI content
    structure: 0.15,
    voice: 0.15,
  };

  return Math.round(
    readability.score * weights.readability +
    seo.score * weights.seo +
    humanness.score * weights.humanness +
    structure.score * weights.structure +
    voice.score * weights.voice
  );
}

/**
 * Analyze readability metrics
 */
function analyzeReadability(text: string, words: string[], sentences: string[]): ReadabilityScore {
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const syllableCount = countSyllables(words);
  const complexWords = words.filter(w => countWordSyllables(w) >= 3);

  const avgSentenceLength = wordCount / sentenceCount;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
  const complexWordPercentage = (complexWords.length / wordCount) * 100;

  // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const fleschReadingEase = Math.max(0, Math.min(100,
    206.835 - 1.015 * avgSentenceLength - 84.6 * (syllableCount / wordCount)
  ));

  // Flesch-Kincaid Grade Level: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const fleschKincaid = Math.max(0,
    0.39 * avgSentenceLength + 11.8 * (syllableCount / wordCount) - 15.59
  );

  // Gunning Fog Index: 0.4 * ((words/sentences) + 100 * (complex words/words))
  const gunningFog = 0.4 * (avgSentenceLength + complexWordPercentage);

  // SMOG Index: 1.0430 * sqrt(complex words * (30/sentences)) + 3.1291
  const smog = 1.0430 * Math.sqrt(complexWords.length * (30 / sentenceCount)) + 3.1291;

  // Detect passive voice
  const passiveVoiceCount = countPassiveVoice(text);
  const passiveVoicePercentage = (passiveVoiceCount / sentenceCount) * 100;

  // Score based on optimal readability (grade 8-10)
  const targetGrade = 9;
  const gradeDeviation = Math.abs(fleschKincaid - targetGrade);
  const readabilityScore = Math.max(0, 100 - gradeDeviation * 10);

  return {
    score: Math.round(readabilityScore),
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    fleschReadingEase: Math.round(fleschReadingEase),
    gunningFog: Math.round(gunningFog * 10) / 10,
    smog: Math.round(smog * 10) / 10,
    averageSentenceLength: Math.round(avgSentenceLength),
    averageWordLength: Math.round(avgWordLength * 10) / 10,
    complexWordPercentage: Math.round(complexWordPercentage),
    passiveVoicePercentage: Math.round(passiveVoicePercentage),
  };
}

/**
 * Analyze SEO factors
 */
function analyzeSeo(markdown: string, text: string, config: QualityConfig): SeoScore {
  const { primaryKeyword = '', secondaryKeywords = [] } = config;
  const words = getWords(text);
  const wordCount = words.length;

  // Keyword density
  const keywordCount = primaryKeyword
    ? (text.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length
    : 0;
  const keywordDensity = primaryKeyword ? (keywordCount / wordCount) * 100 : 0;

  // Extract title from markdown
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract first paragraph
  const paragraphs = getParagraphs(markdown);
  const firstParagraph = paragraphs[0] || '';

  // Extract headings
  const headings = markdown.match(/^##?\s+.+$/gm) || [];

  // Check keyword placement
  const keywordInTitle = primaryKeyword
    ? title.toLowerCase().includes(primaryKeyword.toLowerCase())
    : true;
  const keywordInFirstParagraph = primaryKeyword
    ? firstParagraph.toLowerCase().includes(primaryKeyword.toLowerCase())
    : true;
  const keywordInHeadings = primaryKeyword
    ? headings.some(h => h.toLowerCase().includes(primaryKeyword.toLowerCase()))
    : true;

  // Check heading structure (H1 should come before H2, etc.)
  const headingLevels = headings.map(h => h.match(/^#+/)?.[0].length || 0);
  const headingStructure = isHeadingStructureValid(headingLevels);

  // Count links
  const internalLinks = (markdown.match(/\[.+?\]\(\/[^)]+\)/g) || []).length;
  const externalLinks = (markdown.match(/\[.+?\]\(https?:\/\/[^)]+\)/g) || []).length;

  // Check image alt tags
  const images = markdown.match(/!\[.*?\]\(.+?\)/g) || [];
  const imagesWithAlt = images.filter(img => !img.startsWith('![]'));
  const imageAltTags = images.length === 0 || imagesWithAlt.length === images.length;

  // Calculate score
  let score = 50; // Base score

  if (keywordInTitle) score += 10;
  if (keywordInFirstParagraph) score += 10;
  if (keywordInHeadings) score += 5;
  if (headingStructure) score += 10;
  if (imageAltTags) score += 5;

  // Keyword density (optimal 1-3%)
  if (keywordDensity >= 1 && keywordDensity <= 3) score += 10;
  else if (keywordDensity > 3) score -= 10; // Keyword stuffing

  // Content length bonus
  if (wordCount >= 1500) score += 10;
  else if (wordCount >= 1000) score += 5;

  // Link bonus
  if (internalLinks >= 3) score += 5;
  if (externalLinks >= 1) score += 5;

  return {
    score: Math.max(0, Math.min(100, score)),
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInTitle,
    keywordInFirstParagraph,
    keywordInHeadings,
    headingStructure,
    metaTitleLength: title.length,
    metaDescriptionLength: 0, // Would need meta description input
    internalLinks,
    externalLinks,
    imageAltTags,
    contentLength: wordCount,
  };
}

/**
 * Analyze humanness / AI detection
 */
function analyzeHumanness(text: string, sentences: string[]): HumannessScore {
  const aiPatterns: AiPattern[] = [];

  // Check for AI patterns
  for (const { pattern, severity } of AI_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      aiPatterns.push({
        pattern: pattern.source,
        count: matches.length,
        severity,
        locations: matches.map(m => m.index || 0),
      });
    }
  }

  // Calculate sentence variety (standard deviation of sentence lengths)
  const sentenceLengths = sentences.map(s => getWords(s).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);
  const sentenceVariety = Math.min(100, stdDev * 10); // Higher variety is better

  // Count personal pronouns (more = more human)
  const personalPronouns = (text.match(/\b(I|me|my|we|us|our|you|your)\b/gi) || []).length;

  // Count contractions (more = more human)
  const contractions = (text.match(/\b\w+'(t|s|re|ve|ll|d|m)\b/gi) || []).length;

  // Count idioms/colloquialisms (more = more human)
  const idiomPatterns = [
    /\bat the end of the day\b/gi,
    /\bhit the ground running\b/gi,
    /\bpiece of cake\b/gi,
    /\bfood for thought\b/gi,
    /\bbreak a leg\b/gi,
    /\bno brainer\b/gi,
    /\bball park\b/gi,
    /\bin a nutshell\b/gi,
  ];
  const idiomCount = idiomPatterns.reduce((sum, p) => sum + (text.match(p) || []).length, 0);

  // Measure transition word variety
  const transitionWords = text.match(/\b(however|therefore|meanwhile|although|besides|consequently|furthermore|nevertheless|otherwise|similarly|likewise|specifically|initially|finally|ultimately|notably)\b/gi) || [];
  const uniqueTransitions = new Set(transitionWords.map(t => t.toLowerCase()));
  const transitionVariety = transitionWords.length > 0
    ? (uniqueTransitions.size / transitionWords.length) * 100
    : 50;

  // Check for repetitive phrases
  const phrases = extractPhrases(text, 3); // 3-word phrases
  const repetitivePhrasesCount = Object.values(phrases).filter(count => count > 2).length;

  // Calculate predictability (based on AI patterns and repetition)
  const aiPatternPenalty = aiPatterns.reduce((sum, p) => {
    const severityWeight = p.severity === 'high' ? 3 : p.severity === 'medium' ? 2 : 1;
    return sum + p.count * severityWeight;
  }, 0);
  const predictability = Math.min(100, aiPatternPenalty * 5 + repetitivePhrasesCount * 3);

  // Calculate overall humanness score
  let score = 100;
  score -= aiPatternPenalty * 2; // Penalty for AI patterns
  score -= repetitivePhrasesCount * 2; // Penalty for repetition
  score -= Math.max(0, 50 - sentenceVariety); // Penalty for low variety
  score += Math.min(20, personalPronouns * 2); // Bonus for personal pronouns
  score += Math.min(10, contractions * 2); // Bonus for contractions
  score += Math.min(10, idiomCount * 5); // Bonus for idioms

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    aiPatterns,
    repetitivePhrasesCount,
    sentenceVariety: Math.round(sentenceVariety),
    personalPronouns,
    contractions,
    idiomCount,
    transitionVariety: Math.round(transitionVariety),
    predictability: Math.round(predictability),
  };
}

/**
 * Analyze content structure
 */
function analyzeStructure(markdown: string, paragraphs: string[]): StructureScore {
  const headings = markdown.match(/^#{1,6}\s+.+$/gm) || [];
  const bulletLists = markdown.match(/^[\s]*[-*]\s+.+$/gm) || [];
  const numberedLists = markdown.match(/^[\s]*\d+\.\s+.+$/gm) || [];

  const h1Count = (markdown.match(/^#\s+.+$/gm) || []).length;
  const h2Count = (markdown.match(/^##\s+.+$/gm) || []).length;

  // Check for intro (first substantial paragraph)
  const hasIntroduction = paragraphs.length > 0 && getWords(paragraphs[0]).length >= 50;

  // Check for conclusion (last paragraph with conclusion indicators)
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  const hasConclusion = /\b(conclusion|summary|final|closing|wrap|takeaway)\b/i.test(lastParagraph) ||
    getWords(lastParagraph).length >= 50;

  // Calculate paragraph balance
  const paragraphLengths = paragraphs.map(p => getWords(p).length).filter(l => l > 10);
  const avgParagraphLength = paragraphLengths.length > 0
    ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
    : 0;

  // Section balance (how evenly distributed are h2 sections)
  const sectionSizes: number[] = [];
  let currentSectionSize = 0;
  for (const line of markdown.split('\n')) {
    if (/^##\s+/.test(line) && currentSectionSize > 0) {
      sectionSizes.push(currentSectionSize);
      currentSectionSize = 0;
    }
    currentSectionSize += getWords(line).length;
  }
  if (currentSectionSize > 0) sectionSizes.push(currentSectionSize);

  const avgSectionSize = sectionSizes.length > 0
    ? sectionSizes.reduce((a, b) => a + b, 0) / sectionSizes.length
    : 0;
  const sectionVariance = sectionSizes.length > 0
    ? sectionSizes.reduce((sum, size) => sum + Math.pow(size - avgSectionSize, 2), 0) / sectionSizes.length
    : 0;
  const sectionBalance = avgSectionSize > 0
    ? Math.max(0, 100 - (Math.sqrt(sectionVariance) / avgSectionSize) * 50)
    : 50;

  // Check for TOC
  const hasToc = /\b(table of contents|contents|toc)\b/i.test(markdown) ||
    markdown.includes('- [') && markdown.includes('](#');

  // Calculate score
  let score = 50;
  if (hasIntroduction) score += 10;
  if (hasConclusion) score += 10;
  if (h1Count === 1) score += 5;
  if (h2Count >= 3) score += 10;
  if (bulletLists.length > 0) score += 5;
  if (numberedLists.length > 0) score += 5;
  if (sectionBalance > 70) score += 5;
  if (avgParagraphLength >= 50 && avgParagraphLength <= 150) score += 5;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    hasIntroduction,
    hasConclusion,
    headingCount: headings.length,
    paragraphCount: paragraphs.length,
    averageParagraphLength: Math.round(avgParagraphLength),
    bulletListCount: bulletLists.length,
    numberedListCount: numberedLists.length,
    hasToc,
    sectionBalance: Math.round(sectionBalance),
  };
}

/**
 * Analyze voice consistency
 */
function analyzeVoice(text: string, voiceProfile?: QualityConfig['voiceProfile']): VoiceScore {
  if (!voiceProfile) {
    return {
      score: 75, // Default neutral score
      formalityMatch: 75,
      signaturePhrasesUsed: 0,
      phrasesToAvoidFound: [],
      toneConsistency: 75,
      styleProxyMatch: 0,
    };
  }

  // Check signature phrases
  const signaturePhrasesUsed = voiceProfile.signaturePhrases.filter(
    phrase => text.toLowerCase().includes(phrase.toLowerCase())
  ).length;

  // Check phrases to avoid
  const phrasesToAvoidFound = voiceProfile.phrasesToAvoid.filter(
    phrase => text.toLowerCase().includes(phrase.toLowerCase())
  );

  // Estimate formality level of text
  const formalIndicators = (text.match(/\b(therefore|consequently|furthermore|whereas|hereby|henceforth)\b/gi) || []).length;
  const casualIndicators = (text.match(/\b(gonna|wanna|gotta|kinda|sorta|ya|yeah|nope)\b/gi) || []).length;
  const contractionCount = (text.match(/\b\w+'(t|s|re|ve|ll|d|m)\b/gi) || []).length;

  const wordCount = getWords(text).length;
  const formalityScore = 5 +
    (formalIndicators / wordCount) * 500 -
    (casualIndicators / wordCount) * 500 -
    (contractionCount / wordCount) * 100;
  const estimatedFormality = Math.max(1, Math.min(10, Math.round(formalityScore)));

  // Calculate formality match
  const formalityDiff = Math.abs(estimatedFormality - voiceProfile.formalityScale);
  const formalityMatch = Math.max(0, 100 - formalityDiff * 15);

  // Tone consistency (simplified: check for sudden formality shifts)
  const sentences = getSentences(text);
  const toneShifts = countToneShifts(sentences);
  const toneConsistency = Math.max(0, 100 - toneShifts * 10);

  // Calculate overall voice score
  let score = 50;
  score += formalityMatch * 0.3;
  score += Math.min(20, signaturePhrasesUsed * 5); // Bonus for signature phrases
  score -= phrasesToAvoidFound.length * 10; // Penalty for avoided phrases
  score += toneConsistency * 0.2;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    formalityMatch: Math.round(formalityMatch),
    signaturePhrasesUsed,
    phrasesToAvoidFound,
    toneConsistency: Math.round(toneConsistency),
    styleProxyMatch: 0, // Would need more sophisticated analysis
  };
}

/**
 * Collect all issues from sub-scores
 */
function collectIssues(
  readability: ReadabilityScore,
  seo: SeoScore,
  humanness: HumannessScore,
  structure: StructureScore,
  voice: VoiceScore,
  config: QualityConfig
): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // Readability issues
  if (readability.fleschKincaid > 12) {
    issues.push({
      type: 'readability',
      severity: 'warning',
      message: `Content reading level (grade ${readability.fleschKincaid}) is too high for general audiences`,
      suggestion: 'Simplify sentences and use shorter words',
      autoFixable: false,
    });
  }

  if (readability.passiveVoicePercentage > 20) {
    issues.push({
      type: 'passive_voice',
      severity: 'warning',
      message: `${readability.passiveVoicePercentage}% of sentences use passive voice`,
      suggestion: 'Rewrite passive sentences in active voice',
      autoFixable: true,
    });
  }

  if (readability.averageSentenceLength > 25) {
    issues.push({
      type: 'sentence_length',
      severity: 'warning',
      message: `Average sentence length (${readability.averageSentenceLength} words) is too long`,
      suggestion: 'Break long sentences into shorter ones',
      autoFixable: false,
    });
  }

  // SEO issues
  if (!seo.keywordInTitle && config.primaryKeyword) {
    issues.push({
      type: 'seo',
      severity: 'error',
      message: 'Primary keyword not found in title',
      suggestion: `Add "${config.primaryKeyword}" to your title`,
      autoFixable: false,
    });
  }

  if (!seo.keywordInFirstParagraph && config.primaryKeyword) {
    issues.push({
      type: 'seo',
      severity: 'warning',
      message: 'Primary keyword not found in first paragraph',
      suggestion: `Include "${config.primaryKeyword}" in your introduction`,
      autoFixable: false,
    });
  }

  if (seo.keywordDensity > 3) {
    issues.push({
      type: 'keyword_stuffing',
      severity: 'error',
      message: `Keyword density (${seo.keywordDensity}%) is too high`,
      suggestion: 'Reduce keyword usage to 1-2%',
      autoFixable: false,
    });
  }

  if (!seo.headingStructure) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: 'Heading hierarchy is not properly structured',
      suggestion: 'Use H1 for title, H2 for main sections, H3 for subsections',
      autoFixable: false,
    });
  }

  // Humanness issues
  for (const pattern of humanness.aiPatterns) {
    if (pattern.severity === 'high') {
      issues.push({
        type: 'ai_detected',
        severity: 'error',
        message: `AI-typical phrase detected: "${pattern.pattern}" (${pattern.count} times)`,
        suggestion: 'Replace with more natural phrasing',
        autoFixable: true,
      });
    }
  }

  if (humanness.repetitivePhrasesCount > 3) {
    issues.push({
      type: 'repetition',
      severity: 'warning',
      message: `${humanness.repetitivePhrasesCount} phrases are repeated too often`,
      suggestion: 'Vary your phrasing to avoid repetition',
      autoFixable: false,
    });
  }

  if (humanness.sentenceVariety < 30) {
    issues.push({
      type: 'ai_detected',
      severity: 'warning',
      message: 'Sentence lengths are too uniform (AI pattern)',
      suggestion: 'Mix short and long sentences for natural flow',
      autoFixable: false,
    });
  }

  // Structure issues
  if (!structure.hasIntroduction) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: 'Article lacks a clear introduction',
      suggestion: 'Add an engaging opening paragraph',
      autoFixable: false,
    });
  }

  if (!structure.hasConclusion) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: 'Article lacks a clear conclusion',
      suggestion: 'Add a summary or call-to-action at the end',
      autoFixable: false,
    });
  }

  // Voice issues
  if (voice.phrasesToAvoidFound.length > 0) {
    issues.push({
      type: 'banned_phrase',
      severity: 'error',
      message: `Banned phrases found: ${voice.phrasesToAvoidFound.join(', ')}`,
      suggestion: 'Remove or replace these phrases',
      autoFixable: true,
    });
  }

  if (voice.formalityMatch < 50) {
    issues.push({
      type: 'voice',
      severity: 'warning',
      message: 'Content formality does not match voice profile',
      suggestion: 'Adjust tone to match target formality level',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Generate auto-fix suggestions for fixable issues
 */
function generateAutoFixSuggestions(content: string, issues: QualityIssue[]): AutoFixSuggestion[] {
  const suggestions: AutoFixSuggestion[] = [];

  // AI pattern replacements
  const aiReplacements: Record<string, string[]> = {
    'delve': ['explore', 'examine', 'look at', 'dig into'],
    'unpack': ['explain', 'break down', 'analyze'],
    'leverage': ['use', 'utilize', 'take advantage of'],
    'landscape': ['field', 'area', 'space', 'industry'],
    'journey': ['process', 'experience', 'path'],
    'seamlessly': ['smoothly', 'easily', 'naturally'],
    'robust': ['strong', 'solid', 'reliable'],
    'holistic': ['complete', 'comprehensive', 'full'],
    'synergy': ['cooperation', 'collaboration', 'teamwork'],
    'paradigm': ['model', 'approach', 'framework'],
    'pivotal': ['crucial', 'key', 'important'],
    'foster': ['encourage', 'support', 'promote'],
    'cultivate': ['develop', 'grow', 'build'],
  };

  for (const [pattern, replacements] of Object.entries(aiReplacements)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      suggestions.push({
        issueType: 'ai_detected',
        original: match[0],
        replacement: replacements[0],
        location: {
          start: match.index,
          end: match.index + match[0].length,
        },
        confidence: 80,
        explanation: `"${pattern}" is commonly used in AI-generated text. Consider using "${replacements[0]}" instead.`,
      });
    }
  }

  return suggestions;
}

// ===== Utility Functions =====

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/^[-*]\s+/gm, '') // Lists
    .replace(/^\d+\.\s+/gm, '') // Numbered lists
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/---+/g, '') // Horizontal rules
    .replace(/!\[.*?\]\(.+?\)/g, '') // Images
    .trim();
}

function getWords(text: string): string[] {
  return text.match(/\b[a-zA-Z]+\b/g) || [];
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

function countSyllables(words: string[]): number {
  return words.reduce((sum, word) => sum + countWordSyllables(word), 0);
}

function countWordSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function countPassiveVoice(text: string): number {
  // Simplified passive voice detection
  const passivePatterns = [
    /\b(was|were|is|are|been|being|be)\s+\w+ed\b/gi,
    /\b(was|were|is|are|been|being|be)\s+\w+en\b/gi,
  ];

  let count = 0;
  for (const pattern of passivePatterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

function isHeadingStructureValid(levels: number[]): boolean {
  if (levels.length === 0) return true;

  let lastLevel = 0;
  for (const level of levels) {
    if (level > lastLevel + 1) return false; // Skipped a level
    lastLevel = level;
  }
  return true;
}

function extractPhrases(text: string, length: number): Record<string, number> {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: Record<string, number> = {};

  for (let i = 0; i <= words.length - length; i++) {
    const phrase = words.slice(i, i + length).join(' ');
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }

  return phrases;
}

function countToneShifts(sentences: string[]): number {
  // Simplified tone shift detection
  let shifts = 0;
  let lastTone: 'formal' | 'casual' | 'neutral' = 'neutral';

  for (const sentence of sentences) {
    const formalIndicators = (sentence.match(/\b(therefore|consequently|furthermore|whereas|hereby)\b/gi) || []).length;
    const casualIndicators = (sentence.match(/\b(gonna|wanna|gotta|kinda|ya|yeah)\b/gi) || []).length;

    let currentTone: 'formal' | 'casual' | 'neutral' = 'neutral';
    if (formalIndicators > 0) currentTone = 'formal';
    if (casualIndicators > 0) currentTone = 'casual';

    if (lastTone !== 'neutral' && currentTone !== 'neutral' && lastTone !== currentTone) {
      shifts++;
    }

    if (currentTone !== 'neutral') lastTone = currentTone;
  }

  return shifts;
}

/**
 * Quick quality check that returns pass/fail
 */
export function quickQualityCheck(content: string, config: QualityConfig = {}): {
  passes: boolean;
  score: number;
  criticalIssues: QualityIssue[];
} {
  const result = analyzeQuality(content, config);
  const criticalIssues = result.issues.filter(i => i.severity === 'error');

  return {
    passes: result.overall >= DEFAULT_THRESHOLDS.acceptable && criticalIssues.length === 0,
    score: result.overall,
    criticalIssues,
  };
}

/**
 * Apply auto-fixes to content
 */
export function applyAutoFixes(content: string, suggestions: AutoFixSuggestion[]): string {
  // Sort by location descending to avoid offset issues
  const sorted = [...suggestions].sort((a, b) => b.location.start - a.location.start);

  let result = content;
  for (const suggestion of sorted) {
    if (suggestion.confidence >= 70) {
      result =
        result.slice(0, suggestion.location.start) +
        suggestion.replacement +
        result.slice(suggestion.location.end);
    }
  }

  return result;
}
