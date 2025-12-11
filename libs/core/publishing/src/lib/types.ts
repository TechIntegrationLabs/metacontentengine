/**
 * Publishing Types
 */

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string; // Application password
  defaultStatus?: 'draft' | 'publish' | 'pending' | 'private';
  defaultCategoryId?: number;
}

export interface PublishRequest {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  status?: 'draft' | 'publish' | 'pending' | 'private' | 'future';
  author?: number;
  categories?: number[];
  tags?: number[];
  featuredImage?: number;
  metaTitle?: string;
  metaDescription?: string;
  publishDate?: Date; // For scheduled posts
  customFields?: Record<string, string>;
}

export interface PublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
  metadata?: {
    status: string;
    publishDate: string;
    modifiedDate: string;
  };
}

export interface UpdatePostRequest extends PublishRequest {
  postId: number;
}

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
  avatar_urls: Record<string, string>;
}

export interface SyncResult {
  success: boolean;
  categories?: WordPressCategory[];
  tags?: WordPressTag[];
  authors?: WordPressAuthor[];
  error?: string;
}

export interface MediaUploadResult {
  success: boolean;
  mediaId?: number;
  mediaUrl?: string;
  error?: string;
}

export type PublishingProvider = 'wordpress' | 'webflow' | 'contentful';

export interface PublishingService {
  provider: PublishingProvider;
  publish(request: PublishRequest): Promise<PublishResult>;
  update(request: UpdatePostRequest): Promise<PublishResult>;
  delete(postId: number): Promise<{ success: boolean; error?: string }>;
  getPost(postId: number): Promise<WordPressPost | null>;
  syncCategories(): Promise<SyncResult>;
  uploadMedia(file: Buffer, filename: string, mimeType: string): Promise<MediaUploadResult>;
}
