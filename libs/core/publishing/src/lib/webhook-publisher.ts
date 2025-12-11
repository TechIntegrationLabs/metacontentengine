/**
 * Webhook Publishing Service
 *
 * Publishes articles via webhook POST to a configurable endpoint.
 * This provides maximum flexibility - the receiving system (WordPress,
 * Zapier, Make, custom endpoint) handles the actual posting.
 */

// ============================================
// Types
// ============================================

export interface WebhookConfig {
  url: string;
  authToken?: string;
  authType?: 'bearer' | 'basic' | 'header';
  customHeaders?: Record<string, string>;
  timeout?: number; // ms
  retryAttempts?: number;
}

export interface WebhookPayload {
  // Article content
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Metadata
  status: 'publish' | 'draft' | 'scheduled';
  scheduledFor?: string; // ISO date
  category?: string;
  tags?: string[];
  author?: string;

  // Quality metrics
  qualityScore?: number;
  riskLevel?: string;
  humanScore?: number;

  // Internal linking
  internalLinks?: Array<{
    url: string;
    anchorText: string;
  }>;

  // Monetization
  shortcodes?: string[];

  // Tracking
  articleId: string;
  tenantId: string;
  publishedAt: string;
  generatedBy?: string; // Contributor name
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  response?: unknown;
  error?: string;
  timestamp: string;
}

export interface WebhookPublishResult {
  success: boolean;
  articleId: string;
  webhookResponse?: WebhookResponse;
  publishedAt?: string;
  error?: string;
}

export interface TestResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number; // ms
  error?: string;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Partial<WebhookConfig> = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  authType: 'bearer',
};

// ============================================
// WebhookPublisher Class
// ============================================

export class WebhookPublisher {
  private config: WebhookConfig | null = null;

  constructor(config?: WebhookConfig) {
    if (config) {
      this.setConfig(config);
    }
  }

  /**
   * Set webhook configuration
   */
  setConfig(config: WebhookConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): WebhookConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Check if webhook is configured
   */
  isConfigured(): boolean {
    return !!this.config?.url;
  }

  /**
   * Build authorization headers
   */
  private buildAuthHeaders(): Record<string, string> {
    if (!this.config?.authToken) {
      return {};
    }

    switch (this.config.authType) {
      case 'bearer':
        return { Authorization: `Bearer ${this.config.authToken}` };
      case 'basic':
        return { Authorization: `Basic ${this.config.authToken}` };
      case 'header':
        return { 'X-API-Key': this.config.authToken };
      default:
        return { Authorization: `Bearer ${this.config.authToken}` };
    }
  }

