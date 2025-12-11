/**
 * Risk Assessment Service
 *
 * Comprehensive risk scoring for content before publishing.
 * Integrates quality scores, compliance checks, and structural analysis.
 *
 * Risk Levels:
 * - LOW: 0-25 (Green - Auto-publish eligible)
 * - MEDIUM: 26-50 (Yellow - Review recommended)
 * - HIGH: 51-75 (Orange - Manual review required)
 * - CRITICAL: 76-100 (Red - Cannot publish)
 */

import { QualityScore, QualityIssue, DEFAULT_THRESHOLDS } from './types';
import { analyzeQuality, QualityConfig } from './quality';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactors {
  /** AI detection risk (0-40) - Based on humanness score */
  aiDetectionRisk: number;
  /** Compliance violations (0-30) - Based on blocked links, banned phrases */
  complianceViolations: number;
  /** Quality deficits (0-20) - Below threshold scores */
  qualityDeficits: number;
  /** Structural issues (0-10) - Missing sections, bad heading hierarchy */
  structuralIssues: number;
}

export interface RiskAssessment {
  /** Overall risk level */
  level: RiskLevel;
  /** Risk score 0-100 (higher = more risky) */
  score: number;
  /** Breakdown of risk factors */
  factors: RiskFactors;
  /** Issues that MUST be resolved before publishing */
  blockingIssues: BlockingIssue[];
  /** Whether eligible for auto-publish */
  autoPublishEligible: boolean;
  /** Recommendations for improving the score */
  recommendations: RiskRecommendation[];
  /** Detailed analysis */
  analysis: RiskAnalysis;
}

export interface BlockingIssue {
  id: string;
  category: 'ai_detection' | 'compliance' | 'quality' | 'structure';
  severity: 'error' | 'critical';
  message: string;
  resolution: string;
}

export interface RiskRecommendation {
  priority: 'high' | 'medium' | 'low';
  factor: keyof RiskFactors;
  message: string;
  expectedImprovement: number;
}

export interface RiskAnalysis {
  /** Quality scores used in assessment */
  qualityScores: {
    overall: number;
    readability: number;
    seo: number;
    humanness: number;
    structure: number;
    voice: number;
  };
  /** Number of issues by severity */
  issueCounts: {
    errors: number;
    warnings: number;
    info: number;
  };
  /** Compliance check results */
  compliance: {
    blockedLinksFound: number;
    bannedPhrasesFound: number;
    eduLinksFound: number;
  };
  /** Word count and length metrics */
  metrics: {
    wordCount: number;
    internalLinks: number;
    externalLinks: number;
  };
}

export interface RiskConfig {
  /** Threshold for auto-publish eligibility (default: 30) */
  autoPublishThreshold?: number;
  /** Quality score thresholds */
  qualityThresholds?: {
    minimum?: number;
    acceptable?: number;
  };
  /** AI detection threshold (humanness score below this is high risk) */
  aiDetectionThreshold?: number;
  /** Blocked domains list */
  blockedDomains?: string[];
  /** Additional banned phrases */
  bannedPhrases?: string[];
  /** Whether .edu links are blocked */
  blockEduLinks?: boolean;
}

const DEFAULT_RISK_CONFIG: Required<RiskConfig> = {
  autoPublishThreshold: 30,
  qualityThresholds: {
    minimum: 60,
    acceptable: 70,
  },
  aiDetectionThreshold: 25,
  blockedDomains: [],
  bannedPhrases: [],
  blockEduLinks: true,
};

/**
 * Assess risk for content before publishing
 */
export function assessRisk(
  content: string,
  qualityConfig: QualityConfig = {},
  riskConfig: RiskConfig = {}
): RiskAssessment {
  const config = { ...DEFAULT_RISK_CONFIG, ...riskConfig };

  // Get quality analysis
  const quality = analyzeQuality(content, qualityConfig);

  // Calculate risk factors
  const factors = calculateRiskFactors(content, quality, config);

  // Calculate overall score
  const score = Math.min(100, Math.max(0,
    factors.aiDetectionRisk +
    factors.complianceViolations +
    factors.qualityDeficits +
    factors.structuralIssues
  ));

  // Determine risk level
  const level = getRiskLevel(score);

  // Identify blocking issues
  const blockingIssues = identifyBlockingIssues(content, quality, config);

  // Generate recommendations
  const recommendations = generateRecommendations(factors, quality);

  // Build analysis
  const analysis = buildAnalysis(content, quality, config);

  // Determine auto-publish eligibility
  const autoPublishEligible =
    score <= config.autoPublishThreshold &&
    blockingIssues.length === 0;

  return {
    level,
    score,
    factors,
    blockingIssues,
    autoPublishEligible,
    recommendations,
    analysis,
  };
}

