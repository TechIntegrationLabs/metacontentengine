# useSettings Hook - Quick Start Guide

## Import

```typescript
import { useSettings } from '@content-engine/hooks';
import { supabase } from '@/lib/supabase';
```

## Basic Usage

```typescript
const { settings, updateSetting, bulkUpdate, isLoading } = useSettings({ supabase });

// Read a setting
console.log(settings.theme); // 'dark' | 'light'

// Update a single setting
await updateSetting('theme', 'light');

// Update multiple settings
await bulkUpdate({
  theme: 'light',
  defaultView: 'list',
  articlesPerPage: 50,
});
```

## Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoPublishEnabled` | `boolean` | `false` | Auto-publish after QA |
| `autoPublishDelay` | `number` | `30` | Minutes to wait before publishing |
| `defaultPublishStatus` | `'draft' \| 'pending' \| 'publish'` | `'draft'` | Default status for new content |
| `minimumQualityScore` | `number` | `70` | Minimum score to pass QA |
| `autoRejectBelowScore` | `number` | `50` | Auto-reject below this score |
| `requireHumanReview` | `boolean` | `true` | Require manual review |
| `defaultAiProvider` | `'grok' \| 'claude' \| 'stealthgpt'` | `'grok'` | Default AI provider |
| `defaultWordCount` | `{ min: number; max: number }` | `{ min: 1200, max: 2000 }` | Target word count range |
| `emailOnPublish` | `boolean` | `true` | Email when content published |
| `emailOnQaFail` | `boolean` | `true` | Email on QA failure |
| `webhookNotifications` | `boolean` | `false` | Send webhook notifications |
| `theme` | `'dark' \| 'light'` | `'dark'` | UI theme |
| `defaultView` | `'kanban' \| 'list'` | `'kanban'` | Default article view |
| `articlesPerPage` | `number` | `25` | Pagination size |

## Common Patterns

### Toggle Switch
```typescript
<input
  type="checkbox"
  checked={settings.autoPublishEnabled}
  onChange={(e) => updateSetting('autoPublishEnabled', e.target.checked)}
/>
```

### Select Dropdown
```typescript
<select
  value={settings.defaultAiProvider}
  onChange={(e) => updateSetting('defaultAiProvider', e.target.value)}
>
  <option value="grok">Grok</option>
  <option value="claude">Claude</option>
  <option value="stealthgpt">StealthGPT</option>
</select>
```

### Number Input
```typescript
<input
  type="number"
  value={settings.articlesPerPage}
  onChange={(e) => updateSetting('articlesPerPage', parseInt(e.target.value))}
/>
```

### Range Slider
```typescript
<input
  type="range"
  min="0"
  max="100"
  value={settings.minimumQualityScore}
  onChange={(e) => updateSetting('minimumQualityScore', parseInt(e.target.value))}
/>
```

### Form with Save Button
```typescript
const [localSettings, setLocalSettings] = useState(settings);

// Sync when loaded
useEffect(() => {
  setLocalSettings(settings);
}, [settings]);

const handleSave = async () => {
  await bulkUpdate(localSettings);
};

return (
  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
    <input
      value={localSettings.articlesPerPage}
      onChange={(e) => setLocalSettings({
        ...localSettings,
        articlesPerPage: parseInt(e.target.value)
      })}
    />
    <button type="submit">Save</button>
  </form>
);
```

## Hook Return Values

```typescript
{
  settings: TenantSettings;           // Current settings object
  isLoading: boolean;                 // True while fetching
  error: Error | null;                // Error if fetch failed
  updateSetting: (key, value) => Promise<void>;  // Update single setting
  bulkUpdate: (updates) => Promise<void>;        // Update multiple settings
  resetToDefaults: () => Promise<void>;          // Reset all to defaults
  refetch: () => Promise<void>;                  // Manually refetch
}
```

## Features

- ✅ **Optimistic Updates** - UI updates instantly
- ✅ **Auto Rollback** - Reverts on error
- ✅ **Real-time Sync** - Updates across tabs/browsers
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Caching** - Minimizes database calls
- ✅ **Default Values** - Works without database records

## Error Handling

```typescript
try {
  await updateSetting('theme', 'light');
} catch (err) {
  console.error('Failed to update setting:', err);
  // UI automatically rolled back to previous value
}
```

## Full Documentation

See `useSettings.README.md` for complete documentation and advanced examples.
