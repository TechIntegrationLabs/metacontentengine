/**
 * useSettings Hook - Usage Examples
 *
 * This file demonstrates various ways to use the useSettings hook
 * for managing tenant settings in the Meta Content Engine.
 */

import React from 'react';
import { useSettings } from './useSettings';
import { supabase } from '@/lib/supabase';

/**
 * Example 1: Basic usage with single setting updates
 */
function Example1_BasicUsage() {
  const { settings, updateSetting, isLoading } = useSettings({ supabase });

  const handleToggleAutoPublish = async () => {
    try {
      await updateSetting('autoPublishEnabled', !settings.autoPublishEnabled);
      console.log('Auto-publish toggled successfully');
    } catch (err) {
      console.error('Failed to toggle auto-publish:', err);
    }
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div>
      <h2>Auto-Publish: {settings.autoPublishEnabled ? 'On' : 'Off'}</h2>
      <button onClick={handleToggleAutoPublish}>Toggle</button>
    </div>
  );
}

/**
 * Example 2: Bulk updates with optimistic UI
 */
function Example2_BulkUpdate() {
  const { settings, bulkUpdate, isLoading } = useSettings({ supabase });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSaveQualitySettings = async () => {
    setIsSaving(true);
    try {
      await bulkUpdate({
        minimumQualityScore: 75,
        autoRejectBelowScore: 50,
        requireHumanReview: true,
      });
      alert('Quality settings saved!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Save failed. Changes rolled back.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2>Quality Settings</h2>
      <p>Minimum Score: {settings.minimumQualityScore}</p>
      <p>Auto-Reject Below: {settings.autoRejectBelowScore}</p>
      <p>Require Review: {settings.requireHumanReview ? 'Yes' : 'No'}</p>
      <button onClick={handleSaveQualitySettings} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Quality Settings'}
      </button>
    </div>
  );
}

/**
 * Example 3: Form with local state sync
 */
function Example3_FormWithLocalState() {
  const { settings, bulkUpdate, isLoading } = useSettings({ supabase });
  const [localSettings, setLocalSettings] = React.useState({
    defaultAiProvider: settings.defaultAiProvider,
    defaultWordCount: settings.defaultWordCount,
  });

  // Sync with loaded settings
  React.useEffect(() => {
    setLocalSettings({
      defaultAiProvider: settings.defaultAiProvider,
      defaultWordCount: settings.defaultWordCount,
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bulkUpdate(localSettings);
      alert('Settings saved!');
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <label>
        AI Provider:
        <select
          value={localSettings.defaultAiProvider}
          onChange={(e) => setLocalSettings({
            ...localSettings,
            defaultAiProvider: e.target.value as any
          })}
        >
          <option value="grok">Grok</option>
          <option value="claude">Claude</option>
          <option value="stealthgpt">StealthGPT</option>
        </select>
      </label>

      <label>
        Min Words:
        <input
          type="number"
          value={localSettings.defaultWordCount.min}
          onChange={(e) => setLocalSettings({
            ...localSettings,
            defaultWordCount: {
              ...localSettings.defaultWordCount,
              min: parseInt(e.target.value)
            }
          })}
        />
      </label>

      <button type="submit">Save</button>
    </form>
  );
}

/**
 * Example 4: Reset to defaults
 */
function Example4_ResetToDefaults() {
  const { settings, resetToDefaults } = useSettings({ supabase });

  const handleReset = async () => {
    if (confirm('Reset all settings to defaults?')) {
      try {
        await resetToDefaults();
        alert('Settings reset successfully');
      } catch (err) {
        console.error('Failed to reset:', err);
      }
    }
  };

  return (
    <div>
      <button onClick={handleReset}>Reset All Settings</button>
    </div>
  );
}

/**
 * Example 5: Conditional rendering based on settings
 */
function Example5_ConditionalRendering() {
  const { settings } = useSettings({ supabase });

  return (
    <div>
      {settings.autoPublishEnabled && (
        <div className="alert">
          Auto-publish is enabled. Content will be published automatically
          {settings.autoPublishDelay} minutes after QA approval.
        </div>
      )}

      {settings.requireHumanReview && (
        <div className="warning">
          All content requires human review before publishing.
        </div>
      )}

      {settings.minimumQualityScore >= 80 && (
        <div className="info">
          High quality standards enabled (score: {settings.minimumQualityScore})
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Using settings in business logic
 */
function Example6_BusinessLogic() {
  const { settings } = useSettings({ supabase });

  const shouldAutoPublish = (qualityScore: number): boolean => {
    if (!settings.autoPublishEnabled) return false;
    if (settings.requireHumanReview) return false;
    if (qualityScore < settings.minimumQualityScore) return false;
    return true;
  };

  const shouldAutoReject = (qualityScore: number): boolean => {
    return qualityScore < settings.autoRejectBelowScore;
  };

  // Example usage
  const processArticle = (qualityScore: number) => {
    if (shouldAutoReject(qualityScore)) {
      console.log('Article auto-rejected');
      return;
    }

    if (shouldAutoPublish(qualityScore)) {
      console.log(`Will auto-publish in ${settings.autoPublishDelay} minutes`);
    } else {
      console.log('Article requires review');
    }
  };

  return <div>Business logic example - check console</div>;
}

/**
 * Example 7: Real-time updates (automatic sync)
 */
function Example7_RealtimeSync() {
  const { settings } = useSettings({ supabase, autoFetch: true });

  // The hook automatically subscribes to real-time changes
  // When settings change in another tab/browser, this component
  // will automatically re-render with the new values

  return (
    <div>
      <h3>Settings (auto-synced)</h3>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
      <p>Open this in multiple tabs and change settings in one tab.</p>
      <p>You'll see the changes automatically reflected in all tabs.</p>
    </div>
  );
}

/**
 * Example 8: Error handling
 */
function Example8_ErrorHandling() {
  const { settings, updateSetting, error } = useSettings({ supabase });
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleUpdate = async () => {
    setLocalError(null);
    try {
      await updateSetting('minimumQualityScore', 85);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div>
      {error && <div className="error">Load Error: {error.message}</div>}
      {localError && <div className="error">Update Error: {localError}</div>}
      <button onClick={handleUpdate}>Update Quality Score</button>
    </div>
  );
}

/**
 * Example 9: Custom validation
 */
function Example9_CustomValidation() {
  const { settings, updateSetting } = useSettings({ supabase });

  const updateQualityScore = async (newScore: number) => {
    // Custom validation
    if (newScore < settings.autoRejectBelowScore) {
      alert('Minimum quality score cannot be less than auto-reject score');
      return;
    }

    if (newScore < 0 || newScore > 100) {
      alert('Score must be between 0 and 100');
      return;
    }

    try {
      await updateSetting('minimumQualityScore', newScore);
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  return (
    <div>
      <input
        type="number"
        onChange={(e) => updateQualityScore(parseInt(e.target.value))}
      />
    </div>
  );
}

/**
 * Example 10: Settings-based configuration
 */
function Example10_ConfigurationObject() {
  const { settings } = useSettings({ supabase });

  // Create configuration objects based on settings
  const publishingConfig = {
    enabled: settings.autoPublishEnabled,
    delay: settings.autoPublishDelay * 60 * 1000, // Convert to milliseconds
    status: settings.defaultPublishStatus,
  };

  const qualityConfig = {
    minScore: settings.minimumQualityScore,
    rejectThreshold: settings.autoRejectBelowScore,
    requireReview: settings.requireHumanReview,
  };

  const generationConfig = {
    provider: settings.defaultAiProvider,
    wordCount: settings.defaultWordCount,
  };

  // Use these configurations throughout your app
  return (
    <div>
      <h3>Configurations derived from settings:</h3>
      <pre>{JSON.stringify({ publishingConfig, qualityConfig, generationConfig }, null, 2)}</pre>
    </div>
  );
}

export {
  Example1_BasicUsage,
  Example2_BulkUpdate,
  Example3_FormWithLocalState,
  Example4_ResetToDefaults,
  Example5_ConditionalRendering,
  Example6_BusinessLogic,
  Example7_RealtimeSync,
  Example8_ErrorHandling,
  Example9_CustomValidation,
  Example10_ConfigurationObject,
};
