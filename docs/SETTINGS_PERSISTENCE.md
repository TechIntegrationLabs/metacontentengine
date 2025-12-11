# Settings Persistence Implementation

## Overview

Implemented a comprehensive settings persistence system for the Meta Content Engine using the `useSettings` hook. This allows tenant-level configuration to be stored in Supabase and accessed throughout the application.

## What Was Implemented

### 1. `useSettings` Hook (`libs/shared/hooks/src/lib/useSettings.tsx`)

A React hook that manages tenant settings with:
- **Optimistic updates**: UI updates immediately, rolls back on error
- **Bulk operations**: Update multiple settings in a single transaction
- **Real-time sync**: Automatically subscribes to settings changes via Supabase
- **Caching**: Maintains local state to reduce API calls
- **Type safety**: Fully typed settings schema
- **Default values**: Graceful fallback when no custom values exist

#### API Methods:
- `updateSetting(key, value)` - Update a single setting
- `bulkUpdate(updates)` - Update multiple settings at once
- `resetToDefaults()` - Reset all settings to default values
- `refetch()` - Manually refetch settings

### 2. Settings Schema

```typescript
interface TenantSettings {
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
```

### 3. Updated Settings Page (`apps/geteducated/src/app/pages/Settings.tsx`)

Enhanced the Settings UI with three components using the hook:

#### **GeneralSettings**
- Theme selection (dark/light)
- Default view (kanban/list)
- Articles per page
- Default AI provider

#### **PublishingSettings** (NEW)
- Auto-publish toggle with delay configuration
- Default publish status
- Quality score thresholds (minimum and auto-reject)
- Human review requirement toggle
- Word count range configuration

#### **NotificationSettings**
- Email on publish toggle
- Email on QA failure toggle
- Webhook notifications toggle

All components feature:
- Real-time loading states
- Success notifications
- Error handling with rollback
- Optimistic UI updates

### 4. Documentation

Created comprehensive documentation:
- **`useSettings.README.md`** - Full hook documentation with API reference
- **`useSettings.example.tsx`** - 10+ code examples covering all use cases
- **`SETTINGS_PERSISTENCE.md`** - This implementation guide

## Database Schema

Settings are stored in the existing `tenant_settings` table:

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

Each setting is stored as a key-value pair with JSONB values for flexibility.

## Usage Examples

### Simple Toggle
```typescript
const { settings, updateSetting } = useSettings({ supabase });

await updateSetting('autoPublishEnabled', true);
```

### Bulk Update with Form
```typescript
const { settings, bulkUpdate } = useSettings({ supabase });
const [localSettings, setLocalSettings] = useState({ ...settings });

// User edits form
setLocalSettings({ ...localSettings, theme: 'light' });

// Save all changes at once
await bulkUpdate(localSettings);
```

### Conditional Logic
```typescript
const { settings } = useSettings({ supabase });

if (settings.autoPublishEnabled && !settings.requireHumanReview) {
  // Auto-publish logic
  schedulePublish(settings.autoPublishDelay);
}
```

## Integration Points

The `useSettings` hook can be used throughout the application:

### Content Generation
```typescript
const { settings } = useSettings({ supabase });

const generateContent = async () => {
  return await aiProvider.generate({
    provider: settings.defaultAiProvider,
    wordCount: settings.defaultWordCount,
  });
};
```

### Quality Checks
```typescript
const { settings } = useSettings({ supabase });

const checkQuality = (score: number) => {
  if (score < settings.autoRejectBelowScore) {
    return 'reject';
  }
  if (score < settings.minimumQualityScore) {
    return 'review';
  }
  return 'pass';
};
```

### Publishing Workflow
```typescript
const { settings } = useSettings({ supabase });

const publishArticle = async (article: Article) => {
  if (!settings.autoPublishEnabled || settings.requireHumanReview) {
    // Queue for review
    return;
  }

  // Schedule auto-publish
  setTimeout(() => {
    publish(article, settings.defaultPublishStatus);
  }, settings.autoPublishDelay * 60 * 1000);
};
```

## Files Changed/Created

### Created
- `libs/shared/hooks/src/lib/useSettings.tsx` - Main hook implementation
- `libs/shared/hooks/src/lib/useSettings.example.tsx` - Usage examples
- `libs/shared/hooks/src/lib/useSettings.README.md` - Hook documentation
- `docs/SETTINGS_PERSISTENCE.md` - This file

### Modified
- `libs/shared/hooks/src/lib/hooks.tsx` - Added useSettings export
- `apps/geteducated/src/app/pages/Settings.tsx` - Integrated hook into UI
- `libs/shared/types/src/lib/analytics.ts` - Fixed type naming conflict

## Testing

### Build Verification
All builds passing:
```bash
✓ nx run hooks:build
✓ nx run geteducated:build
```

### Type Safety
- All TypeScript types validated
- No type errors in production build
- Fully typed API surface

## Next Steps

### Recommended Enhancements
1. **Settings Validation**: Add Zod schemas for runtime validation
2. **Settings History**: Track changes over time with audit log
3. **Role-based Access**: Restrict certain settings to admin users
4. **Settings Import/Export**: Allow backing up and restoring settings
5. **Settings Presets**: Pre-defined configurations for common use cases

### Integration Opportunities
- Use settings in Content Forge generation pipeline
- Apply quality thresholds in article QA workflow
- Implement auto-publish scheduling based on settings
- Configure email notifications using settings
- Customize UI theme based on theme setting

## Performance Considerations

- **Caching**: Hook caches settings locally to minimize database queries
- **Optimistic Updates**: UI responds instantly without waiting for database
- **Bulk Operations**: Multiple settings updated in single transaction
- **Real-time Sync**: Supabase subscriptions keep all clients in sync

## Security

- **Row-Level Security**: Settings isolated per tenant via RLS policies
- **Type Safety**: TypeScript prevents invalid setting values
- **Validation**: Settings validated before database write
- **Rollback**: Failed updates automatically rolled back

## Conclusion

The settings persistence system is fully implemented, tested, and integrated into the Settings UI. The hook provides a robust, type-safe, and performant way to manage tenant configuration throughout the Meta Content Engine.