/**
 * Calculate individual risk factors
 */
function calculateRiskFactors(
  content: string,
  quality: QualityScore,
  config: Required<RiskConfig>
): RiskFactors {
  // AI Detection Risk (0-40 points)
  // Inverse of humanness score
  const humannessScore = quality.humanness.score;
  let aiDetectionRisk = 0;
  if (humannessScore < config.aiDetectionThreshold) {
    aiDetectionRisk = 40; // Critical - likely to be detected
  } else if (humannessScore < 50) {
    aiDetectionRisk = 30;
  } else if (humannessScore < 70) {
    aiDetectionRisk = 20;
  } else if (humannessScore < 85) {
    aiDetectionRisk = 10;
  }

  // Add penalty for high-severity AI patterns
  const highSeverityPatterns = quality.humanness.aiPatterns.filter(
    p => p.severity === 'high'
  );
  aiDetectionRisk += Math.min(10, highSeverityPatterns.length * 3);

  // Compliance Violations (0-30 points)
  let complianceViolations = 0;

  // Check for blocked domains in links
  const links = content.match(/https?:\/\/[^\s\)\]]+/g) || [];
  for (const link of links) {
    try {
      const url = new URL(link);
      const domain = url.hostname.toLowerCase();

      // Check .edu links
      if (config.blockEduLinks && domain.endsWith('.edu')) {
        complianceViolations += 10;
      }

      // Check blocked domains
      for (const blocked of config.blockedDomains) {
        if (domain === blocked || domain.endsWith(`.${blocked}`)) {
          complianceViolations += 5;
        }
      }
    } catch {
      // Invalid URL - skip
    }
  }

  // Check for banned phrases (from quality analysis)
  complianceViolations += quality.voice.phrasesToAvoidFound.length * 5;

  // Additional banned phrases from config
  for (const phrase of config.bannedPhrases) {
    const regex = new RegExp(phrase, 'gi');
    const matches = content.match(regex);
    if (matches) {
      complianceViolations += matches.length * 3;
    }
  }

  complianceViolations = Math.min(30, complianceViolations);

  // Quality Deficits (0-20 points)
  let qualityDeficits = 0;

  if (quality.overall < (config.qualityThresholds?.minimum ?? 50)) {
    qualityDeficits = 20;
  } else if (quality.overall < (config.qualityThresholds?.acceptable ?? 70)) {
    qualityDeficits = 10;
  }

  // Add penalty for low sub-scores
  if (quality.readability.score < 60) qualityDeficits += 3;
  if (quality.seo.score < 50) qualityDeficits += 3;

  qualityDeficits = Math.min(20, qualityDeficits);

  // Structural Issues (0-10 points)
  let structuralIssues = 0;

  if (!quality.structure.hasIntroduction) structuralIssues += 2;
  if (!quality.structure.hasConclusion) structuralIssues += 2;
  if (quality.structure.headingCount < 3) structuralIssues += 2;
  if (!quality.seo.headingStructure) structuralIssues += 2;
  if (quality.structure.sectionBalance < 50) structuralIssues += 2;

  structuralIssues = Math.min(10, structuralIssues);

  return {
    aiDetectionRisk: Math.round(aiDetectionRisk),
    complianceViolations: Math.round(complianceViolations),
    qualityDeficits: Math.round(qualityDeficits),
    structuralIssues: Math.round(structuralIssues),
  };
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Identify issues that block publishing
 */
