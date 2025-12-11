import React, { useState } from 'react';
import {
  Globe,
  Key,
  Save,
  TestTube,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export interface WebhookConfig {
  url: string;
  authToken?: string;
  authType: 'bearer' | 'basic' | 'header' | 'none';
  customHeaders: Record<string, string>;
  timeout: number;
  retryAttempts: number;
}

interface WebhookConfigFormProps {
  config?: WebhookConfig;
  onSave: (config: WebhookConfig) => Promise<void>;
  onTest: (config: WebhookConfig) => Promise<{ success: boolean; statusCode?: number; responseTime?: number; error?: string }>;
  isSaving?: boolean;
}

const defaultConfig: WebhookConfig = {
  url: '',
  authToken: '',
  authType: 'bearer',
  customHeaders: {},
  timeout: 30000,
  retryAttempts: 3,
};

const WebhookConfigForm: React.FC<WebhookConfigFormProps> = ({
  config: initialConfig,
  onSave,
  onTest,
  isSaving = false,
}) => {
  const [config, setConfig] = useState<WebhookConfig>(initialConfig || defaultConfig);
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; statusCode?: number; responseTime?: number; error?: string } | null>(null);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof WebhookConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleAddHeader = () => {
    if (!newHeaderKey.trim()) return;
    setConfig((prev) => ({
      ...prev,
      customHeaders: { ...prev.customHeaders, [newHeaderKey]: newHeaderValue },
    }));
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const handleRemoveHeader = (key: string) => {
    setConfig((prev) => {
      const { [key]: _, ...rest } = prev.customHeaders;
      return { ...prev, customHeaders: rest };
    });
  };

  const handleTest = async () => {
    if (!config.url) {
      setError('Please enter a webhook URL');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await onTest(config);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.url) {
      setError('Please enter a webhook URL');
      return;
    }

    setError(null);
    try {
      await onSave(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  return (
    <div className="space-y-6">
      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Webhook URL <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Globe className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="url"
            value={config.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://your-site.com/webhook/publish"
            className="w-full pl-10 pr-4 py-3 bg-void-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          The endpoint that will receive POST requests with article data
        </p>
      </div>

      {/* Authentication */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Authentication Type
        </label>
        <select
          value={config.authType}
          onChange={(e) => handleChange('authType', e.target.value)}
          className="w-full px-4 py-3 bg-void-950/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="none">No Authentication</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="header">Custom Header (X-API-Key)</option>
        </select>
      </div>

      {/* Auth Token */}
      {config.authType !== 'none' && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {config.authType === 'basic' ? 'Credentials (base64)' : 'API Token'}
          </label>
          <div className="relative">
            <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type={showToken ? 'text' : 'password'}
              value={config.authToken || ''}
              onChange={(e) => handleChange('authToken', e.target.value)}
              placeholder={config.authType === 'basic' ? 'base64 encoded credentials' : 'your-api-token'}
              className="w-full pl-10 pr-12 py-3 bg-void-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Custom Headers */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Custom Headers
        </label>
        <div className="space-y-2">
          {Object.entries(config.customHeaders).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <span className="flex-1 px-3 py-2 bg-void-950/50 border border-white/10 rounded-lg text-sm text-slate-300 font-mono">
                {key}: {value}
              </span>
              <button
                onClick={() => handleRemoveHeader(key)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newHeaderKey}
              onChange={(e) => setNewHeaderKey(e.target.value)}
              placeholder="Header name"
              className="flex-1 px-3 py-2 bg-void-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <input
              type="text"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              placeholder="Value"
              className="flex-1 px-3 py-2 bg-void-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              onClick={handleAddHeader}
              disabled={!newHeaderKey.trim()}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={config.timeout}
            onChange={(e) => handleChange('timeout', parseInt(e.target.value) || 30000)}
            min={5000}
            max={120000}
            step={1000}
            className="w-full px-4 py-3 bg-void-950/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Retry Attempts
          </label>
          <input
            type="number"
            value={config.retryAttempts}
            onChange={(e) => handleChange('retryAttempts', parseInt(e.target.value) || 3)}
            min={0}
            max={5}
            className="w-full px-4 py-3 bg-void-950/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={[
          'rounded-xl p-4 flex items-center justify-between',
          testResult.success
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-red-500/10 border border-red-500/20',
        ].join(' ')}>
          <div className="flex items-center space-x-3">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className={testResult.success ? 'text-emerald-200' : 'text-red-200'}>
                {testResult.success ? 'Connection successful!' : 'Connection failed'}
              </p>
              {testResult.statusCode && (
                <p className="text-xs text-slate-400">
                  Status: {testResult.statusCode} • Response time: {testResult.responseTime}ms
                </p>
              )}
              {testResult.error && (
                <p className="text-xs text-red-400">{testResult.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          onClick={handleTest}
          disabled={isTesting || !config.url}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TestTube className="w-4 h-4" />
          )}
          <span>Test Connection</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving || !config.url}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Configuration</span>
        </button>
      </div>

      {/* Payload schema info */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium text-indigo-300">Webhook Payload Format</h4>
            <p className="text-sm text-slate-400 mt-1">
              Your endpoint will receive a POST request with JSON body containing:
            </p>
            <pre className="mt-2 p-3 bg-void-950/50 rounded-lg text-xs text-slate-300 overflow-x-auto">
{`{
  "title": "Article Title",
  "content": "<p>HTML content...</p>",
  "excerpt": "Short summary",
  "slug": "article-slug",
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "status": "publish | draft | scheduled",
  "scheduledFor": "2024-01-15T10:00:00Z",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "qualityScore": 85,
  "riskLevel": "LOW | MEDIUM | HIGH",
  "articleId": "uuid",
  "tenantId": "uuid",
  "publishedAt": "2024-01-10T15:30:00Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookConfigForm;
