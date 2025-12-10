import { useCallback, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from './useTenant';

export type ApiProvider = 'grok' | 'claude' | 'stealthgpt' | 'wordpress';

export interface ApiKeyConfig {
  id: string;
  tenant_id: string;
  provider: ApiProvider;
  is_configured: boolean;
  last_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyStatus {
  provider: ApiProvider;
  name: string;
  description: string;
  isConfigured: boolean;
  lastVerified?: string;
}

interface UseApiKeysProps {
  supabase: SupabaseClient;
  autoFetch?: boolean;
}

const PROVIDER_INFO: Record<ApiProvider, { name: string; description: string }> = {
  grok: {
    name: 'Grok (xAI)',
    description: 'Primary AI provider for content generation',
  },
  claude: {
    name: 'Claude (Anthropic)',
    description: 'Alternative AI provider for content generation',
  },
  stealthgpt: {
    name: 'StealthGPT',
    description: 'AI humanization service for natural-sounding content',
  },
  wordpress: {
    name: 'WordPress',
    description: 'Content publishing integration',
  },
};

export function useApiKeys({ supabase, autoFetch = true }: UseApiKeysProps) {
  const { tenantId } = useTenant();
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!tenantId) {
      // Return default unconfigured state for all providers
      setApiKeys(
        Object.entries(PROVIDER_INFO).map(([provider, info]) => ({
          provider: provider as ApiProvider,
          name: info.name,
          description: info.description,
          isConfigured: false,
        }))
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tenant_api_keys')
        .select('id, tenant_id, provider, last_verified_at, created_at, updated_at')
        .eq('tenant_id', tenantId);

      if (queryError) throw queryError;

      // Map database records to status objects
      const configuredProviders = new Map(
        (data || []).map((key) => [key.provider, key])
      );

      const statuses: ApiKeyStatus[] = Object.entries(PROVIDER_INFO).map(
        ([provider, info]) => {
          const dbRecord = configuredProviders.get(provider);
          return {
            provider: provider as ApiProvider,
            name: info.name,
            description: info.description,
            isConfigured: !!dbRecord,
            lastVerified: dbRecord?.last_verified_at,
          };
        }
      );

      setApiKeys(statuses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch API keys'));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tenantId]);

  const saveApiKey = useCallback(
    async (provider: ApiProvider, apiKey: string): Promise<void> => {
      if (!tenantId) throw new Error('No tenant context');

      // Call the RPC function to store the encrypted key
      const { error: rpcError } = await supabase.rpc('store_api_key', {
        p_tenant_id: tenantId,
        p_provider: provider,
        p_api_key: apiKey,
      });

      if (rpcError) throw rpcError;

      // Update local state
      setApiKeys((prev) =>
        prev.map((key) =>
          key.provider === provider
            ? { ...key, isConfigured: true, lastVerified: new Date().toISOString() }
            : key
        )
      );
    },
    [supabase, tenantId]
  );

  const deleteApiKey = useCallback(
    async (provider: ApiProvider): Promise<void> => {
      if (!tenantId) throw new Error('No tenant context');

      const { error: deleteError } = await supabase
        .from('tenant_api_keys')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('provider', provider);

      if (deleteError) throw deleteError;

      // Update local state
      setApiKeys((prev) =>
        prev.map((key) =>
          key.provider === provider
            ? { ...key, isConfigured: false, lastVerified: undefined }
            : key
        )
      );
    },
    [supabase, tenantId]
  );

  const verifyApiKey = useCallback(
    async (provider: ApiProvider): Promise<boolean> => {
      if (!tenantId) throw new Error('No tenant context');

      try {
        // Call the verification edge function
        const { data, error: verifyError } = await supabase.functions.invoke(
          'verify-api-key',
          {
            body: { provider },
          }
        );

        if (verifyError) throw verifyError;

        const isValid = data?.valid === true;

        if (isValid) {
          // Update verification timestamp
          await supabase
            .from('tenant_api_keys')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('tenant_id', tenantId)
            .eq('provider', provider);

          // Update local state
          setApiKeys((prev) =>
            prev.map((key) =>
              key.provider === provider
                ? { ...key, lastVerified: new Date().toISOString() }
                : key
            )
          );
        }

        return isValid;
      } catch (err) {
        console.error('API key verification failed:', err);
        return false;
      }
    },
    [supabase, tenantId]
  );

  const getDecryptedKey = useCallback(
    async (provider: ApiProvider): Promise<string | null> => {
      if (!tenantId) return null;

      // This should only be called server-side (Edge Functions)
      // Client-side should never have access to decrypted keys
      const { data, error: rpcError } = await supabase.rpc('get_decrypted_api_key', {
        p_tenant_id: tenantId,
        p_provider: provider,
      });

      if (rpcError) throw rpcError;
      return data;
    },
    [supabase, tenantId]
  );

  // Auto-fetch on mount or when tenant changes
  useEffect(() => {
    if (autoFetch) {
      fetchApiKeys();
    }
  }, [autoFetch, tenantId, fetchApiKeys]);

  return {
    apiKeys,
    isLoading,
    error,
    fetchApiKeys,
    saveApiKey,
    deleteApiKey,
    verifyApiKey,
    getDecryptedKey,
    refetch: fetchApiKeys,
  };
}

export default useApiKeys;
