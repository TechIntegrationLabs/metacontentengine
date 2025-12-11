/**
 * Internal Linking Types
 */

export interface SiteCatalogEntry {
  id: string;
  tenant_id: string;
  url: string;
  slug: string | null;
  wp_post_id: number | null;
  title: string;
  excerpt: string | null;
  content_html: string | null;
  content_text: string | null;
  topics: string[];
  keywords: string[];
  author_name: string | null;
  category_name: string | null;
  published_at: string | null;
  word_count: number | null;
  times_linked_to: number;
  times_linked_from: number;
  relevance_score: number | null;
  is_active: boolean;
  is_pillar: boolean;
  last_synced_at: string | null;
  sync_status: 'pending' | 'synced' | 'error';
  sync_error: string | null;
  created_at: string;
  updated_at: string;
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

export interface ArticleInternalLink {
  id: string;
  tenant_id: string;
  source_article_id: string;
  target_catalog_id: string | null;
  target_url: string;
  anchor_text: string;
  context_text: string | null;
  position_in_article: number | null;
  is_natural: boolean;
  relevance_score: number | null;
  created_at: string;
  created_by: 'ai' | 'manual';
}

export interface InternalLinkingStats {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  averageLinksPerArticle: number;
  topLinkedArticles: Array<{
    catalogId: string;
    title: string;
    url: string;
    linkCount: number;
  }>;
}