  /**
   * Build all request headers
   */
  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'ContentEngine/1.0',
      ...this.buildAuthHeaders(),
      ...this.config?.customHeaders,
    };
  }

  /**
   * Send POST request to webhook with retry logic
   */
  private async sendRequest(
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<WebhookResponse> {
    if (!this.config?.url) {
      return {
        success: false,
        error: 'Webhook URL not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout || 30000
    );

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let responseBody: unknown;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      if (!response.ok) {
        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < (this.config.retryAttempts || 3)) {
          await this.delay(this.getRetryDelay(attempt));
          return this.sendRequest(payload, attempt + 1);
        }

        return {
          success: false,
          statusCode: response.status,
          response: responseBody,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        statusCode: response.status,
        response: responseBody,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Retry on network errors
      if (attempt < (this.config.retryAttempts || 3)) {
        await this.delay(this.getRetryDelay(attempt));
        return this.sendRequest(payload, attempt + 1);
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    // 1s, 3s, 9s
    return 1000 * Math.pow(3, attempt - 1);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test webhook connectivity
   */
  async testConnection(): Promise<TestResult> {
    if (!this.config?.url) {
      return {
        success: false,
        error: 'Webhook URL not configured',
      };
    }

    const startTime = Date.now();

    const testPayload: WebhookPayload = {
      title: 'Test Article',
      content: '<p>This is a test payload from Content Engine.</p>',
      status: 'draft',
      articleId: 'test-' + Date.now(),
      tenantId: 'test',
      publishedAt: new Date().toISOString(),
    };

    const response = await this.sendRequest(testPayload);

    return {
      success: response.success,
      statusCode: response.statusCode,
      responseTime: Date.now() - startTime,
      error: response.error,
    };
  }

  /**
   * Publish a single article
   */
  async publish(payload: WebhookPayload): Promise<WebhookPublishResult> {
    const response = await this.sendRequest(payload);

    return {
      success: response.success,
      articleId: payload.articleId,
      webhookResponse: response,
      publishedAt: response.success ? payload.publishedAt : undefined,
      error: response.error,
    };
  }

  /**
   * Publish multiple articles
   */
  async publishBatch(
    payloads: WebhookPayload[],
    options?: { concurrency?: number; onProgress?: (completed: number, total: number) => void }
  ): Promise<WebhookPublishResult[]> {
    const concurrency = options?.concurrency || 2;
    const results: WebhookPublishResult[] = [];
    let completed = 0;

    // Process in chunks for controlled concurrency
    for (let i = 0; i < payloads.length; i += concurrency) {
      const chunk = payloads.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map((p) => this.publish(p)));
      results.push(...chunkResults);

      completed += chunk.length;
      options?.onProgress?.(completed, payloads.length);
    }

    return results;
  }

  /**
   * Build payload from article data
   */
  buildPayload(article: {
    id: string;
    tenantId: string;
    title: string;
    content: string;
    excerpt?: string;
    slug?: string;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
    };
    qualityScore?: number;
    riskLevel?: string;
    humanScore?: number;
    categoryIds?: string[];
    tagIds?: string[];
    contributorName?: string;
  }, status: 'publish' | 'draft' | 'scheduled' = 'publish', scheduledFor?: Date): WebhookPayload {
    return {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      slug: article.slug,
      metaTitle: article.seo?.metaTitle,
      metaDescription: article.seo?.metaDescription,
      status,
      scheduledFor: scheduledFor?.toISOString(),
      qualityScore: article.qualityScore,
      riskLevel: article.riskLevel,
      humanScore: article.humanScore,
      generatedBy: article.contributorName,
      articleId: article.id,
      tenantId: article.tenantId,
      publishedAt: new Date().toISOString(),
    };
  }

  /**
   * Get payload schema for documentation
   */
  getPayloadSchema(): object {
    return {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Article title' },
        content: { type: 'string', description: 'Article HTML content' },
        excerpt: { type: 'string', description: 'Article excerpt/summary' },
        slug: { type: 'string', description: 'URL slug' },
        metaTitle: { type: 'string', description: 'SEO meta title' },
        metaDescription: { type: 'string', description: 'SEO meta description' },
        status: {
          type: 'string',
          enum: ['publish', 'draft', 'scheduled'],
          description: 'Publish status',
        },
        scheduledFor: { type: 'string', format: 'date-time', description: 'Scheduled publish date' },
        category: { type: 'string', description: 'Primary category' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Article tags' },
        author: { type: 'string', description: 'Author name' },
        qualityScore: { type: 'number', description: 'Quality score 0-100' },
        riskLevel: { type: 'string', description: 'Risk level: LOW, MEDIUM, HIGH, CRITICAL' },
        humanScore: { type: 'number', description: 'AI detection score (lower = more human)' },
        articleId: { type: 'string', description: 'Internal article ID' },
        tenantId: { type: 'string', description: 'Tenant ID' },
        publishedAt: { type: 'string', format: 'date-time', description: 'Timestamp' },
      },
      required: ['title', 'content', 'status', 'articleId', 'tenantId', 'publishedAt'],
    };
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultPublisher: WebhookPublisher | null = null;

export function getWebhookPublisher(config?: WebhookConfig): WebhookPublisher {
  if (!defaultPublisher || config) {
    defaultPublisher = new WebhookPublisher(config);
  }
  return defaultPublisher;
}

export function createWebhookPublisher(config?: WebhookConfig): WebhookPublisher {
  return new WebhookPublisher(config);
}

export default WebhookPublisher;
