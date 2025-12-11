import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Key,
  Bell,
  Palette,
  Globe,
  Database,
  Shield,
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Loader2,
  X,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApiKeys, ApiProvider, useTenant, useSettings } from '@content-engine/hooks';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: SettingsTab[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'brand', label: 'Brand Profile', icon: Building2 },
  { id: 'publishing', label: 'Publishing & Quality', icon: Globe },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                ].join(' ')}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'brand' && <BrandSettings />}
        {activeTab === 'publishing' && <PublishingSettings />}
        {activeTab === 'api' && <ApiSettings />}
        {activeTab === 'integrations' && <IntegrationSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'billing' && <BillingSettings />}
      </div>
    </div>
  );
};

const GeneralSettings: React.FC = () => {
  const { tenant } = useTenant();
  const { settings, updateSetting, bulkUpdate, isLoading } = useSettings({ supabase });
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    theme: settings.theme,
    defaultView: settings.defaultView,
    articlesPerPage: settings.articlesPerPage,
    defaultAiProvider: settings.defaultAiProvider,
  });
  const [success, setSuccess] = useState(false);

  // Sync local state with loaded settings
  React.useEffect(() => {
    setLocalSettings({
      theme: settings.theme,
      defaultView: settings.defaultView,
      articlesPerPage: settings.articlesPerPage,
      defaultAiProvider: settings.defaultAiProvider,
    });
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await bulkUpdate(localSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">General Settings</h2>
        <p className="text-slate-500">Configure your workspace preferences</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">Settings saved successfully</span>
        </div>
      )}

      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Workspace Name</label>
          <input
            type="text"
            defaultValue={tenant?.name || 'GetEducated'}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Theme</label>
          <select
            value={localSettings.theme}
            onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as 'dark' | 'light' })}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Default View</label>
          <select
            value={localSettings.defaultView}
            onChange={(e) => setLocalSettings({ ...localSettings, defaultView: e.target.value as 'kanban' | 'list' })}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="kanban">Kanban Board</option>
            <option value="list">List View</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Articles Per Page</label>
          <input
            type="number"
            min="10"
            max="100"
            step="5"
            value={localSettings.articlesPerPage}
            onChange={(e) => setLocalSettings({ ...localSettings, articlesPerPage: parseInt(e.target.value) })}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Default AI Provider</label>
          <select
            value={localSettings.defaultAiProvider}
            onChange={(e) => setLocalSettings({ ...localSettings, defaultAiProvider: e.target.value as 'grok' | 'claude' | 'stealthgpt' })}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="grok">Grok (xAI)</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="stealthgpt">StealthGPT</option>
          </select>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PublishingSettings: React.FC = () => {
  const { settings, bulkUpdate, isLoading } = useSettings({ supabase });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    autoPublishEnabled: settings.autoPublishEnabled,
    autoPublishDelay: settings.autoPublishDelay,
    defaultPublishStatus: settings.defaultPublishStatus,
    minimumQualityScore: settings.minimumQualityScore,
    autoRejectBelowScore: settings.autoRejectBelowScore,
    requireHumanReview: settings.requireHumanReview,
    defaultWordCount: settings.defaultWordCount,
  });

  // Sync local state with loaded settings
  React.useEffect(() => {
    setLocalSettings({
      autoPublishEnabled: settings.autoPublishEnabled,
      autoPublishDelay: settings.autoPublishDelay,
      defaultPublishStatus: settings.defaultPublishStatus,
      minimumQualityScore: settings.minimumQualityScore,
      autoRejectBelowScore: settings.autoRejectBelowScore,
      requireHumanReview: settings.requireHumanReview,
      defaultWordCount: settings.defaultWordCount,
    });
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await bulkUpdate(localSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Publishing & Quality</h2>
        <p className="text-slate-500">Configure content publishing and quality control settings</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">Settings saved successfully</span>
        </div>
      )}

      {/* Publishing Settings */}
      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h3 className="font-medium text-white">Auto-Publish</h3>
            <p className="text-sm text-slate-500">Automatically publish content after passing QA</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.autoPublishEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, autoPublishEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        {localSettings.autoPublishEnabled && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Auto-Publish Delay (minutes)</label>
            <input
              type="number"
              min="0"
              max="1440"
              step="5"
              value={localSettings.autoPublishDelay}
              onChange={(e) => setLocalSettings({ ...localSettings, autoPublishDelay: parseInt(e.target.value) })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <p className="text-xs text-slate-500 mt-1">Delay before publishing after QA approval</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">Default Publish Status</label>
          <select
            value={localSettings.defaultPublishStatus}
            onChange={(e) => setLocalSettings({ ...localSettings, defaultPublishStatus: e.target.value as 'draft' | 'pending' | 'publish' })}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending Review</option>
            <option value="publish">Publish</option>
          </select>
        </div>
      </div>

      {/* Quality Settings */}
      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
        <div>
          <h3 className="font-medium text-white mb-4">Quality Control</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Minimum Quality Score: {localSettings.minimumQualityScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={localSettings.minimumQualityScore}
            onChange={(e) => setLocalSettings({ ...localSettings, minimumQualityScore: parseInt(e.target.value) })}
            className="w-full accent-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-1">Minimum score required to pass quality checks</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Auto-Reject Below Score: {localSettings.autoRejectBelowScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={localSettings.autoRejectBelowScore}
            onChange={(e) => setLocalSettings({ ...localSettings, autoRejectBelowScore: parseInt(e.target.value) })}
            className="w-full accent-red-500"
          />
          <p className="text-xs text-slate-500 mt-1">Automatically reject content below this score</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="font-medium text-white">Require Human Review</p>
            <p className="text-sm text-slate-500">All content must be manually reviewed before publishing</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.requireHumanReview}
              onChange={(e) => setLocalSettings({ ...localSettings, requireHumanReview: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>

      {/* Generation Settings */}
      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
        <div>
          <h3 className="font-medium text-white mb-4">Content Generation</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Minimum Word Count</label>
            <input
              type="number"
              min="300"
              max="5000"
              step="100"
              value={localSettings.defaultWordCount.min}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                defaultWordCount: { ...localSettings.defaultWordCount, min: parseInt(e.target.value) }
              })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Maximum Word Count</label>
            <input
              type="number"
              min="500"
              max="10000"
              step="100"
              value={localSettings.defaultWordCount.max}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                defaultWordCount: { ...localSettings.defaultWordCount, max: parseInt(e.target.value) }
              })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};

const BrandSettings: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Brand Profile</h2>
        <p className="text-slate-500">Your brand identity used for content generation</p>
      </div>

      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Brand Name</label>
            <input
              type="text"
              defaultValue={tenant?.name || 'GetEducated'}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Website URL</label>
            <input
              type="url"
              defaultValue={tenant?.primaryDomain || 'https://geteducated.com'}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Industry</label>
          <input
            type="text"
            defaultValue="Education Technology"
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
          <textarea
            defaultValue="Students, educators, and lifelong learners seeking quality educational resources and career guidance"
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Voice Tone (1-10)</label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500">Formal</span>
            <input
              type="range"
              min="1"
              max="10"
              defaultValue={7}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-sm text-slate-500">Casual</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 flex items-center space-x-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Re-analyze Brand</span>
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ApiSettings: React.FC = () => {
  const { apiKeys, isLoading, saveApiKey, deleteApiKey, verifyApiKey, refetch } = useApiKeys({ supabase });
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSaveKey = async (provider: ApiProvider) => {
    if (!newApiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveApiKey(provider, newApiKey);
      setSuccess(`${provider} API key saved successfully`);
      setEditingProvider(null);
      setNewApiKey('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (provider: ApiProvider) => {
    if (!confirm(`Are you sure you want to delete the ${provider} API key?`)) {
      return;
    }

    try {
      await deleteApiKey(provider);
      setSuccess(`${provider} API key deleted`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    }
  };

  const handleVerifyKey = async (provider: ApiProvider) => {
    setIsVerifying(provider);
    setError(null);

    try {
      const isValid = await verifyApiKey(provider);
      if (isValid) {
        setSuccess(`${provider} API key verified successfully`);
      } else {
        setError(`${provider} API key verification failed`);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify API key');
    } finally {
      setIsVerifying(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">API Keys</h2>
          <p className="text-slate-500">Manage your service integrations and API credentials</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">API Keys</h2>
        <p className="text-slate-500">Manage your service integrations and API credentials</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {apiKeys.map((api) => (
          <div key={api.provider} className="bg-void-900/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={[
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  api.isConfigured ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                ].join(' ')}>
                  <Key className={api.isConfigured ? 'w-5 h-5 text-emerald-400' : 'w-5 h-5 text-slate-400'} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-white">{api.name}</h3>
                    <span className={[
                      'px-2 py-0.5 text-xs rounded-full',
                      api.isConfigured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    ].join(' ')}>
                      {api.isConfigured ? 'configured' : 'not configured'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {api.description}
                  </p>
                  {api.isConfigured && api.lastVerified && (
                    <p className="text-xs text-slate-600 mt-1">
                      Last verified: {new Date(api.lastVerified).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {api.isConfigured ? (
                  <>
                    <button
                      onClick={() => handleVerifyKey(api.provider)}
                      disabled={isVerifying === api.provider}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                      title="Verify key"
                    >
                      {isVerifying === api.provider ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProvider(api.provider);
                        setNewApiKey('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteKey(api.provider)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingProvider(api.provider);
                      setNewApiKey('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm transition-colors"
                  >
                    Configure
                  </button>
                )}
              </div>
            </div>

            {/* Edit form */}
            {editingProvider === api.provider && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type={showKey[api.provider] ? 'text' : 'password'}
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder={`Enter your ${api.name} API key`}
                      className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey({ ...showKey, [api.provider]: !showKey[api.provider] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showKey[api.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSaveKey(api.provider)}
                    disabled={isSaving || !newApiKey.trim()}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingProvider(null);
                      setNewApiKey('');
                    }}
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Your API key will be encrypted before storage. We never store plain-text credentials.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-indigo-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-white">Security Note</h4>
            <p className="text-sm text-slate-500 mt-1">
              All API keys are encrypted using AES-256 encryption before being stored.
              Keys are only decrypted server-side when needed for API calls and are never exposed to the client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationSettings: React.FC = () => {
  const integrations = [
    { name: 'WordPress', description: 'Publish directly to your WordPress sites', connected: true, icon: Globe },
    { name: 'Webflow', description: 'Connect your Webflow CMS', connected: false, icon: Palette },
    { name: 'Google Analytics', description: 'Track content performance', connected: true, icon: Database },
    { name: 'Slack', description: 'Get notified about content updates', connected: false, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Integrations</h2>
        <p className="text-slate-500">Connect external services to enhance your workflow</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {integrations.map((integration, i) => {
          const Icon = integration.icon;
          return (
            <div key={i} className="bg-void-900/50 rounded-xl border border-white/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{integration.name}</h3>
                    <p className="text-xs text-slate-500">{integration.description}</p>
                  </div>
                </div>
                <button className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  integration.connected
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                ].join(' ')}>
                  {integration.connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NotificationSettings: React.FC = () => {
  const { settings, updateSetting, isLoading } = useSettings({ supabase });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setIsSaving(true);
    try {
      await updateSetting(key, value);
    } catch (err) {
      console.error('Failed to update notification setting:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Notifications</h2>
        <p className="text-slate-500">Control when and how you receive notifications</p>
      </div>

      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div>
            <p className="font-medium text-white">Email on Publish</p>
            <p className="text-sm text-slate-500">Get notified when content is published</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailOnPublish}
              onChange={(e) => handleToggle('emailOnPublish', e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-disabled:opacity-50"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div>
            <p className="font-medium text-white">Email on QA Failure</p>
            <p className="text-sm text-slate-500">Get alerted when content fails quality checks</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailOnQaFail}
              onChange={(e) => handleToggle('emailOnQaFail', e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-disabled:opacity-50"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
          <div>
            <p className="font-medium text-white">Webhook Notifications</p>
            <p className="text-sm text-slate-500">Send webhook events for content lifecycle</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.webhookNotifications}
              onChange={(e) => handleToggle('webhookNotifications', e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-disabled:opacity-50"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

const SecuritySettings: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Security</h2>
      <p className="text-slate-500">Protect your account and data</p>
    </div>

    <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white">Two-Factor Authentication</h3>
          <p className="text-sm text-slate-500">Add an extra layer of security</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium">
          Enabled
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
          <h3 className="font-medium text-white">Active Sessions</h3>
          <p className="text-sm text-slate-500">Manage your logged in devices</p>
        </div>
        <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
          <h3 className="font-medium text-white">Change Password</h3>
          <p className="text-sm text-slate-500">Update your password regularly</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm">
          Update
        </button>
      </div>
    </div>
  </div>
);

const BillingSettings: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Billing</h2>
      <p className="text-slate-500">Manage your subscription and payment methods</p>
    </div>

    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-300">Current Plan</p>
          <h3 className="text-2xl font-display font-bold text-white mt-1">Pro Plan</h3>
          <p className="text-slate-400 mt-1">$49/month • Renews Jan 15, 2024</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors">
          Upgrade Plan
        </button>
      </div>
    </div>

    <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6">
      <h3 className="font-medium text-white mb-4">Usage This Month</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Articles Generated</span>
            <span className="text-white">47 / 100</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '47%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">AI Credits</span>
            <span className="text-white">12,450 / 25,000</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Settings;
