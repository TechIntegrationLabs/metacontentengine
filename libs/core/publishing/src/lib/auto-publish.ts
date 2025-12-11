/**
 * Auto-Publish Scheduling Service
 *
 * Manages scheduled publishing of articles based on risk assessment,
 * quality scores, and tenant configuration. Integrates with WordPress
 * publishing and supports configurable publishing windows.
 */

import type { PublishResult, PublishRequest, WordPressConfig } from './types';

// ============================================
// Types
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PublishLogStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled';

export interface PublishingWindow {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

export interface AutoPublishConfig {
  defaultDaysAfterReady: number;
  requireHumanReview: boolean;
  minimumQualityScore: number;
  maximumRiskLevel: RiskLevel;
  notifyBeforePublish: boolean;
  notifyHoursBeforePublish: number;
  publishingWindows: PublishingWindow[];
  timezone: string;
}

export interface ScheduledArticle {
  id: string;
  articleId: string;
  tenantId: string;
  title: string;
  scheduledFor: Date;
  status: PublishLogStatus;
  qualityScore: number;
  riskLevel: RiskLevel;
  riskScore: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  wpPostId?: number;
  publishedUrl?: string;
  error?: string;
  attempts: number;
  createdAt: Date;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  suggestedPublishDate?: Date;
}

export interface ScheduleResult {
  success: boolean;
  scheduledFor?: Date;
  logId?: string;
  error?: string;
}

export interface ProcessResult {
  success: boolean;
  publishResult?: PublishResult;
  error?: string;
  retryAt?: Date;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_AUTO_PUBLISH_CONFIG: AutoPublishConfig = {
  defaultDaysAfterReady: 3,
  requireHumanReview: true,
  minimumQualityScore: 75,
  maximumRiskLevel: 'LOW',
  notifyBeforePublish: true,
  notifyHoursBeforePublish: 24,
  publishingWindows: [
    { dayOfWeek: 1, startHour: 9, endHour: 17 }, // Monday
    { dayOfWeek: 2, startHour: 9, endHour: 17 }, // Tuesday
    { dayOfWeek: 3, startHour: 9, endHour: 17 }, // Wednesday
    { dayOfWeek: 4, startHour: 9, endHour: 17 }, // Thursday
    { dayOfWeek: 5, startHour: 9, endHour: 17 }, // Friday
  ],
  timezone: 'America/New_York',
};

// ============================================
// Risk Level Utilities
// ============================================

const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function compareRiskLevels(a: RiskLevel, b: RiskLevel): number {
  return RISK_LEVEL_ORDER[a] - RISK_LEVEL_ORDER[b];
}

export function isRiskAcceptable(articleRisk: RiskLevel, maxAllowed: RiskLevel): boolean {
  return RISK_LEVEL_ORDER[articleRisk] <= RISK_LEVEL_ORDER[maxAllowed];
}

// ============================================
// AutoPublishService Class
// ============================================

export class AutoPublishService {
  private config: AutoPublishConfig;

