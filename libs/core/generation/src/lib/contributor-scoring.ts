/**
 * Contributor Scoring Service
 *
 * Calculates performance scores for AI contributor personas based on
 * article quality, publication success, revision rates, and engagement.
 */

import type { ContributorStats, ContributorPerformance } from '@content-engine/types';

// ============================================
// Types
// ============================================

export interface Article {
  id: string;
  contributorId: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  qualityScore?: number;
  wordCount?: number;
  categories?: string[];
  topics?: string[];
  revisionCount: number;
  publishedAt?: string;
  createdAt: string;
}

export interface ScoringWeights {
  qualityScore: number;
  publicationSuccessRate: number;
  revisionRate: number;
  engagement: number;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  minArticlesForRanking: number;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  qualityScore: 0.4, // 40% - Most important
  publicationSuccessRate: 0.3, // 30%
  revisionRate: 0.2, // 20%
  engagement: 0.1, // 10% - Future feature
};

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: DEFAULT_SCORING_WEIGHTS,
  minArticlesForRanking: 3,
};

// ============================================
// Scoring Service
// ============================================

export class ContributorScoringService {
  private config: ScoringConfig;

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = {
      ...DEFAULT_SCORING_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_SCORING_WEIGHTS,
        ...config.weights,
      },
    };
  }

  /**
   * Calculate contributor statistics from articles
   */
  calculateStats(contributorId: string, articles: Article[]): ContributorStats {
    const contributorArticles = articles.filter((a) => a.contributorId === contributorId);

    if (contributorArticles.length === 0) {
      return {
        contributorId,
        totalArticles: 0,
        averageQualityScore: 0,
        averageWordCount: 0,
        publicationSuccessRate: 0,
        revisionRate: 0,
        topTopics: [],
        lastArticleDate: null,
        performanceScore: 0,
      };
    }

    // Calculate metrics
    const totalArticles = contributorArticles.length;
    const publishedArticles = contributorArticles.filter((a) => a.status === 'published');
    const articlesWithQuality = contributorArticles.filter((a) => a.qualityScore !== undefined);
    const articlesWithWordCount = contributorArticles.filter((a) => a.wordCount !== undefined);

    // Average quality score
    const averageQualityScore =
      articlesWithQuality.length > 0
        ? articlesWithQuality.reduce((sum, a) => sum + (a.qualityScore || 0), 0) /
          articlesWithQuality.length
        : 0;

    // Average word count
    const averageWordCount =
      articlesWithWordCount.length > 0
        ? Math.round(
            articlesWithWordCount.reduce((sum, a) => sum + (a.wordCount || 0), 0) /
              articlesWithWordCount.length
          )
        : 0;

    // Publication success rate (published / total)
    const publicationSuccessRate = (publishedArticles.length / totalArticles) * 100;

    // Revision rate (average revisions per article)
    const totalRevisions = contributorArticles.reduce((sum, a) => sum + a.revisionCount, 0);
    const revisionRate = totalRevisions / totalArticles;

    // Top topics
    const topicsMap = new Map<string, number>();
    contributorArticles.forEach((article) => {
      (article.topics || []).forEach((topic) => {
        topicsMap.set(topic, (topicsMap.get(topic) || 0) + 1);
      });
    });

    const topTopics = Array.from(topicsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    // Last article date
    const sortedByDate = [...contributorArticles].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastArticleDate = sortedByDate[0]?.createdAt || null;

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore({
      averageQualityScore,
      publicationSuccessRate,
      revisionRate,
      totalArticles,
    });

    return {
      contributorId,
      totalArticles,
      averageQualityScore,
      averageWordCount,
      publicationSuccessRate,
      revisionRate,
      topTopics,
      lastArticleDate,
      performanceScore,
    };
  }

  /**
   * Calculate performance score (0-100) based on weighted metrics
   */
  private calculatePerformanceScore(metrics: {
    averageQualityScore: number;
    publicationSuccessRate: number;
    revisionRate: number;
    totalArticles: number;
  }): number {
    const { averageQualityScore, publicationSuccessRate, revisionRate } = metrics;
    const weights = this.config.weights;

    // Normalize quality score (already 0-100)
    const qualityComponent = averageQualityScore * weights.qualityScore;

    // Normalize publication success rate (already 0-100)
    const publicationComponent = publicationSuccessRate * weights.publicationSuccessRate;

    // Normalize revision rate (fewer revisions = better)
    // 0 revisions = 100, 3+ revisions = 0
    const maxRevisions = 3;
    const revisionScore = Math.max(0, 100 - (revisionRate / maxRevisions) * 100);
    const revisionComponent = revisionScore * weights.revisionRate;

    // Engagement component (placeholder for future)
    const engagementComponent = 50 * weights.engagement; // Default to 50/100

    // Calculate total score
    const totalScore = qualityComponent + publicationComponent + revisionComponent + engagementComponent;

    // Apply a small penalty for low article count (minimum 3 articles for full score)
    const articleCountFactor = Math.min(1, metrics.totalArticles / this.config.minArticlesForRanking);

    return Math.round(totalScore * articleCountFactor);
  }

  /**
   * Rank contributors by performance score
   */
  rankContributors(stats: ContributorStats[]): ContributorStats[] {
    const sorted = [...stats].sort((a, b) => b.performanceScore - a.performanceScore);

    return sorted.map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }));
  }

  /**
   * Calculate performance over different time periods
   */
  calculatePerformance(
    contributorId: string,
    articles: Article[],
    period: 'week' | 'month' | 'quarter' | 'all'
  ): ContributorPerformance {
    const now = new Date();
    const cutoffDate = this.getPeriodCutoff(now, period);

    const contributorArticles = articles.filter((a) => a.contributorId === contributorId);

    // Filter articles for current period
    const currentPeriodArticles = contributorArticles.filter(
      (a) => new Date(a.createdAt) >= cutoffDate
    );

    // Filter articles for previous period (for trend calculation)
    const previousCutoff = this.getPeriodCutoff(cutoffDate, period);
    const previousPeriodArticles = contributorArticles.filter(
      (a) => new Date(a.createdAt) >= previousCutoff && new Date(a.createdAt) < cutoffDate
    );

    // Calculate metrics for current period
    const currentPublished = currentPeriodArticles.filter((a) => a.status === 'published').length;
    const currentQuality =
      currentPeriodArticles.length > 0
        ? currentPeriodArticles.reduce((sum, a) => sum + (a.qualityScore || 0), 0) /
          currentPeriodArticles.length
        : 0;

    // Calculate metrics for previous period
    const previousQuality =
      previousPeriodArticles.length > 0
        ? previousPeriodArticles.reduce((sum, a) => sum + (a.qualityScore || 0), 0) /
          previousPeriodArticles.length
        : 0;

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (previousPeriodArticles.length > 0) {
      const qualityDiff = currentQuality - previousQuality;
      if (qualityDiff > 5) trend = 'up';
      else if (qualityDiff < -5) trend = 'down';
    }

    return {
      period,
      articlesPublished: currentPublished,
      averageQuality: Math.round(currentQuality),
      trend,
    };
  }

  /**
   * Get cutoff date for a given period
   */
  private getPeriodCutoff(fromDate: Date, period: 'week' | 'month' | 'quarter' | 'all'): Date {
    const cutoff = new Date(fromDate);

    switch (period) {
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case 'quarter':
        cutoff.setMonth(cutoff.getMonth() - 3);
        break;
      case 'all':
        cutoff.setFullYear(2000); // Far past
        break;
    }

    return cutoff;
  }

  /**
   * Get performance score color class
   */
  getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }

  /**
   * Get performance score background color
   */
  getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-emerald-500/10';
    if (score >= 60) return 'bg-amber-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  }

  /**
   * Get performance score border color
   */
  getScoreBorderColor(score: number): string {
    if (score >= 80) return 'border-emerald-500/20';
    if (score >= 60) return 'border-amber-500/20';
    if (score >= 40) return 'border-orange-500/20';
    return 'border-red-500/20';
  }

  /**
   * Get performance tier label
   */
  getPerformanceTier(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  /**
   * Format revision rate for display
   */
  formatRevisionRate(rate: number): string {
    if (rate === 0) return 'No revisions';
    if (rate < 1) return `${rate.toFixed(1)} avg`;
    return `${Math.round(rate)} avg`;
  }

  /**
   * Format time since last article
   */
  formatTimeSince(dateString: string | null): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultService: ContributorScoringService | null = null;

export function getScoringService(config?: Partial<ScoringConfig>): ContributorScoringService {
  if (!defaultService || config) {
    defaultService = new ContributorScoringService(config);
  }
  return defaultService;
}

export function createScoringService(config?: Partial<ScoringConfig>): ContributorScoringService {
  return new ContributorScoringService(config);
}

export default ContributorScoringService;
