# Site Catalog Components

UI components for managing the site catalog (`tenant_site_catalog` table) in the Meta Content Engine. These components provide a complete interface for viewing, syncing, and managing catalog entries used for intelligent internal linking.

## Components

### SiteCatalogManager

Main catalog management view with search, filtering, and bulk actions.

**Features:**
- Grid/table view of catalog entries
- Search by title, URL, or content
- Filter by topics and keywords
- Bulk sync and delete operations
- Manual entry addition
- Sitemap import

**Usage:**
```tsx
import { SiteCatalogManager } from '@content-engine/ui';

function CatalogPage() {
  const [entries, setEntries] = useState<SiteCatalogEntry[]>([]);

  return (
    <SiteCatalogManager
      entries={entries}
      isLoading={false}
      onSync={(entryIds) => handleSync(entryIds)}
      onDelete={(entryIds) => handleDelete(entryIds)}
      onUpdate={(entryId, updates) => handleUpdate(entryId, updates)}
      onAddEntry={(url) => handleAddEntry(url)}
      onImportSitemap={(url) => handleImportSitemap(url)}
    />
  );
}
```

### CatalogEntryCard

Individual catalog entry card showing details and actions.

**Features:**
- Entry title, URL, excerpt
- Topics and keywords as tags
- Link statistics (links to/from)
- Sync status indicator
- Pillar content badge
- Quick actions (sync, edit, delete)

**Usage:**
```tsx
import { CatalogEntryCard } from '@content-engine/ui';

function EntryList({ entries }: { entries: SiteCatalogEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {entries.map((entry) => (
        <CatalogEntryCard
          key={entry.id}
          entry={entry}
          selected={false}
          onSelect={() => handleSelect(entry.id)}
          onSync={() => handleSync(entry.id)}
          onDelete={() => handleDelete(entry.id)}
          onUpdate={(updates) => handleUpdate(entry.id, updates)}
        />
      ))}
    </div>
  );
}
```

### CatalogSyncPanel

Sync configuration panel for sitemap URL and schedule.

**Features:**
- Sitemap URL configuration
- Sync schedule (manual, daily, weekly)
- Real-time sync progress
- Sync statistics
- Error display
- Enable/disable toggle

**Usage:**
```tsx
import { CatalogSyncPanel } from '@content-engine/ui';

function SyncSettings() {
  const [config, setConfig] = useState({
    sitemap_url: 'https://example.com/sitemap.xml',
    schedule: 'daily',
    last_sync_at: new Date().toISOString(),
    next_sync_at: null,
    sync_status: 'idle',
    sync_error: null,
    total_entries: 100,
    synced_entries: 95,
    failed_entries: 5,
    is_enabled: true,
  });

  return (
    <CatalogSyncPanel
      config={config}
      onUpdateConfig={(updates) => setConfig({ ...config, ...updates })}
      onSyncNow={() => handleSyncNow()}
      onToggleSync={() => handleToggle()}
    />
  );
}
```

### CatalogStatsWidget

Overview widget showing catalog statistics and health metrics.

**Features:**
- Total entries count
- Pillar content count
- Topic and keyword counts
- Average links per entry
- Sync health indicator
- Coverage percentage
- Topic distribution pie chart

**Usage:**
```tsx
import { CatalogStatsWidget } from '@content-engine/ui';

function Dashboard() {
  const stats = {
    total_entries: 150,
    active_entries: 145,
    pillar_entries: 12,
    synced_entries: 148,
    error_entries: 2,
    pending_entries: 0,
    total_topics: 25,
    total_keywords: 180,
    avg_links_per_entry: 3.5,
    coverage_percentage: 85,
    topic_distribution: [
      { topic: 'Education', count: 45, percentage: 30 },
      { topic: 'Technology', count: 30, percentage: 20 },
      // ...
    ],
  };

  return (
    <CatalogStatsWidget stats={stats} />
  );
}
```

## Data Types

### SiteCatalogEntry

```typescript
interface SiteCatalogEntry {
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
```

## Design System

All components follow the "Kinetic Modernism" design system:

**Colors:**
- `forge-orange` (#f97316) - Primary actions, accents
- `forge-indigo` (#6366f1) - Topics, secondary actions
- `forge-purple` (#8b5cf6) - Keywords, pillar content
- `void-*` - Dark backgrounds
- `glass-card` - Frosted glass surfaces

**Typography:**
- Display: Manrope
- Body: Space Grotesk

**Components:**
- Glass morphism effects
- Smooth transitions
- Lucide React icons
- Responsive grid layouts

## Integration with InternalLinkService

These components are designed to work with the `InternalLinkService` from `@content-engine/generation`:

```typescript
import { InternalLinkService } from '@content-engine/generation';

// Fetch catalog entries
const entries = await linkService.getCatalogEntries(tenantId, {
  isActive: true,
  topics: ['education'],
});

// Sync from sitemap
await linkService.syncFromSitemap(tenantId, sitemapUrl);

// Get statistics
const stats = await linkService.getCatalogStats(tenantId);
```

## Backend Requirements

### Supabase Edge Functions

Create these Edge Functions to support the UI:

1. **catalog-sync** - Sync entries from sitemap
2. **catalog-stats** - Get catalog statistics
3. **catalog-update** - Update catalog entries

### Database

The `tenant_site_catalog` table should be created via migrations with RLS policies for tenant isolation.

## Best Practices

1. **Lazy Loading**: Use pagination for large catalogs (>100 entries)
2. **Real-time Updates**: Use Supabase Realtime for sync progress
3. **Error Handling**: Display user-friendly error messages
4. **Optimistic Updates**: Update UI immediately, sync with backend
5. **Caching**: Cache catalog stats to reduce database load

## Examples

### Full Catalog Management Page

```tsx
import {
  SiteCatalogManager,
  CatalogSyncPanel,
  CatalogStatsWidget,
} from '@content-engine/ui';

function CatalogManagementPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Stats Overview */}
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
```

## Related Components

- **InternalLinkSuggester** (`libs/shared/ui/src/lib/linking`) - Suggests internal links using catalog
- **KeywordLookupPanel** (`libs/shared/ui/src/lib/keywords`) - Keyword research for catalog entries

## License

Part of Meta Content Engine - Perdia Platform
