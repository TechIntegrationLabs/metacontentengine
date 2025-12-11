/**
 * WordPress Publishing Service
 *
 * Publish, update, and manage content on WordPress sites
 * using the WordPress REST API with Application Passwords.
 */

import {
  WordPressConfig,
  PublishRequest,
  PublishResult,
  UpdatePostRequest,
  WordPressPost,
  WordPressCategory,
  WordPressTag,
  WordPressAuthor,
  SyncResult,
  MediaUploadResult,
  PublishingService,
} from './types';

export * from './types';

export class WordPressPublisher implements PublishingService {
  provider = 'wordpress' as const;
  private config: WordPressConfig;
  private apiBase: string;
  private authHeader: string;

  constructor(config: WordPressConfig) {
    this.config = {
      defaultStatus: 'draft',
      ...config,
    };

    // Ensure site URL has correct format
    let siteUrl = config.siteUrl.replace(/\/$/, '');
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }
    this.apiBase = `${siteUrl}/wp-json/wp/v2`;

    // Create Basic Auth header
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Make authenticated request to WordPress API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiBase}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText;
      }

      throw new Error(`WordPress API error (${response.status}): ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Convert HTML content to WordPress-compatible format
   */
  private prepareContent(content: string): string {
    // WordPress handles HTML content, but we should:
    // 1. Ensure proper encoding
    // 2. Remove any script tags for security
    // 3. Convert relative URLs if needed

    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();
  }

  /**
   * Publish a new post to WordPress
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    try {
      const postData: Record<string, unknown> = {
        title: request.title,
        content: this.prepareContent(request.content),
        status: request.status || this.config.defaultStatus,
      };

      // Optional fields
      if (request.slug) postData['slug'] = request.slug;
      if (request.excerpt) postData['excerpt'] = request.excerpt;
      if (request.author) postData['author'] = request.author;
      if (request.categories?.length) postData['categories'] = request.categories;
      else if (this.config.defaultCategoryId) postData['categories'] = [this.config.defaultCategoryId];
      if (request.tags?.length) postData['tags'] = request.tags;
      if (request.featuredImage) postData['featured_media'] = request.featuredImage;

      // Scheduled publishing
      if (request.publishDate && request.status === 'future') {
        postData['date'] = request.publishDate.toISOString();
        postData['date_gmt'] = request.publishDate.toISOString();
      }

      // Custom fields (if using ACF or custom meta)
      if (request.customFields) {
        postData['meta'] = request.customFields;
      }

      // SEO meta (Yoast SEO compatibility)
      if (request.metaTitle || request.metaDescription) {
        postData['meta'] = {
          ...(postData['meta'] as Record<string, string>),
          _yoast_wpseo_title: request.metaTitle || '',
          _yoast_wpseo_metadesc: request.metaDescription || '',
        };
      }

      const post = await this.request<WordPressPost>('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
        metadata: {
          status: post.status,
          publishDate: post.date,
          modifiedDate: post.modified,
        },
      };
    } catch (error) {
      console.error('WordPress publish error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update an existing post
   */
  async update(request: UpdatePostRequest): Promise<PublishResult> {
    try {
      const postData: Record<string, unknown> = {};

      // Only include fields that are being updated
      if (request.title !== undefined) postData['title'] = request.title;
      if (request.content !== undefined) postData['content'] = this.prepareContent(request.content);
      if (request.slug !== undefined) postData['slug'] = request.slug;
      if (request.excerpt !== undefined) postData['excerpt'] = request.excerpt;
      if (request.status !== undefined) postData['status'] = request.status;
      if (request.author !== undefined) postData['author'] = request.author;
      if (request.categories !== undefined) postData['categories'] = request.categories;
      if (request.tags !== undefined) postData['tags'] = request.tags;
      if (request.featuredImage !== undefined) postData['featured_media'] = request.featuredImage;

      // Handle scheduled publishing
      if (request.publishDate && request.status === 'future') {
        postData['date'] = request.publishDate.toISOString();
      }

      // Custom fields
      if (request.customFields) {
        postData['meta'] = request.customFields;
      }

      // SEO meta
      if (request.metaTitle || request.metaDescription) {
        postData['meta'] = {
          ...(postData['meta'] as Record<string, string>),
          _yoast_wpseo_title: request.metaTitle || '',
          _yoast_wpseo_metadesc: request.metaDescription || '',
        };
      }

      const post = await this.request<WordPressPost>(`/posts/${request.postId}`, {
        method: 'PUT',
        body: JSON.stringify(postData),
      });

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
        metadata: {
          status: post.status,
          publishDate: post.date,
          modifiedDate: post.modified,
        },
      };
    } catch (error) {
      console.error('WordPress update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a post (move to trash)
   */
  async delete(postId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request(`/posts/${postId}`, {
        method: 'DELETE',
      });

      return { success: true };
    } catch (error) {
      console.error('WordPress delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a post by ID
   */
  async getPost(postId: number): Promise<WordPressPost | null> {
    try {
      return await this.request<WordPressPost>(`/posts/${postId}`);
    } catch (error) {
      console.error('WordPress getPost error:', error);
      return null;
    }
  }

  /**
   * Get all posts (with pagination)
   */
  async getPosts(options: {
    page?: number;
    perPage?: number;
    status?: string;
    search?: string;
    categories?: number[];
  } = {}): Promise<{ posts: WordPressPost[]; total: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', options.page.toString());
      if (options.perPage) params.set('per_page', options.perPage.toString());
      if (options.status) params.set('status', options.status);
      if (options.search) params.set('search', options.search);
      if (options.categories?.length) params.set('categories', options.categories.join(','));

      const queryString = params.toString();
      const endpoint = `/posts${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const posts = await response.json() as WordPressPost[];
      const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);

      return { posts, total, totalPages };
    } catch (error) {
      console.error('WordPress getPosts error:', error);
      return { posts: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Sync categories, tags, and authors from WordPress
   */
  async syncCategories(): Promise<SyncResult> {
    try {
      const [categories, tags, authors] = await Promise.all([
        this.request<WordPressCategory[]>('/categories?per_page=100'),
        this.request<WordPressTag[]>('/tags?per_page=100'),
        this.request<WordPressAuthor[]>('/users?per_page=100'),
      ]);

      return {
        success: true,
        categories,
        tags,
        authors,
      };
    } catch (error) {
      console.error('WordPress sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload media to WordPress
   */
  async uploadMedia(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<MediaUploadResult> {
    try {
      const response = await fetch(`${this.apiBase}/media`, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: new Uint8Array(file),
      });

      if (!response.ok) {
        throw new Error(`WordPress upload error: ${response.status}`);
      }

      const media = await response.json() as { id: number; source_url: string };

      return {
        success: true,
        mediaId: media.id,
        mediaUrl: media.source_url,
      };
    } catch (error) {
      console.error('WordPress upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create or get a category by name
   */
  async getOrCreateCategory(name: string, parentId?: number): Promise<number | null> {
    try {
      // First, try to find existing category
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await this.request<WordPressCategory[]>(`/categories?slug=${slug}`);

      if (existing.length > 0) {
        return existing[0].id;
      }

      // Create new category
      const newCategory = await this.request<WordPressCategory>('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug,
          parent: parentId || 0,
        }),
      });

      return newCategory.id;
    } catch (error) {
      console.error('WordPress category error:', error);
      return null;
    }
  }

  /**
   * Create or get a tag by name
   */
  async getOrCreateTag(name: string): Promise<number | null> {
    try {
      // First, try to find existing tag
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await this.request<WordPressTag[]>(`/tags?slug=${slug}`);

      if (existing.length > 0) {
        return existing[0].id;
      }

      // Create new tag
      const newTag = await this.request<WordPressTag>('/tags', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug,
        }),
      });

      return newTag.id;
    } catch (error) {
      console.error('WordPress tag error:', error);
      return null;
    }
  }

  /**
   * Verify WordPress connection
   */
  async verifyConnection(): Promise<{ success: boolean; siteInfo?: { name: string; url: string }; error?: string }> {
    try {
      // Try to access the WordPress site info
      const siteUrl = this.config.siteUrl.replace(/\/$/, '');
      const response = await fetch(`${siteUrl}/wp-json`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      const siteInfo = await response.json() as { name: string; url: string };

      // Verify we have write access by checking current user
      await this.request('/users/me');

      return {
        success: true,
        siteInfo: {
          name: siteInfo.name,
          url: siteInfo.url,
        },
      };
    } catch (error) {
      console.error('WordPress verify error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a WordPress publisher instance
 */
export function createWordPressPublisher(config: WordPressConfig): WordPressPublisher {
  return new WordPressPublisher(config);
}

export default WordPressPublisher;
