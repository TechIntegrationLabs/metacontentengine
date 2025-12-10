import { useCallback, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from './useTenant';

export interface Article {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: ArticleStatus;
  contributor_id: string;
  author_id?: string;
  seo: ArticleSEO;
  primary_keyword?: string;
  cluster_id?: string;
  category_ids: string[];
  tag_ids: string[];
  quality_score?: number;
  readability_score?: number;
  seo_score?: number;
  human_score?: number;
  word_count: number;
  reading_time: number;
  featured_image_url?: string;
  featured_image_alt?: string;
  media_ids: string[];
  published_at?: string;
  scheduled_at?: string;
  wp_post_id?: number;
  published_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  // Joined fields
  contributor?: {
    id: string;
    name: string;
    display_name: string;
    avatar_url?: string;
  };
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
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  schema_markup?: Record<string, unknown>;
}

export interface ArticleFilters {
  status?: ArticleStatus | ArticleStatus[];
  contributorId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'published_at' | 'title';
  orderDirection?: 'asc' | 'desc';
}

export interface CreateArticleInput {
  title: string;
  content?: string;
  excerpt?: string;
  status?: ArticleStatus;
  contributor_id?: string;
  primary_keyword?: string;
  category_ids?: string[];
  tag_ids?: string[];
  featured_image_url?: string;
  featured_image_alt?: string;
  seo?: Partial<ArticleSEO>;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  id: string;
}

interface UseArticlesProps {
  supabase: SupabaseClient;
  filters?: ArticleFilters;
  autoFetch?: boolean;
}

export function useArticles({ supabase, filters = {}, autoFetch = true }: UseArticlesProps) {
  const { tenantId } = useTenant();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchArticles = useCallback(async (customFilters?: ArticleFilters) => {
    if (!tenantId) {
      setArticles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = { ...filters, ...customFilters };
      let query = supabase
        .from('articles')
        .select(`
          *,
          contributor:contributors(id, name, display_name, avatar_url)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId);

      // Apply status filter
      if (activeFilters.status) {
        if (Array.isArray(activeFilters.status)) {
          query = query.in('status', activeFilters.status);
        } else {
          query = query.eq('status', activeFilters.status);
        }
      }

      // Apply contributor filter
      if (activeFilters.contributorId) {
        query = query.eq('contributor_id', activeFilters.contributorId);
      }

      // Apply search
      if (activeFilters.search) {
        query = query.or(`title.ilike.%${activeFilters.search}%,content.ilike.%${activeFilters.search}%`);
      }

      // Apply ordering
      const orderBy = activeFilters.orderBy || 'updated_at';
      const orderDirection = activeFilters.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (activeFilters.limit) {
        query = query.limit(activeFilters.limit);
      }
      if (activeFilters.offset) {
        query = query.range(activeFilters.offset, activeFilters.offset + (activeFilters.limit || 10) - 1);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setArticles(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tenantId, filters]);

  const getArticle = useCallback(async (id: string): Promise<Article | null> => {
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        contributor:contributors(id, name, display_name, avatar_url)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }, [supabase, tenantId]);

  const createArticle = useCallback(async (input: CreateArticleInput): Promise<Article> => {
    if (!tenantId) throw new Error('No tenant context');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const wordCount = input.content ? input.content.split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.ceil(wordCount / 200);

    const { data, error } = await supabase
      .from('articles')
      .insert({
        tenant_id: tenantId,
        title: input.title,
        slug,
        content: input.content || '',
        excerpt: input.excerpt,
        status: input.status || 'idea',
        contributor_id: input.contributor_id,
        primary_keyword: input.primary_keyword,
        category_ids: input.category_ids || [],
        tag_ids: input.tag_ids || [],
        featured_image_url: input.featured_image_url,
        featured_image_alt: input.featured_image_alt,
        seo: input.seo || {},
        word_count: wordCount,
        reading_time: readingTime,
        media_ids: [],
        created_by: user.id,
        updated_by: user.id,
      })
      .select(`
        *,
        contributor:contributors(id, name, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Refresh the list
    fetchArticles();

    return data;
  }, [supabase, tenantId, fetchArticles]);

  const updateArticle = useCallback(async (input: UpdateArticleInput): Promise<Article> => {
    if (!tenantId) throw new Error('No tenant context');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: Record<string, unknown> = {
      ...input,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Recalculate word count if content changed
    if (input.content) {
      updateData.word_count = input.content.split(/\s+/).filter(Boolean).length;
      updateData.reading_time = Math.ceil((updateData.word_count as number) / 200);
    }

    // Regenerate slug if title changed
    if (input.title) {
      updateData.slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    delete updateData.id;

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', input.id)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        contributor:contributors(id, name, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update local state
    setArticles(prev => prev.map(a => a.id === input.id ? data : a));

    return data;
  }, [supabase, tenantId]);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('No tenant context');

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    // Update local state
    setArticles(prev => prev.filter(a => a.id !== id));
    setTotalCount(prev => prev - 1);
  }, [supabase, tenantId]);

  const publishArticle = useCallback(async (id: string): Promise<Article> => {
    return updateArticle({
      id,
      status: 'published',
    });
  }, [updateArticle]);

  const archiveArticle = useCallback(async (id: string): Promise<Article> => {
    return updateArticle({
      id,
      status: 'archived',
    });
  }, [updateArticle]);

  // Auto-fetch on mount or when filters change
  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchArticles();
    }
  }, [autoFetch, tenantId, fetchArticles]);

  return {
    articles,
    isLoading,
    error,
    totalCount,
    fetchArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    publishArticle,
    archiveArticle,
    refetch: fetchArticles,
  };
}

export default useArticles;