function identifyBlockingIssues(
  content: string,
  quality: QualityScore,
  config: Required<RiskConfig>
): BlockingIssue[] {
  const issues: BlockingIssue[] = [];

  // Critical AI detection risk
  if (quality.humanness.score < config.aiDetectionThreshold) {
    issues.push({
      id: 'ai_detection_high',
      category: 'ai_detection',
      severity: 'critical',
      message: `Humanness score (${quality.humanness.score}) is below the acceptable threshold (${config.aiDetectionThreshold})`,
      resolution: 'Run the content through humanization (StealthGPT) before publishing',
    });
  }

  // High-severity AI patterns
  const criticalPatterns = quality.humanness.aiPatterns.filter(
    p => p.severity === 'high' && p.count >= 3
  );
  for (const pattern of criticalPatterns) {
    issues.push({
      id: `ai_pattern_${pattern.pattern}`,
      category: 'ai_detection',
      severity: 'error',
      message: `AI-typical phrase "${pattern.pattern}" appears ${pattern.count} times`,
      resolution: 'Replace these phrases with more natural alternatives',
    });
  }

  // .edu links
  if (config.blockEduLinks) {
    const eduLinks = content.match(/https?:\/\/[^\s\)\]]*\.edu[^\s\)\]]*/gi) || [];
    if (eduLinks.length > 0) {
      issues.push({
        id: 'edu_links_found',
        category: 'compliance',
        severity: 'critical',
        message: `Found ${eduLinks.length} .edu link(s) which are not allowed`,
        resolution: 'Remove or replace all .edu links with approved sources',
      });
    }
  }

  // Blocked domains
  const links = content.match(/https?:\/\/[^\s\)\]]+/g) || [];
  const blockedFound: string[] = [];
  for (const link of links) {
    try {
      const url = new URL(link);
      const domain = url.hostname.toLowerCase();
      for (const blocked of config.blockedDomains) {
        if (domain === blocked || domain.endsWith(`.${blocked}`)) {
          if (!blockedFound.includes(blocked)) {
            blockedFound.push(blocked);
          }
        }
      }
    } catch {
      // Invalid URL - skip
    }
  }
  if (blockedFound.length > 0) {
    issues.push({
      id: 'blocked_domains_found',
      category: 'compliance',
      severity: 'critical',
      message: `Found links to blocked domains: ${blockedFound.join(', ')}`,
      resolution: 'Remove all links to blocked domains',
    });
  }

  // Quality below minimum
  const minimumThreshold = config.qualityThresholds?.minimum ?? 50;
  if (quality.overall < minimumThreshold) {
    issues.push({
      id: 'quality_below_minimum',
      category: 'quality',
      severity: 'error',
      message: `Quality score (${quality.overall}) is below minimum threshold (${minimumThreshold})`,
      resolution: 'Improve content quality by addressing the identified issues',
    });
  }

  // Banned phrases found
  if (quality.voice.phrasesToAvoidFound.length > 0) {
    issues.push({
      id: 'banned_phrases_found',
      category: 'compliance',
      severity: 'error',
      message: `Found banned phrases: ${quality.voice.phrasesToAvoidFound.join(', ')}`,
      resolution: 'Remove or replace all banned phrases',
    });
  }

  return issues;
}

/**
 * Generate recommendations for improving risk score
 */
