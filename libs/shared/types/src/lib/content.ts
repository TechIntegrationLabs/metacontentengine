/**
 * Content & Article Types
 */

export interface Article {
  id: string;
  tenantId: string;

  // Content
  title: string;
  slug: string;
  content: string;
  excerpt?: string;

  // Metadata
  status: ArticleStatus;
  contributorId: string;
  authorId?: string; // For WP author mapping

  // SEO
  seo: ArticleSEO;

  // Categorization
  primaryKeyword?: string;
  clusterId?: string;
  categoryIds: string[];
  tagIds: string[];

  // Quality metrics
  qualityScore?: number;
  readabilityScore?: number;
  seoScore?: number;
  humanScore?: number; // AI detection score (lower = more human-like)

  // Stats
  wordCount: number;
  readingTime: number;

  // Media
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  mediaIds: string[];

  // Publishing
  publishedAt?: string;
  scheduledAt?: string;
  wpPostId?: number;
  publishedUrl?: string;

  // Tracking
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type ArticleStatus =
  | 'idea'
  | 'outline'
  | 'drafting'
  | 'humanizing'
  | 'review'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'archived';

export interface ArticleSEO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaMarkup?: Record<string, unknown>;
}

export interface ContentIdea {
  id: string;
  tenantId: string;

  title: string;
  description?: string;
  source: 'manual' | 'ai_generated' | 'keyword_research' | 'competitor';

  // Priority
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'approved' | 'in_progress' | 'completed' | 'rejected';

  // Research
  primaryKeyword?: string;
  searchVolume?: number;
  keywordDifficulty?: number;

  // Assignment
  assignedContributorId?: string;
  assignedUserId?: string;

  // Relations
  clusterId?: string;
  articleId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ContentCluster {
  id: string;
  tenantId: string;

  name: string;
  description?: string;
  pillarArticleId?: string;

  // Keywords
  coreKeywords: string[];
  secondaryKeywords: string[];

  // Status
  status: 'planning' | 'active' | 'completed';

  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  wpCategoryId?: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  wpTagId?: number;
  createdAt: string;
}

export interface Media {
  id: string;
  tenantId: string;

  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;

  alt?: string;
  caption?: string;

  width?: number;
  height?: number;

  wpMediaId?: number;

  createdAt: string;
  uploadedBy: string;
}
