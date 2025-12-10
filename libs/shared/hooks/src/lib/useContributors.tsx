import { useCallback, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from './useTenant';

export interface Contributor {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  wp_author_id?: number;
  wp_author_slug?: string;
  style_proxy?: string;
  style_proxy_description?: string;
  voice_profile: ContributorVoice;
  expertise_areas: string[];
  content_types: ContentType[];
  is_active: boolean;
  is_default: boolean;
  article_count: number;
  average_quality_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ContributorVoice {
  formality_scale: number;
  description: string;
  guidelines?: string;
  signature_phrases: string[];
  transition_words: string[];
  phrases_to_avoid: string[];
  topics_to_avoid: string[];
  writing_samples?: WritingSample[];
}

export interface WritingSample {
  id: string;
  title: string;
  content: string;
  source?: string;
  added_at: string;
}

export type ContentType =
  | 'blog_post'
  | 'how_to_guide'
  | 'listicle'
  | 'comparison'
  | 'review'
  | 'news'
  | 'opinion'
  | 'case_study'
  | 'interview'
  | 'roundup'
  | 'pillar_content';

export interface ContributorFilters {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateContributorInput {
  name: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  style_proxy?: string;
  style_proxy_description?: string;
  voice_profile?: Partial<ContributorVoice>;
  expertise_areas?: string[];
  content_types?: ContentType[];
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateContributorInput extends Partial<CreateContributorInput> {
  id: string;
}

interface UseContributorsProps {
  supabase: SupabaseClient;
  filters?: ContributorFilters;
  autoFetch?: boolean;
}

export function useContributors({ supabase, filters = {}, autoFetch = true }: UseContributorsProps) {
  const { tenantId } = useTenant();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContributors = useCallback(async (customFilters?: ContributorFilters) => {
    if (!tenantId) {
      setContributors([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = { ...filters, ...customFilters };
      let query = supabase
        .from('contributors')
        .select('*')
        .eq('tenant_id', tenantId);

      // Apply active filter
      if (activeFilters.isActive !== undefined) {
        query = query.eq('is_active', activeFilters.isActive);
      }

      // Apply search
      if (activeFilters.search) {
        query = query.or(`name.ilike.%${activeFilters.search}%,display_name.ilike.%${activeFilters.search}%`);
      }

      // Order by name
      query = query.order('name', { ascending: true });

      // Apply pagination
      if (activeFilters.limit) {
        query = query.limit(activeFilters.limit);
      }
      if (activeFilters.offset) {
        query = query.range(activeFilters.offset, activeFilters.offset + (activeFilters.limit || 10) - 1);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setContributors(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contributors'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tenantId, filters]);

  const getContributor = useCallback(async (id: string): Promise<Contributor | null> => {
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }, [supabase, tenantId]);

  const getDefaultContributor = useCallback(async (): Promise<Contributor | null> => {
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  }, [supabase, tenantId]);

  const createContributor = useCallback(async (input: CreateContributorInput): Promise<Contributor> => {
    if (!tenantId) throw new Error('No tenant context');

    const defaultVoiceProfile: ContributorVoice = {
      formality_scale: 5,
      description: '',
      guidelines: '',
      signature_phrases: [],
      transition_words: [],
      phrases_to_avoid: [],
      topics_to_avoid: [],
      writing_samples: [],
    };

    const { data, error } = await supabase
      .from('contributors')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        display_name: input.display_name || input.name,
        avatar_url: input.avatar_url,
        bio: input.bio,
        style_proxy: input.style_proxy,
        style_proxy_description: input.style_proxy_description,
        voice_profile: { ...defaultVoiceProfile, ...input.voice_profile },
        expertise_areas: input.expertise_areas || [],
        content_types: input.content_types || ['blog_post'],
        is_active: input.is_active ?? true,
        is_default: input.is_default ?? false,
        article_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // If this is set as default, unset others
    if (input.is_default) {
      await supabase
        .from('contributors')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .neq('id', data.id);
    }

    // Refresh the list
    fetchContributors();

    return data;
  }, [supabase, tenantId, fetchContributors]);

  const updateContributor = useCallback(async (input: UpdateContributorInput): Promise<Contributor> => {
    if (!tenantId) throw new Error('No tenant context');

    const updateData: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    delete updateData.id;

    const { data, error } = await supabase
      .from('contributors')
      .update(updateData)
      .eq('id', input.id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // If this is set as default, unset others
    if (input.is_default) {
      await supabase
        .from('contributors')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .neq('id', input.id);
    }

    // Update local state
    setContributors(prev => prev.map(c => c.id === input.id ? data : c));

    return data;
  }, [supabase, tenantId]);

  const deleteContributor = useCallback(async (id: string): Promise<void> => {
    if (!tenantId) throw new Error('No tenant context');

    const { error } = await supabase
      .from('contributors')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    // Update local state
    setContributors(prev => prev.filter(c => c.id !== id));
  }, [supabase, tenantId]);

  const setDefaultContributor = useCallback(async (id: string): Promise<Contributor> => {
    if (!tenantId) throw new Error('No tenant context');

    // Unset current default
    await supabase
      .from('contributors')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('is_default', true);

    // Set new default
    const { data, error } = await supabase
      .from('contributors')
      .update({ is_default: true })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    setContributors(prev => prev.map(c => ({
      ...c,
      is_default: c.id === id,
    })));

    return data;
  }, [supabase, tenantId]);

  // Auto-fetch on mount or when filters change
  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchContributors();
    }
  }, [autoFetch, tenantId, fetchContributors]);

  return {
    contributors,
    isLoading,
    error,
    fetchContributors,
    getContributor,
    getDefaultContributor,
    createContributor,
    updateContributor,
    deleteContributor,
    setDefaultContributor,
    refetch: fetchContributors,
  };
}

export default useContributors;
