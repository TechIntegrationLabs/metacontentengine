/**
 * Internal Linking Service
 *
 * Provides intelligent internal link suggestions based on relevance scoring.
 * Integrates with tenant_site_catalog to suggest contextually relevant links.
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface SiteCatalogEntry {
  id: string;
  tenant_id: string;
  url: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  topics: string[];
  keywords: string[];
  published_at: string | null;
  times_linked_to: number;
  word_count: number | null;
}

export interface RelevanceScore {
  titleOverlap: number;      // 0-40 points (word overlap)
  topicMatch: number;        // 0-30 points (topic array intersection)
  keywordMatch: number;      // 0-20 points (keyword array intersection)
  recencyBonus: number;      // 0-10 points (newer content preferred)
  linkEquityPenalty: number; // -20 to 0 (already heavily linked)
}

export interface LinkSuggestion {
  id: string;
  targetUrl: string;
  targetTitle: string;
  targetExcerpt: string | null;
  anchorText: string;
  relevanceScore: number;
  scoreBreakdown: RelevanceScore;
  alreadyLinked: boolean;
  matchedTopics: string[];
  matchedKeywords: string[];
}

export interface ArticleContext {
  title: string;
  content: string;
  topics: string[];
  keywords: string[];
}

export interface InternalLinkInsertResult {
  content: string;
  linksInserted: number;
  suggestions: LinkSuggestion[];
}

/**
 * Internal Linking Service Class
 */
