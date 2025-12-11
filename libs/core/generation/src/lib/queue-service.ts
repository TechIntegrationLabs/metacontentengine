/**
 * Generation Queue Service
 *
 * Manages batch content generation with priority queue,
 * retry logic, and statistics tracking.
 */

// ============================================
// Types
// ============================================

export type QueueStatus = 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface QueueItem {
  id: string;
  tenantId: string;
  contentIdeaId?: string;
  articleId?: string;
  priority: number;
  status: QueueStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  scheduledFor?: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  config?: Record<string, unknown>;
  result?: Record<string, unknown>;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
}

export interface QueueStats {
  pending: number;
  scheduled: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime?: number; // in milliseconds
  itemsLastHour: number;
  estimatedWaitTime?: number; // in milliseconds
}

export interface EnqueueOptions {
  priority?: number;
  scheduledFor?: Date;
  config?: Record<string, unknown>;
  maxAttempts?: number;
}

export interface QueueConfig {
  defaultPriority: number;
  defaultMaxAttempts: number;
  processingTimeout: number; // ms
  retryDelayMs: number;
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  defaultPriority: 0,
  defaultMaxAttempts: 3,
  processingTimeout: 10 * 60 * 1000, // 10 minutes
  retryDelayMs: 30 * 1000, // 30 seconds
};

// ============================================
// Queue Service
// ============================================

export class GenerationQueueService {
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Create a queue item object (for local state management)
   */
  createQueueItem(
    tenantId: string,
    source: { contentIdeaId?: string; articleId?: string },
    options: EnqueueOptions = {},
    createdBy?: string
  ): Omit<QueueItem, 'id'> {
    return {
      tenantId,
      contentIdeaId: source.contentIdeaId,
      articleId: source.articleId,
      priority: options.priority ?? this.config.defaultPriority,
      status: options.scheduledFor ? 'scheduled' : 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.defaultMaxAttempts,
      scheduledFor: options.scheduledFor,
      config: options.config,
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate estimated wait time based on queue stats
   */
  calculateEstimatedWaitTime(stats: QueueStats, position?: number): number {
    // If no processing time data, assume 3 minutes per item
    const avgTime = stats.avgProcessingTime || 3 * 60 * 1000;

    // Calculate based on position in queue or pending count
    const itemsAhead = position !== undefined ? position : stats.pending;

    // Account for concurrent processing (assume 2 concurrent)
    const concurrentWorkers = 2;
    const effectiveItems = Math.ceil(itemsAhead / concurrentWorkers);

    return effectiveItems * avgTime;
  }

  /**
   * Format wait time for display
   */
  formatWaitTime(ms: number): string {
    if (ms < 60 * 1000) {
      return 'Less than a minute';
    }

    const minutes = Math.round(ms / (60 * 1000));

    if (minutes < 60) {
      return `~${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `~${hours} hour${hours > 1 ? 's' : ''}`;
    }

    return `~${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get processing progress percentage
   */
  getProgress(item: QueueItem): number {
    switch (item.status) {
      case 'completed':
        return 100;
      case 'cancelled':
      case 'failed':
        return 0;
      case 'processing':
        // Estimate based on time elapsed (assuming 3 min avg)
        if (item.processingStartedAt) {
          const elapsed = Date.now() - new Date(item.processingStartedAt).getTime();
          const avgTime = 3 * 60 * 1000;
          return Math.min(95, Math.round((elapsed / avgTime) * 100));
        }
        return 10;
      case 'scheduled':
      case 'pending':
      default:
        return 0;
    }
  }

  /**
   * Check if item should be retried
   */
  shouldRetry(item: QueueItem): boolean {
    return item.status === 'failed' && item.attempts < item.maxAttempts;
  }

  /**
   * Get retry delay with exponential backoff
   */
  getRetryDelay(attempts: number): number {
    // Exponential backoff: 30s, 90s, 270s...
    return this.config.retryDelayMs * Math.pow(3, attempts - 1);
  }

  /**
   * Check if processing has timed out
   */
  hasTimedOut(item: QueueItem): boolean {
    if (item.status !== 'processing' || !item.processingStartedAt) {
      return false;
    }

    const elapsed = Date.now() - new Date(item.processingStartedAt).getTime();
    return elapsed > this.config.processingTimeout;
  }

  /**
   * Sort queue items by priority and creation time
   */
  sortQueue(items: QueueItem[]): QueueItem[] {
    return [...items].sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Earlier creation time first (FIFO within same priority)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Filter queue items by status
   */
  filterByStatus(items: QueueItem[], statuses: QueueStatus[]): QueueItem[] {
    return items.filter((item) => statuses.includes(item.status));
  }

  /**
   * Calculate queue statistics from items
   */
  calculateStats(items: QueueItem[]): QueueStats {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const completedItems = items.filter((i) => i.status === 'completed');
    const recentCompleted = completedItems.filter(
      (i) => i.completedAt && new Date(i.completedAt).getTime() > oneHourAgo
    );

    // Calculate average processing time
    let avgProcessingTime: number | undefined;
    const itemsWithProcessingTime = completedItems.filter(
      (i) => i.processingStartedAt && i.completedAt
    );

    if (itemsWithProcessingTime.length > 0) {
      const totalTime = itemsWithProcessingTime.reduce((sum, item) => {
        const start = new Date(item.processingStartedAt!).getTime();
        const end = new Date(item.completedAt!).getTime();
        return sum + (end - start);
      }, 0);
      avgProcessingTime = totalTime / itemsWithProcessingTime.length;
    }

    const stats: QueueStats = {
      pending: items.filter((i) => i.status === 'pending').length,
      scheduled: items.filter((i) => i.status === 'scheduled').length,
      processing: items.filter((i) => i.status === 'processing').length,
      completed: completedItems.length,
      failed: items.filter((i) => i.status === 'failed').length,
      avgProcessingTime,
      itemsLastHour: recentCompleted.length,
    };

    stats.estimatedWaitTime = this.calculateEstimatedWaitTime(stats);

    return stats;
  }

  /**
   * Get status display info
   */
  getStatusDisplay(status: QueueStatus): {
    label: string;
    color: string;
    bgColor: string;
  } {
    const config: Record<QueueStatus, { label: string; color: string; bgColor: string }> = {
      pending: { label: 'Pending', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      scheduled: { label: 'Scheduled', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
      processing: { label: 'Processing', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
      completed: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
      failed: { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/10' },
      cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
    };

    return config[status];
  }

  /**
   * Validate enqueue input
   */
  validateEnqueueInput(source: { contentIdeaId?: string; articleId?: string }): {
    valid: boolean;
    error?: string;
  } {
    if (!source.contentIdeaId && !source.articleId) {
      return { valid: false, error: 'Either contentIdeaId or articleId is required' };
    }

    if (source.contentIdeaId && source.articleId) {
      return { valid: false, error: 'Provide only one of contentIdeaId or articleId' };
    }

    return { valid: true };
  }

  /**
   * Get position of item in queue
   */
  getQueuePosition(items: QueueItem[], itemId: string): number | null {
    const sorted = this.sortQueue(this.filterByStatus(items, ['pending', 'scheduled']));
    const index = sorted.findIndex((i) => i.id === itemId);
    return index >= 0 ? index + 1 : null;
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultService: GenerationQueueService | null = null;

export function getQueueService(config?: Partial<QueueConfig>): GenerationQueueService {
  if (!defaultService || config) {
    defaultService = new GenerationQueueService(config);
  }
  return defaultService;
}

export function createQueueService(config?: Partial<QueueConfig>): GenerationQueueService {
  return new GenerationQueueService(config);
}

export default GenerationQueueService;
