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
  RefreshCw
} from 'lucide-react';

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
  const [showApiKey, setShowApiKey] = useState(false);

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
        {activeTab === 'api' && <ApiSettings showApiKey={showApiKey} setShowApiKey={setShowApiKey} />}
        {activeTab === 'integrations' && <IntegrationSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'billing' && <BillingSettings />}
      </div>
    </div>
  );
};

const GeneralSettings: React.FC = () => (
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
          defaultValue="GetEducated"
          className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Default Language</label>
        <select className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
          <option value="en">English (US)</option>
          <option value="en-gb">English (UK)</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Timezone</label>
        <select className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
          <option value="america/new_york">Eastern Time (ET)</option>
          <option value="america/chicago">Central Time (CT)</option>
          <option value="america/denver">Mountain Time (MT)</option>
          <option value="america/los_angeles">Pacific Time (PT)</option>
          <option value="utc">UTC</option>
        </select>
      </div>

      <div className="pt-4 border-t border-white/5">
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
);

const BrandSettings: React.FC = () => (
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
            defaultValue="GetEducated"
            className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Website URL</label>
          <input
            type="url"
            defaultValue="https://geteducated.com"
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
            defaultValue="7"
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

interface ApiSettingsProps {
  showApiKey: boolean;
  setShowApiKey: (show: boolean) => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ showApiKey, setShowApiKey }) => {
  const apiKeys = [
    { name: 'Grok API', key: 'xai-abc123...xyz789', status: 'active' },
    { name: 'Claude API', key: 'sk-ant-abc...xyz', status: 'active' },
    { name: 'StealthGPT', key: 'stlth_abc...xyz', status: 'inactive' },
    { name: 'WordPress', key: 'wp_app_abc...xyz', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">API Keys</h2>
        <p className="text-slate-500">Manage your service integrations and API credentials</p>
      </div>

      <div className="space-y-4">
        {apiKeys.map((api, i) => (
          <div key={i} className="bg-void-900/50 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={[
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  api.status === 'active' ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                ].join(' ')}>
                  <Key className={api.status === 'active' ? 'w-5 h-5 text-emerald-400' : 'w-5 h-5 text-slate-400'} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-white">{api.name}</h3>
                    <span className={[
                      'px-2 py-0.5 text-xs rounded-full',
                      api.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    ].join(' ')}>
                      {api.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-mono">
                    {showApiKey ? api.key : '•'.repeat(20)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center space-x-2 transition-colors border border-white/10">
        <Key className="w-4 h-4" />
        <span>Add New API Key</span>
      </button>
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
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
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