function generateRecommendations(
  factors: RiskFactors,
  quality: QualityScore
): RiskRecommendation[] {
  const recommendations: RiskRecommendation[] = [];

  // AI Detection recommendations
  if (factors.aiDetectionRisk > 20) {
    recommendations.push({
      priority: 'high',
      factor: 'aiDetectionRisk',
      message: 'Run content through StealthGPT humanization to reduce AI detection risk',
      expectedImprovement: Math.min(30, factors.aiDetectionRisk),
    });
  }

  if (quality.humanness.aiPatterns.length > 0) {
    recommendations.push({
      priority: factors.aiDetectionRisk > 10 ? 'high' : 'medium',
      factor: 'aiDetectionRisk',
      message: `Replace ${quality.humanness.aiPatterns.length} AI-typical phrases with natural alternatives`,
      expectedImprovement: quality.humanness.aiPatterns.length * 2,
    });
  }

  if (quality.humanness.sentenceVariety < 50) {
    recommendations.push({
      priority: 'medium',
      factor: 'aiDetectionRisk',
      message: 'Vary sentence lengths for more natural flow',
      expectedImprovement: 5,
    });
  }

  // Compliance recommendations
  if (factors.complianceViolations > 0) {
    recommendations.push({
      priority: 'high',
      factor: 'complianceViolations',
      message: 'Remove all blocked domain links and banned phrases',
      expectedImprovement: factors.complianceViolations,
    });
  }

  // Quality recommendations
  if (factors.qualityDeficits > 10) {
    recommendations.push({
      priority: 'high',
      factor: 'qualityDeficits',
      message: 'Improve overall content quality to meet minimum standards',
      expectedImprovement: factors.qualityDeficits,
    });
  }

  if (quality.readability.score < 70) {
    recommendations.push({
      priority: 'medium',
      factor: 'qualityDeficits',
      message: 'Simplify language and sentence structure for better readability',
      expectedImprovement: 5,
    });
  }

  if (quality.seo.score < 60) {
    recommendations.push({
      priority: 'medium',
      factor: 'qualityDeficits',
      message: 'Optimize for SEO by adding keywords and improving structure',
      expectedImprovement: 5,
    });
  }

  // Structure recommendations
  if (factors.structuralIssues > 5) {
    recommendations.push({
      priority: 'medium',
      factor: 'structuralIssues',
      message: 'Add introduction, conclusion, and proper heading hierarchy',
      expectedImprovement: factors.structuralIssues,
    });
  }

  // Sort by priority and expected improvement
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.expectedImprovement - a.expectedImprovement;
  });
}

/**
 * Build detailed analysis object
 */
function buildAnalysis(
  content: string,
  quality: QualityScore,
  config: Required<RiskConfig>
): RiskAnalysis {
  // Count issues by severity
  const issueCounts = quality.issues.reduce(
    (acc, issue) => {
      if (issue.severity === 'error') acc.errors++;
      else if (issue.severity === 'warning') acc.warnings++;
      else acc.info++;
      return acc;
    },
    { errors: 0, warnings: 0, info: 0 }
  );

  // Count compliance issues
  const links = content.match(/https?:\/\/[^\s\)\]]+/g) || [];
  let blockedLinksFound = 0;
  let eduLinksFound = 0;

  for (const link of links) {
    try {
      const url = new URL(link);
      const domain = url.hostname.toLowerCase();

      if (domain.endsWith('.edu')) eduLinksFound++;

      for (const blocked of config.blockedDomains) {
        if (domain === blocked || domain.endsWith(`.${blocked}`)) {
          blockedLinksFound++;
          break;
        }
      }
    } catch {
      // Invalid URL
    }
  }

  return {
    qualityScores: {
      overall: quality.overall,
      readability: quality.readability.score,
      seo: quality.seo.score,
      humanness: quality.humanness.score,
      structure: quality.structure.score,
      voice: quality.voice.score,
    },
    issueCounts,
    compliance: {
      blockedLinksFound,
      bannedPhrasesFound: quality.voice.phrasesToAvoidFound.length,
      eduLinksFound,
    },
    metrics: {
      wordCount: quality.seo.contentLength,
      internalLinks: quality.seo.internalLinks,
      externalLinks: quality.seo.externalLinks,
    },
  };
}

/**
 * Quick risk check that returns pass/fail for auto-publish
 */
export function quickRiskCheck(
  content: string,
  config: RiskConfig = {}
): { eligible: boolean; level: RiskLevel; score: number; blockingCount: number } {
  const assessment = assessRisk(content, {}, config);
  return {
    eligible: assessment.autoPublishEligible,
    level: assessment.level,
    score: assessment.score,
    blockingCount: assessment.blockingIssues.length,
  };
}

/**
 * Get color for risk level (for UI)
 */
export function getRiskLevelColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'LOW':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500',
      };
    case 'CRITICAL':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500',
      };
  }
}

/**
 * Get icon name for risk level (for UI - using Lucide icons)
 */
export function getRiskLevelIcon(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'CheckCircle';
    case 'MEDIUM':
      return 'AlertCircle';
    case 'HIGH':
      return 'AlertTriangle';
    case 'CRITICAL':
      return 'XCircle';
  }
}
