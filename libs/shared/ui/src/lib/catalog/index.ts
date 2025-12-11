/**
 * Catalog Components
 *
 * UI components for managing the site catalog (tenant_site_catalog).
 * Includes entry management, sync configuration, and statistics.
 */

export { SiteCatalogManager } from './SiteCatalogManager';
export { CatalogEntryCard } from './CatalogEntryCard';
export { CatalogSyncPanel } from './CatalogSyncPanel';
export { CatalogStatsWidget } from './CatalogStatsWidget';

// Re-export types from internal-linking
export type { SiteCatalogEntry } from '@content-engine/types';
