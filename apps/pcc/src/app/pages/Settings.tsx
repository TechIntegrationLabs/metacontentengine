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
  Trash2,
  Palmtree
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApiKeys, ApiProvider, useTenant } from '@content-engine/hooks';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: SettingsTab[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'brand', label: 'Brand Profile', icon: Building2 },
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
        <div className="flex items-center space-x-2 mb-6">
          <Palmtree className="w-6 h-6 text-pcc-teal" />
          <h1 className="text-xl font-display font-bold text-white">Settings</h1>
        </div>
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
                    ? 'bg-pcc-teal/10 text-pcc-teal border-l-2 border-pcc-teal'
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">General Settings</h2>
        <p className="text-slate-500">Configure your workspace preferences</p>
      </div>

      <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Workspace Name</label>
          <input
            type="text"
            defaultValue={tenant?.name || 'Polynesian Cultural Center'}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Default Language</label>
          <select className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50">
            <option value="en">English (US)</option>
            <option value="en-gb">English (UK)</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Timezone</label>
          <select className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50">
            <option value="pacific/honolulu">Hawaii-Aleutian (HST)</option>
            <option value="america/los_angeles">Pacific Time (PT)</option>
            <option value="america/denver">Mountain Time (MT)</option>
            <option value="america/chicago">Central Time (CT)</option>
            <option value="america/new_york">Eastern Time (ET)</option>
            <option value="utc">UTC</option>
          </select>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-pcc-teal to-pcc-gold hover:from-pcc-teal/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
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
              defaultValue={tenant?.name || 'Polynesian Cultural Center'}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Website URL</label>
            <input
              type="url"
              defaultValue={tenant?.domain || 'https://polynesia.com'}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Industry</label>
          <input
            type="text"
            defaultValue={tenant?.settings?.industry || 'Leisure, Travel & Tourism, Hospitality'}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Target Audience</label>
          <textarea
            defaultValue={tenant?.settings?.target_audience || 'Tourists, families, cultural enthusiasts, and travelers seeking authentic Polynesian experiences'}
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 h-24 resize-none"
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
              defaultValue={tenant?.settings?.formality_scale || 7}
              className="flex-1 accent-pcc-teal"
            />
            <span className="text-sm text-slate-500">Casual</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 flex items-center space-x-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Re-analyze Brand</span>
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-pcc-teal to-pcc-gold hover:from-pcc-teal/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all">
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
                    className="px-3 py-1.5 rounded-lg bg-pcc-teal/10 hover:bg-pcc-teal/20 text-pcc-teal text-sm transition-colors"
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
                      className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
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
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-pcc-teal to-pcc-gold hover:from-pcc-teal/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
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
          <Shield className="w-5 h-5 text-pcc-teal mt-0.5" />
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

const NotificationSettings: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Notifications</h2>
      <p className="text-slate-500">Control when and how you receive notifications</p>
    </div>

    <div className="bg-void-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
      {[
        { label: 'Content generated', desc: 'When new content finishes generation' },
        { label: 'Quality alerts', desc: 'When content falls below quality threshold' },
        { label: 'Publishing reminders', desc: 'Scheduled content publishing notifications' },
        { label: 'Team activity', desc: 'When team members make changes' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
          <div>
            <p className="font-medium text-white">{item.label}</p>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pcc-teal"></div>
          </label>
        </div>
      ))}
    </div>
  </div>
);

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
        <button className="text-sm text-pcc-teal hover:text-pcc-teal/80">View All</button>
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

    <div className="bg-gradient-to-r from-pcc-teal/10 to-pcc-gold/10 rounded-2xl border border-pcc-teal/20 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-pcc-teal">Current Plan</p>
          <h3 className="text-2xl font-display font-bold text-white mt-1">Pro Plan</h3>
          <p className="text-slate-400 mt-1">$49/month - Renews Jan 15, 2024</p>
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
            <div className="h-full bg-pcc-teal rounded-full" style={{ width: '47%' }} />
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