export class InternalLinkService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseClient: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient;
  }

  /**
   * Find relevant internal link suggestions for an article
   */
  async findRelevantLinks(
    context: ArticleContext,
    tenantId: string,
    options: {
      limit?: number;
      minScore?: number;
      excludeUrls?: string[];
    } = {}
  ): Promise<LinkSuggestion[]> {
    const {
      limit = 10,
      minScore = 60,
      excludeUrls = [],
    } = options;

    try {
      // Get all active catalog entries for tenant
      const { data: catalogEntries, error } = await this.supabase
        .from('tenant_site_catalog')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .not('url', 'in', `(${excludeUrls.join(',')})`)
        .order('published_at', { ascending: false }) as { data: SiteCatalogEntry[] | null; error: unknown };

      if (error) {
        console.error('Error fetching catalog entries:', error);
        return [];
      }

      if (!catalogEntries || catalogEntries.length === 0) {
        return [];
      }

      // Calculate relevance scores for each entry
      const scoredEntries = catalogEntries
        .map((entry) => {
          const score = this.calculateRelevanceScore(context, entry);
          return {
            entry,
            score,
          };
        })
        .filter((item) => item.score.total >= minScore)
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, limit);

      // Convert to LinkSuggestions
      const suggestions: LinkSuggestion[] = scoredEntries.map((item) => ({
        id: item.entry.id,
        targetUrl: item.entry.url,
        targetTitle: item.entry.title,
        targetExcerpt: item.entry.excerpt,
        anchorText: this.generateAnchorText(item.entry.title, item.score.matchedKeywords),
        relevanceScore: item.score.total,
        scoreBreakdown: item.score.breakdown,
        alreadyLinked: false, // Will be checked separately if articleId is provided
        matchedTopics: item.score.matchedTopics,
        matchedKeywords: item.score.matchedKeywords,
      }));

      return suggestions;
    } catch (error) {
      console.error('Error finding relevant links:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score between article and catalog entry
   */
  calculateRelevanceScore(
    context: ArticleContext,
    catalogEntry: SiteCatalogEntry
  ): {
    total: number;
    breakdown: RelevanceScore;
    matchedTopics: string[];
    matchedKeywords: string[];
  } {
    let score = 0;

    // Title word overlap (0-40 points)
    const titleWords = new Set(
      context.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
    const catalogWords = catalogEntry.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const titleOverlap = catalogWords.filter((w) => titleWords.has(w)).length;
    const titleScore = Math.min(titleOverlap * 10, 40);
    score += titleScore;

    // Topic intersection (0-30 points)
    const matchedTopics = context.topics.filter((t) =>
      catalogEntry.topics.includes(t)
    );
    const topicScore = Math.min(matchedTopics.length * 10, 30);
    score += topicScore;

    // Keyword intersection (0-20 points)
    const matchedKeywords = context.keywords.filter((k) =>
      catalogEntry.keywords.map((ck) => ck.toLowerCase()).includes(k.toLowerCase())
    );
    const keywordScore = Math.min(matchedKeywords.length * 5, 20);
    score += keywordScore;

    // Recency bonus (0-10 points)
    let recencyScore = 0;
    if (catalogEntry.published_at) {
      const daysSincePublish = this.daysBetween(
        new Date(catalogEntry.published_at),
        new Date()
      );
      if (daysSincePublish < 30) recencyScore = 10;
      else if (daysSincePublish < 90) recencyScore = 7;
      else if (daysSincePublish < 180) recencyScore = 4;
    }
    score += recencyScore;

    // Link equity penalty (-20 to 0)
    // Avoid over-linking to same articles
    let linkPenalty = 0;
    if (catalogEntry.times_linked_to > 20) linkPenalty = -20;
    else if (catalogEntry.times_linked_to > 10) linkPenalty = -10;
    else if (catalogEntry.times_linked_to > 5) linkPenalty = -5;
    score += linkPenalty;

    const total = Math.max(0, Math.min(100, score));

    return {
      total,
      breakdown: {
        titleOverlap: titleScore,
        topicMatch: topicScore,
        keywordMatch: keywordScore,
        recencyBonus: recencyScore,
        linkEquityPenalty: linkPenalty,
      },
      matchedTopics,
      matchedKeywords,
    };
  }

  /**
   * Insert internal links into content
   */
  async insertLinks(
    content: string,
    links: Array<{ url: string; anchorText: string }>,
    maxLinks: number = 5
  ): Promise<InternalLinkInsertResult> {
    let modifiedContent = content;
    let linksInserted = 0;
    const insertedSuggestions: LinkSuggestion[] = [];

    // Limit to maxLinks
    const linksToInsert = links.slice(0, maxLinks);

    for (const link of linksToInsert) {
      // Find first occurrence of anchor text (case-insensitive)
      const regex = new RegExp(`\\b${this.escapeRegExp(link.anchorText)}\\b`, 'i');
      const match = modifiedContent.match(regex);

      if (match) {
        // Replace with link (only first occurrence)
        const linkHtml = `<a href="${link.url}">${match[0]}</a>`;
        modifiedContent = modifiedContent.replace(regex, linkHtml);
        linksInserted++;
      }
    }

    return {
      content: modifiedContent,
      linksInserted,
      suggestions: insertedSuggestions,
    };
  }

  /**
   * Record link usage in database
   */
  async recordLinkUsage(
    sourceArticleId: string,
    targetCatalogId: string,
    anchorText: string,
    tenantId: string,
    options: {
      contextText?: string;
      positionInArticle?: number;
      relevanceScore?: number;
    } = {}
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('article_internal_links')
        .insert({
          tenant_id: tenantId,
          source_article_id: sourceArticleId,
          target_catalog_id: targetCatalogId,
          target_url: '', // Will be populated by trigger or separate query
          anchor_text: anchorText,
          context_text: options.contextText,
          position_in_article: options.positionInArticle,
          relevance_score: options.relevanceScore,
          is_natural: true,
          created_by: 'ai',
        });

      if (error) {
        console.error('Error recording link usage:', error);
      }
    } catch (error) {
      console.error('Error recording link usage:', error);
    }
  }

  /**
   * Get existing internal links for an article
   */
  async getArticleLinks(articleId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('article_internal_links')
        .select('target_url')
        .eq('source_article_id', articleId) as { data: { target_url: string }[] | null; error: unknown };

      if (error) {
        console.error('Error fetching article links:', error);
        return [];
      }

      return data?.map((link) => link.target_url) || [];
    } catch (error) {
      console.error('Error fetching article links:', error);
      return [];
    }
  }

  /**
   * Sync site catalog from sitemap or URL list
   * This would typically be called from an Edge Function
   */
  async syncCatalogEntry(
    tenantId: string,
    entry: {
      url: string;
      title: string;
      excerpt?: string;
      content?: string;
      topics?: string[];
      keywords?: string[];
      publishedAt?: string;
      wordCount?: number;
    }
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('tenant_site_catalog')
        .upsert(
          {
            tenant_id: tenantId,
            url: entry.url,
            title: entry.title,
            excerpt: entry.excerpt,
            content_text: entry.content,
            topics: entry.topics || [],
            keywords: entry.keywords || [],
            published_at: entry.publishedAt,
            word_count: entry.wordCount,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
          },
          {
            onConflict: 'tenant_id,url',
          }
        );

      if (error) {
        console.error('Error syncing catalog entry:', error);
      }
    } catch (error) {
      console.error('Error syncing catalog entry:', error);
    }
  }

  // Helper methods

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate anchor text based on title and keywords
   */
  private generateAnchorText(title: string, keywords: string[]): string {
    // Prefer keywords if available
    if (keywords.length > 0) {
      return keywords[0];
    }

    // Otherwise use first 3-5 words of title
    const words = title.split(/\s+/).slice(0, 5);
    return words.join(' ');
  }

  /**
   * Extract topics from content using simple keyword extraction
   * In production, this would use AI/NLP
   */
  static extractTopics(content: string): string[] {
    // This is a placeholder - in production use AI
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract keywords from content using simple keyword extraction
   * In production, this would use AI/NLP
   */
  static extractKeywords(content: string): string[] {
    // This is a placeholder - in production use AI
    return this.extractTopics(content).slice(0, 5);
  }
}

/**
 * Factory function to create InternalLinkService instance
 */
export function createInternalLinkService(
  supabaseClient: ReturnType<typeof createClient>
): InternalLinkService {
  return new InternalLinkService(supabaseClient);
}
