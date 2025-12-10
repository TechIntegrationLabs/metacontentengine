/**
 * API Response & Request Types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ApiMeta {
  pagination?: Pagination;
  timestamp: string;
  requestId?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

// WordPress API types
export interface WPConnection {
  id: string;
  tenantId: string;

  siteUrl: string;
  username: string;
  applicationPassword: string; // encrypted

  isActive: boolean;
  isVerified: boolean;
  lastSyncAt?: string;

  // Cached data
  categories?: WPCategory[];
  tags?: WPTag[];
  authors?: WPAuthor[];

  createdAt: string;
  updatedAt: string;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
}

export interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  email?: string;
}

export interface WPPublishRequest {
  articleId: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'publish' | 'future';

  categoryIds?: number[];
  tagIds?: number[];
  authorId?: number;

  featuredMediaId?: number;

  scheduledDate?: string;

  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
}

export interface WPPublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

// Webhook types
export interface Webhook {
  id: string;
  tenantId: string;

  name: string;
  url: string;
  secret?: string;

  events: WebhookEvent[];
  isActive: boolean;

  lastTriggeredAt?: string;
  lastStatus?: 'success' | 'failed';
  failureCount: number;

  createdAt: string;
}

export type WebhookEvent =
  | 'article.created'
  | 'article.updated'
  | 'article.published'
  | 'article.deleted'
  | 'generation.started'
  | 'generation.completed'
  | 'generation.failed';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  tenantId: string;
  data: Record<string, unknown>;
}

// Rate limiting
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// Health check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    aiProviders: ServiceHealth;
    wordpress: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'unknown';
  latency?: number;
  lastCheck: string;
  error?: string;
}
