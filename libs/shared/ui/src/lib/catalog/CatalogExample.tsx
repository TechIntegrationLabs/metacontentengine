/**
 * Catalog Components Usage Example
 *
 * This example shows how to use all the catalog components together
 * in a complete catalog management page.
 */

import React, { useState, useEffect } from 'react';
import type { SiteCatalogEntry } from '@content-engine/types';
import { SiteCatalogManager } from './SiteCatalogManager';
import { CatalogSyncPanel } from './CatalogSyncPanel';
import { CatalogStatsWidget } from './CatalogStatsWidget';

export function CatalogManagementPage() {
  const [entries, setEntries] = useState<SiteCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncConfig, setSyncConfig] = useState({
    sitemap_url: 'https://example.com/sitemap.xml',
    schedule: 'daily' as const,
    last_sync_at: new Date().toISOString(),
    next_sync_at: null,
    sync_status: 'idle' as const,
    sync_error: null,
    total_entries: 0,
    synced_entries: 0,
    failed_entries: 0,
    is_enabled: true,
  });
  const [stats, setStats] = useState({
    total_entries: 0,
    active_entries: 0,
    pillar_entries: 0,
    synced_entries: 0,
    error_entries: 0,
    pending_entries: 0,
    total_topics: 0,
    total_keywords: 0,
    avg_links_per_entry: 0,
    coverage_percentage: 0,
    topic_distribution: [] as Array<{
      topic: string;
      count: number;
      percentage: number;
    }>,
  });

  // Load catalog entries
  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase query
      // const { data } = await supabase
      //   .from('tenant_site_catalog')
      //   .select('*')
      //   .eq('tenant_id', tenantId)
      //   .eq('is_active', true)
      //   .order('last_synced_at', { ascending: false });

      // Mock data for example
      const mockEntries: SiteCatalogEntry[] = [
        {
          id: '1',
          tenant_id: 'tenant-1',
          url: 'https://example.com/article-1',
          slug: 'article-1',
          wp_post_id: 123,
          title: 'Best Online MBA Programs 2024',
          excerpt: 'Comprehensive guide to top online MBA programs...',
          content_html: null,
          content_text: null,
          topics: ['MBA', 'Education', 'Business'],
          keywords: ['online MBA', 'business degree', 'graduate programs'],
          author_name: 'John Doe',
          category_name: 'Graduate Programs',
          published_at: '2024-01-15T10:00:00Z',
          word_count: 2500,
          times_linked_to: 15,
          times_linked_from: 8,
          relevance_score: 85,
          is_active: true,
          is_pillar: true,
          last_synced_at: '2024-12-10T08:00:00Z',
          sync_status: 'synced',
          sync_error: null,
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-12-10T08:00:00Z',
        },
        // Add more mock entries as needed
      ];

      setEntries(mockEntries);
      calculateStats(mockEntries);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (catalogEntries: SiteCatalogEntry[]) => {
    const topicCounts = new Map<string, number>();
    let totalLinks = 0;

    catalogEntries.forEach((entry) => {
      // Count topics
      entry.topics.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
      // Count links
      totalLinks += entry.times_linked_to + entry.times_linked_from;
    });

    const topicDistribution = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: (count / catalogEntries.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    setStats({
      total_entries: catalogEntries.length,
      active_entries: catalogEntries.filter((e) => e.is_active).length,
      pillar_entries: catalogEntries.filter((e) => e.is_pillar).length,
      synced_entries: catalogEntries.filter((e) => e.sync_status === 'synced').length,
      error_entries: catalogEntries.filter((e) => e.sync_status === 'error').length,
      pending_entries: catalogEntries.filter((e) => e.sync_status === 'pending').length,
      total_topics: topicCounts.size,
      total_keywords: new Set(catalogEntries.flatMap((e) => e.keywords)).size,
      avg_links_per_entry: catalogEntries.length > 0 ? totalLinks / catalogEntries.length : 0,
      coverage_percentage: 75, // Calculate based on total site pages
      topic_distribution: topicDistribution,
    });

    setSyncConfig((prev) => ({
      ...prev,
      total_entries: catalogEntries.length,
      synced_entries: catalogEntries.filter((e) => e.sync_status === 'synced').length,
      failed_entries: catalogEntries.filter((e) => e.sync_status === 'error').length,
    }));
  };

  const handleSync = async (entryIds?: string[]) => {
    try {
      // TODO: Call Supabase Edge Function to sync catalog
      // await supabase.functions.invoke('catalog-sync', {
      //   body: { entryIds },
      // });

      console.log('Syncing entries:', entryIds || 'all');
      await loadCatalog();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleDelete = async (entryIds: string[]) => {
    try {
      // TODO: Delete from Supabase
      // await supabase
      //   .from('tenant_site_catalog')
      //   .delete()
      //   .in('id', entryIds);

      console.log('Deleting entries:', entryIds);
      setEntries((prev) => prev.filter((e) => !entryIds.includes(e.id)));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleUpdate = async (entryId: string, updates: Partial<SiteCatalogEntry>) => {
    try {
      // TODO: Update in Supabase
      // await supabase
      //   .from('tenant_site_catalog')
      //   .update(updates)
      //   .eq('id', entryId);

      console.log('Updating entry:', entryId, updates);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, ...updates } : e))
      );
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleAddEntry = async (url: string) => {
    try {
      // TODO: Call Supabase Edge Function to fetch and index URL
      // await supabase.functions.invoke('catalog-add-entry', {
      //   body: { url },
      // });

      console.log('Adding entry:', url);
      await loadCatalog();
    } catch (error) {
      console.error('Add entry failed:', error);
    }
  };

  const handleImportSitemap = async (url: string) => {
    try {
      // TODO: Call Supabase Edge Function to import from sitemap
      // await supabase.functions.invoke('catalog-import-sitemap', {
      //   body: { sitemapUrl: url },
      // });

      console.log('Importing sitemap:', url);
      setSyncConfig((prev) => ({ ...prev, sync_status: 'running' }));

      // Simulate import progress
      setTimeout(async () => {
        await loadCatalog();
        setSyncConfig((prev) => ({ ...prev, sync_status: 'success' }));
      }, 3000);
    } catch (error) {
      console.error('Sitemap import failed:', error);
      setSyncConfig((prev) => ({
        ...prev,
        sync_status: 'error',
        sync_error: 'Failed to import sitemap',
      }));
    }
  };

  const handleUpdateConfig = (updates: Partial<typeof syncConfig>) => {
    setSyncConfig((prev) => ({ ...prev, ...updates }));
    // TODO: Save config to database or settings
  };

  const handleSyncNow = async () => {
    await handleSync();
  };

  const handleToggleSync = () => {
    setSyncConfig((prev) => ({ ...prev, is_enabled: !prev.is_enabled }));
    // TODO: Save enabled state to database
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Site Catalog Management
        </h1>
        <p className="text-gray-400">
          Manage your site's content catalog for intelligent internal linking
        </p>
      </div>

      {/* Stats and Sync Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CatalogStatsWidget stats={stats} />
        </div>
        <div>
          <CatalogSyncPanel
            config={syncConfig}
            onUpdateConfig={handleUpdateConfig}
            onSyncNow={handleSyncNow}
            onToggleSync={handleToggleSync}
          />
        </div>
      </div>

      {/* Catalog Manager */}
      <SiteCatalogManager
        entries={entries}
        isLoading={isLoading}
        onSync={handleSync}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onAddEntry={handleAddEntry}
        onImportSitemap={handleImportSitemap}
      />
    </div>
  );
}

export default CatalogManagementPage;