  constructor(config: Partial<AutoPublishConfig> = {}) {
    this.config = { ...DEFAULT_AUTO_PUBLISH_CONFIG, ...config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AutoPublishConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoPublishConfig {
    return { ...this.config };
  }

  /**
   * Check if an article is eligible for auto-publish
   */
  checkEligibility(article: {
    qualityScore: number | null;
    riskLevel: RiskLevel | null;
    reviewedAt: Date | null;
    status: string;
  }): EligibilityResult {
    const reasons: string[] = [];

    // Check status
    if (article.status !== 'ready') {
      reasons.push(`Article status must be 'ready' (current: ${article.status})`);
    }

    // Check quality score
    if (article.qualityScore === null) {
      reasons.push('Article has no quality score');
    } else if (article.qualityScore < this.config.minimumQualityScore) {
      reasons.push(
        `Quality score ${article.qualityScore} is below minimum ${this.config.minimumQualityScore}`
      );
    }

    // Check risk level
    if (article.riskLevel === null) {
      reasons.push('Article has no risk assessment');
    } else if (!isRiskAcceptable(article.riskLevel, this.config.maximumRiskLevel)) {
      reasons.push(
        `Risk level ${article.riskLevel} exceeds maximum allowed ${this.config.maximumRiskLevel}`
      );
    }

    // Check human review
    if (this.config.requireHumanReview && !article.reviewedAt) {
      reasons.push('Human review is required but not completed');
    }

    const eligible = reasons.length === 0;

    return {
      eligible,
      reasons,
      suggestedPublishDate: eligible ? this.calculatePublishDate(new Date()) : undefined,
    };
  }

  /**
   * Calculate the next valid publish date based on publishing windows
   */
  calculatePublishDate(fromDate: Date = new Date()): Date {
    const daysToAdd = this.config.defaultDaysAfterReady;
    let targetDate = new Date(fromDate);
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    // Find the next valid publishing window
    return this.findNextPublishingSlot(targetDate);
  }

  /**
   * Find the next valid publishing slot based on windows
   */
  findNextPublishingSlot(startDate: Date): Date {
    const windows = this.config.publishingWindows;

    // If no windows configured, return the start date at 9am
    if (windows.length === 0) {
      const result = new Date(startDate);
      result.setHours(9, 0, 0, 0);
      return result;
    }

    // Sort windows by day of week
    const sortedWindows = [...windows].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    let currentDate = new Date(startDate);
    let daysChecked = 0;

    // Check up to 14 days ahead
    while (daysChecked < 14) {
      const dayOfWeek = currentDate.getDay();
      const currentHour = currentDate.getHours();

      // Find a window for this day
      const todayWindow = sortedWindows.find((w) => w.dayOfWeek === dayOfWeek);

      if (todayWindow) {
        // Check if we're within or before the window
        if (currentHour < todayWindow.endHour) {
          const result = new Date(currentDate);
          const targetHour = Math.max(currentHour, todayWindow.startHour);
          result.setHours(targetHour, 0, 0, 0);
          return result;
        }
      }

      // Move to next day and check from midnight
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
      daysChecked++;
    }

    // Fallback: return the start date if no window found
    const fallback = new Date(startDate);
    fallback.setHours(9, 0, 0, 0);
    return fallback;
  }

  /**
   * Check if current time is within a publishing window
   */
  isWithinPublishingWindow(date: Date = new Date()): boolean {
    const windows = this.config.publishingWindows;

    if (windows.length === 0) {
      return true; // No restrictions
    }

    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    return windows.some(
      (w) => w.dayOfWeek === dayOfWeek && hour >= w.startHour && hour < w.endHour
    );
  }

  /**
   * Calculate notification time (hours before publish)
   */
  getNotificationTime(scheduledFor: Date): Date | null {
    if (!this.config.notifyBeforePublish) {
      return null;
    }

    const notifyTime = new Date(scheduledFor);
    notifyTime.setHours(notifyTime.getHours() - this.config.notifyHoursBeforePublish);
    return notifyTime;
  }

  /**
   * Check if notification should be sent for a scheduled article
   */
  shouldNotify(scheduledFor: Date, now: Date = new Date()): boolean {
    const notifyTime = this.getNotificationTime(scheduledFor);
    if (!notifyTime) return false;

    // Notify if we're within the notification window but before publish time
    return now >= notifyTime && now < scheduledFor;
  }

  /**
   * Get human-readable time until publish
   */
  getTimeUntilPublish(scheduledFor: Date, now: Date = new Date()): string {
    const diffMs = scheduledFor.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Now';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  /**
   * Validate publish request before sending to WordPress
   */
  validatePublishRequest(request: Partial<PublishRequest>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.title || request.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!request.content || request.content.trim().length < 100) {
      errors.push('Content must be at least 100 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Prepare article content for WordPress publishing
   */
  prepareForPublish(article: {
    title: string;
    content: string;
    excerpt?: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    category?: string;
    tags?: string[];
  }): PublishRequest {
    return {
      title: article.title,
      content: article.content,
      status: 'publish',
      excerpt: article.excerpt,
      slug: article.slug,
      metaTitle: article.metaTitle || article.title,
      metaDescription: article.metaDescription || article.excerpt,
    };
  }

  /**
   * Determine retry delay based on attempt count
   */
  getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 5min, 15min, 45min, 2hr, 6hr
    const baseMinutes = 5;
    const multiplier = Math.pow(3, Math.min(attemptCount, 4));
    return baseMinutes * multiplier * 60 * 1000; // Convert to ms
  }

  /**
   * Check if article should be retried after failure
   */
  shouldRetry(attemptCount: number, maxAttempts: number = 5): boolean {
    return attemptCount < maxAttempts;
  }

  /**
   * Format scheduled article for display
   */
  formatScheduledArticle(article: ScheduledArticle): {
    displayDate: string;
    displayTime: string;
    statusColor: string;
    statusLabel: string;
    canCancel: boolean;
  } {
    const date = new Date(article.scheduledFor);

    const statusConfig: Record<
      PublishLogStatus,
      { color: string; label: string; canCancel: boolean }
    > = {
      pending: { color: 'text-blue-400', label: 'Scheduled', canCancel: true },
      publishing: { color: 'text-amber-400', label: 'Publishing...', canCancel: false },
      published: { color: 'text-emerald-400', label: 'Published', canCancel: false },
      failed: { color: 'text-red-400', label: 'Failed', canCancel: false },
      cancelled: { color: 'text-gray-400', label: 'Cancelled', canCancel: false },
    };

    const config = statusConfig[article.status];

    return {
      displayDate: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      displayTime: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      statusColor: config.color,
      statusLabel: config.label,
      canCancel: config.canCancel,
    };
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultService: AutoPublishService | null = null;

export function getAutoPublishService(
  config?: Partial<AutoPublishConfig>
): AutoPublishService {
  if (!defaultService || config) {
    defaultService = new AutoPublishService(config);
  }
  return defaultService;
}

export function createAutoPublishService(
  config?: Partial<AutoPublishConfig>
): AutoPublishService {
  return new AutoPublishService(config);
}

export default AutoPublishService;
