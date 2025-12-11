# useSettings Hook

Manages tenant-level settings persistence with optimistic updates, caching, and real-time synchronization.

## Features

- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Bulk Operations**: Update multiple settings in a single transaction
- **Real-time Sync**: Automatically updates when settings change (via Supabase subscriptions)
- **Type Safety**: Fully typed settings schema with TypeScript
- **Default Values**: Graceful fallback to defaults when no custom values exist
- **Caching**: Reduces API calls by maintaining local state

## Installation

The hook is exported from `@content-engine/hooks`:

```typescript
import { useSettings } from '@content-engine/hooks';
```

## Settings Schema

```typescript
interface TenantSettings {
  // Publishing
  autoPublishEnabled: boolean;
  autoPublishDelay: number;
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
```

## Default Values

```typescript
{
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
}
```

## Usage

### Basic Usage

```typescript
import { useSettings } from '@content-engine/hooks';
import { supabase } from '@/lib/supabase';

function SettingsPage() {
  const { settings, updateSetting, isLoading } = useSettings({ supabase });

  const handleToggleAutoPublish = async () => {
    try {
      await updateSetting('autoPublishEnabled', !settings.autoPublishEnabled);
      console.log('Setting updated!');
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.autoPublishEnabled}
          onChange={handleToggleAutoPublish}
        />
        Auto-publish enabled
      </label>
    </div>
  );
}
```

### Bulk Updates

```typescript
const { settings, bulkUpdate } = useSettings({ supabase });

const handleSaveQualitySettings = async () => {
  try {
    await bulkUpdate({
      minimumQualityScore: 80,
      autoRejectBelowScore: 60,
      requireHumanReview: true,
    });
    alert('Settings saved!');
  } catch (err) {
    console.error('Failed to save:', err);
    // Changes are automatically rolled back
  }
};
```

### Form with Local State

```typescript
const { settings, bulkUpdate, isLoading } = useSettings({ supabase });
const [localSettings, setLocalSettings] = useState({
  theme: settings.theme,
  defaultView: settings.defaultView,
  articlesPerPage: settings.articlesPerPage,
});

// Sync with loaded settings
useEffect(() => {
  setLocalSettings({
    theme: settings.theme,
    defaultView: settings.defaultView,
    articlesPerPage: settings.articlesPerPage,
  });
}, [settings]);

const handleSave = async () => {
  try {
    await bulkUpdate(localSettings);
    alert('Saved!');
  } catch (err) {
    console.error('Failed:', err);
  }
};

return (
  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
    <select
      value={localSettings.theme}
      onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value })}
    >
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
    <button type="submit">Save</button>
  </form>
);
```

### Reset to Defaults

```typescript
const { resetToDefaults } = useSettings({ supabase });

const handleReset = async () => {
  if (confirm('Reset all settings to defaults?')) {
    try {
      await resetToDefaults();
      alert('Settings reset!');
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  }
};
```

## API Reference

### Hook Parameters

```typescript
interface UseSettingsProps {
  supabase: SupabaseClient;  // Supabase client instance
  autoFetch?: boolean;       // Auto-fetch on mount (default: true)
}
```

### Return Value

```typescript
interface UseSettingsReturn {
  settings: TenantSettings;                           // Current settings
  isLoading: boolean;                                 // Loading state
  error: Error | null;                                // Error state
  updateSetting: <K extends keyof TenantSettings>(    // Update single setting
    key: K,
    value: TenantSettings[K]
  ) => Promise<void>;
  bulkUpdate: (                                       // Update multiple settings
    updates: Partial<TenantSettings>
  ) => Promise<void>;
  resetToDefaults: () => Promise<void>;               // Reset all to defaults
  refetch: () => Promise<void>;                       // Manually refetch
}
```

## Database Schema

Settings are stored in the `tenant_settings` table:

```sql
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);
```

Each setting is stored as a separate row with the key as the setting name and value as JSONB.

## Features in Detail

### Optimistic Updates

When you call `updateSetting` or `bulkUpdate`, the UI updates immediately. If the database operation fails, changes are automatically rolled back:

```typescript
// UI updates immediately
await updateSetting('theme', 'light');

// If the above fails, UI automatically reverts to previous value
```

### Real-time Synchronization

The hook subscribes to Supabase real-time events. When settings change (even from another browser/tab), all subscribed components update automatically:

```typescript
// Component A updates a setting
await updateSetting('theme', 'light');

// Component B automatically receives the update
// No manual refetch needed!
```

### Type Safety

All setting keys and values are fully typed:

```typescript
// ✅ Valid
await updateSetting('theme', 'dark');

// ❌ TypeScript error - invalid key
await updateSetting('invalidKey', 'value');

// ❌ TypeScript error - invalid value type
await updateSetting('theme', 'invalid');
```

## Best Practices

1. **Use local state for forms**: Don't update settings on every keystroke. Collect changes in local state and bulk update on save.

2. **Handle errors gracefully**: Always wrap update calls in try-catch:
   ```typescript
   try {
     await updateSetting(key, value);
   } catch (err) {
     // Show error to user
     showErrorToast(err.message);
   }
   ```

3. **Validate before updating**: Add custom validation before calling the hook:
   ```typescript
   if (newScore < settings.autoRejectBelowScore) {
     alert('Minimum score cannot be less than auto-reject score');
     return;
   }
   await updateSetting('minimumQualityScore', newScore);
   ```

4. **Leverage real-time sync**: Don't manually refetch. The hook handles it automatically.

5. **Use TypeScript**: The hook is fully typed. Let TypeScript catch errors at compile time.

## Troubleshooting

### Settings not persisting

Check that:
- Tenant ID is available in the context
- User is authenticated
- RLS policies allow the user to modify settings

### Settings not syncing across tabs

- Ensure `autoFetch` is `true` (default)
- Check Supabase real-time is enabled for your project
- Verify browser supports WebSockets

### Type errors

- Ensure you're importing `TenantSettings` from `@content-engine/hooks`
- Check that your TypeScript version is 4.5+

## Examples

See `useSettings.example.tsx` for complete examples including:
- Basic usage
- Bulk updates
- Form handling
- Reset to defaults
- Conditional rendering
- Business logic integration
- Real-time sync
- Error handling
- Custom validation
- Configuration objects

## Related

- `useTenant` - Access tenant context
- `useApiKeys` - Manage API keys (similar pattern)
- `tenant_settings` table migration
