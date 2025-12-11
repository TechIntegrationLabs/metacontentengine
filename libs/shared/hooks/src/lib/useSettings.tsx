import { useCallback, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from './useTenant';

/**
 * Tenant Settings Schema
 * Stored as key-value pairs in tenant_settings table
 */
export interface TenantSettings {
  // Publishing
  autoPublishEnabled: boolean;
  autoPublishDelay: number; // minutes after QA pass
  defaultPublishStatus: 'draft' | 'pending' | 'publish';

  // Quality
  minimumQualityScore: number;
  autoRejectBelowScore: number;
  requireHumanReview: boolean;

  // Generation
  defaultAiProvider: 'grok' | 'claude' | 'stealthgpt';
  defaultWordCount: { min: number; max: number };

  // Notifications
  emailOnPublish: boolean;
  emailOnQaFail: boolean;
  webhookNotifications: boolean;

  // UI Preferences
  theme: 'dark' | 'light';
  defaultView: 'kanban' | 'list';
  articlesPerPage: number;
}

/**
 * Default settings that apply when no custom values are set
 */
const DEFAULT_SETTINGS: TenantSettings = {
  // Publishing
  autoPublishEnabled: false,
  autoPublishDelay: 30,
  defaultPublishStatus: 'draft',

  // Quality
  minimumQualityScore: 70,
  autoRejectBelowScore: 50,
  requireHumanReview: true,

  // Generation
  defaultAiProvider: 'grok',
  defaultWordCount: { min: 1200, max: 2000 },

  // Notifications
  emailOnPublish: true,
  emailOnQaFail: true,
  webhookNotifications: false,

  // UI Preferences
  theme: 'dark',
  defaultView: 'kanban',
  articlesPerPage: 25,
};

interface UseSettingsProps {
  supabase: SupabaseClient;
  autoFetch?: boolean;
}

interface UseSettingsReturn {
  settings: TenantSettings;
  isLoading: boolean;
  error: Error | null;
  updateSetting: <K extends keyof TenantSettings>(
    key: K,
    value: TenantSettings[K]
  ) => Promise<void>;
  bulkUpdate: (updates: Partial<TenantSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing tenant settings with optimistic updates and caching
 *
 * @example
 * ```tsx
 * const { settings, updateSetting, bulkUpdate } = useSettings({ supabase });
 *
 * // Update a single setting
 * await updateSetting('autoPublishEnabled', true);
 *
 * // Bulk update multiple settings
 * await bulkUpdate({
 *   minimumQualityScore: 80,
 *   requireHumanReview: false,
 * });
 * ```
 */
export function useSettings({
  supabase,
  autoFetch = true
}: UseSettingsProps): UseSettingsReturn {
  const { tenantId } = useTenant();
  const [settings, setSettings] = useState<TenantSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all settings from the database and merge with defaults
   */
  const fetchSettings = useCallback(async () => {
    if (!tenantId) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tenant_settings')
        .select('key, value')
        .eq('tenant_id', tenantId);

      if (queryError) throw queryError;

      // Merge database settings with defaults
      const mergedSettings: TenantSettings = { ...DEFAULT_SETTINGS };

      if (data) {
        data.forEach((row) => {
          const key = row.key as keyof TenantSettings;
          if (key in DEFAULT_SETTINGS) {
            (mergedSettings as any)[key] = row.value;
          }
        });
      }

      setSettings(mergedSettings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch settings'));
      // On error, fall back to defaults
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tenantId]);

  /**
   * Update a single setting with optimistic update and rollback on error
   */
  const updateSetting = useCallback(
    async <K extends keyof TenantSettings>(
      key: K,
      value: TenantSettings[K]
    ): Promise<void> => {
      if (!tenantId) throw new Error('No tenant context');

      // Optimistic update
      const previousSettings = settings;
      setSettings((prev) => ({ ...prev, [key]: value }));

      try {
        const { error: upsertError } = await supabase
          .from('tenant_settings')
          .upsert(
            {
              tenant_id: tenantId,
              key: key as string,
              value: value as any,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'tenant_id,key',
            }
          );

        if (upsertError) throw upsertError;
      } catch (err) {
        // Rollback on error
        setSettings(previousSettings);
        throw err instanceof Error ? err : new Error('Failed to update setting');
      }
    },
    [supabase, tenantId, settings]
  );

  /**
   * Update multiple settings at once with optimistic update and rollback on error
   */
  const bulkUpdate = useCallback(
    async (updates: Partial<TenantSettings>): Promise<void> => {
      if (!tenantId) throw new Error('No tenant context');

      // Optimistic update
      const previousSettings = settings;
      setSettings((prev) => ({ ...prev, ...updates }));

      try {
        const upsertData = Object.entries(updates).map(([key, value]) => ({
          tenant_id: tenantId,
          key,
          value: value as any,
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('tenant_settings')
          .upsert(upsertData, {
            onConflict: 'tenant_id,key',
          });

        if (upsertError) throw upsertError;
      } catch (err) {
        // Rollback on error
        setSettings(previousSettings);
        throw err instanceof Error ? err : new Error('Failed to update settings');
      }
    },
    [supabase, tenantId, settings]
  );

  /**
   * Reset all settings to default values
   */
  const resetToDefaults = useCallback(async (): Promise<void> => {
    if (!tenantId) throw new Error('No tenant context');

    // Optimistic update
    const previousSettings = settings;
    setSettings(DEFAULT_SETTINGS);

    try {
      const { error: deleteError } = await supabase
        .from('tenant_settings')
        .delete()
        .eq('tenant_id', tenantId);

      if (deleteError) throw deleteError;
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings);
      throw err instanceof Error ? err : new Error('Failed to reset settings');
    }
  }, [supabase, tenantId, settings]);

  /**
   * Subscribe to settings changes in real-time
   */
  useEffect(() => {
    if (!tenantId || !autoFetch) return;

    // Initial fetch
    fetchSettings();

    // Set up real-time subscription
    const channel = supabase
      .channel(`tenant_settings:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenant_settings',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // Refetch settings when they change
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tenantId, autoFetch, fetchSettings, supabase]);

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    bulkUpdate,
    resetToDefaults,
    refetch: fetchSettings,
  };
}

export default useSettings;
