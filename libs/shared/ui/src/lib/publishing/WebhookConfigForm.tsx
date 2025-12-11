import React, { useState } from 'react';
import {
  Settings,
  Webhook,
  Key,
  Clock,
  RotateCw,
  Plus,
  Trash2,
  Send,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export interface WebhookConfig {
  url: string;
  authType: 'none' | 'bearer' | 'basic' | 'header';
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  customHeaders?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

interface WebhookConfigFormProps {
  initialConfig?: WebhookConfig;
  onSave: (config: WebhookConfig) => void;
  onTest?: (config: WebhookConfig) => Promise<{ success: boolean; message: string; statusCode?: number; responseTime?: number }>;
  isLoading?: boolean;
}

const WebhookConfigForm: React.FC<WebhookConfigFormProps> = ({
  initialConfig,
  onSave,
  onTest,
  isLoading = false,
}) => {
  const [config, setConfig] = useState<WebhookConfig>(
    initialConfig || {
      url: '',
      authType: 'none',
      timeout: 30000,
      retryAttempts: 3,
      customHeaders: {},
    }
  );

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    statusCode?: number;
    responseTime?: number;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showPayloadInfo, setShowPayloadInfo] = useState(false);

  const handleAddHeader = () => {
    const key = prompt('Enter header name:');
    if (key) {
      setConfig({
        ...config,
        customHeaders: {
          ...config.customHeaders,
          [key]: '',
        },
      });
    }
  };

  const handleRemoveHeader = (key: string) => {
    const { [key]: removed, ...rest } = config.customHeaders || {};
    setConfig({
      ...config,
      customHeaders: rest,
    });
  };

  const handleHeaderValueChange = (key: string, value: string) => {
    setConfig({
      ...config,
      customHeaders: {
        ...config.customHeaders,
        [key]: value,
      },
    });
  };

  const handleTest = async () => {
    if (!onTest) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(config);
    setTestResult(null);
  };

  const isValid = config.url.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-void-100 mb-2">
          <Webhook className="w-4 h-4" />
          Webhook URL
        </label>
        <input
          type="url"
          value={config.url}
          onChange={(e) => setConfig({ ...config, url: e.target.value })}
          placeholder="https://api.example.com/publish"
          className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
        />
      </div>

      {/* Authentication Type */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-void-100 mb-2">
          <Key className="w-4 h-4" />
          Authentication
        </label>
        <select
          value={config.authType}
          onChange={(e) =>
            setConfig({
              ...config,
              authType: e.target.value as WebhookConfig['authType'],
            })
          }
          className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="header">Custom Header</option>
        </select>
      </div>

      {/* Auth Fields Based on Type */}
      {config.authType === 'bearer' && (
        <div>
          <label className="text-sm font-medium text-void-100 mb-2 block">
            Bearer Token
          </label>
          <input
            type="password"
            value={config.authToken || ''}
            onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
            placeholder="Enter bearer token"
            className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
          />
        </div>
      )}

      {config.authType === 'basic' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-void-100 mb-2 block">
              Username
            </label>
            <input
              type="text"
              value={config.authUsername || ''}
              onChange={(e) =>
                setConfig({ ...config, authUsername: e.target.value })
              }
              placeholder="Username"
              className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-void-100 mb-2 block">
              Password
            </label>
            <input
              type="password"
              value={config.authPassword || ''}
              onChange={(e) =>
                setConfig({ ...config, authPassword: e.target.value })
              }
              placeholder="Password"
              className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
            />
          </div>
        </div>
      )}

      {config.authType === 'header' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-void-100 mb-2 block">
              Header Name
            </label>
            <input
              type="text"
              value={config.authHeaderName || ''}
              onChange={(e) =>
                setConfig({ ...config, authHeaderName: e.target.value })
              }
              placeholder="X-API-Key"
              className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-void-100 mb-2 block">
              Header Value
            </label>
            <input
              type="password"
              value={config.authHeaderValue || ''}
              onChange={(e) =>
                setConfig({ ...config, authHeaderValue: e.target.value })
              }
              placeholder="Your API key"
              className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
            />
          </div>
        </div>
      )}

      {/* Custom Headers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-void-100">
            <Settings className="w-4 h-4" />
            Custom Headers
          </label>
          <button
            type="button"
            onClick={handleAddHeader}
            className="flex items-center gap-1 px-2 py-1 text-xs text-forge-orange hover:text-forge-orange/80 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Header
          </button>
        </div>
        {Object.entries(config.customHeaders || {}).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(config.customHeaders || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  disabled
                  className="flex-1 px-3 py-2 bg-void-900/30 border border-void-700 rounded-lg text-void-300 text-sm"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleHeaderValueChange(key, e.target.value)}
                  placeholder="Header value"
                  className="flex-1 px-3 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 placeholder-void-500 text-sm focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(key)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-void-500 italic">No custom headers added</p>
        )}
      </div>

      {/* Timeout & Retry */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-void-100 mb-2">
            <Clock className="w-4 h-4" />
            Timeout (ms)
          </label>
          <input
            type="number"
            value={config.timeout || 30000}
            onChange={(e) =>
              setConfig({ ...config, timeout: parseInt(e.target.value) })
            }
            min="1000"
            step="1000"
            className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-void-100 mb-2">
            <RotateCw className="w-4 h-4" />
            Retry Attempts
          </label>
          <input
            type="number"
            value={config.retryAttempts || 3}
            onChange={(e) =>
              setConfig({ ...config, retryAttempts: parseInt(e.target.value) })
            }
            min="0"
            max="10"
            className="w-full px-4 py-2 bg-void-900/50 border border-void-700 rounded-lg text-void-100 focus:outline-none focus:ring-2 focus:ring-forge-orange/50"
          />
        </div>
      </div>

      {/* Payload Schema Info */}
      <div className="bg-void-900/30 border border-void-700 rounded-lg p-4">
        <button
          type="button"
          onClick={() => setShowPayloadInfo(!showPayloadInfo)}
          className="flex items-center gap-2 text-sm font-medium text-void-100 hover:text-forge-orange transition-colors w-full"
        >
          <Info className="w-4 h-4" />
          Payload Schema
          <span className="ml-auto text-void-500">
            {showPayloadInfo ? '▼' : '▶'}
          </span>
        </button>
        {showPayloadInfo && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-void-300">
              Your webhook will receive a POST request with the following JSON payload:
            </p>
            <pre className="bg-void-950 border border-void-700 rounded p-3 text-xs text-void-300 overflow-x-auto">
{`{
  "article": {
    "id": "uuid",
    "title": "Article Title",
    "content": "<p>HTML content...</p>",
    "excerpt": "Brief summary...",
    "status": "published",
    "publishedAt": "2025-12-10T12:00:00Z",
    "author": {
      "id": "uuid",
      "name": "Author Name",
      "email": "author@example.com"
    },
    "categories": ["Category 1", "Category 2"],
    "tags": ["tag1", "tag2"],
    "featuredImage": "https://...",
    "metadata": {
      "wordCount": 1500,
      "readingTime": 8,
      "qualityScore": 0.92
    }
  },
  "tenant": {
    "id": "uuid",
    "name": "Tenant Name"
  },
  "publishedBy": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "timestamp": "2025-12-10T12:00:00Z"
}`}
            </pre>
            <p className="text-xs text-void-500">
              Your endpoint should respond with a 200-299 status code to indicate success.
            </p>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                testResult.success ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {testResult.message}
            </p>
            {(testResult.statusCode || testResult.responseTime) && (
              <div className="flex gap-4 mt-2 text-xs text-void-400">
                {testResult.statusCode && (
                  <span>Status: {testResult.statusCode}</span>
                )}
                {testResult.responseTime && (
                  <span>Response time: {testResult.responseTime}ms</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-void-700">
        {onTest && (
          <button
            type="button"
            onClick={handleTest}
            disabled={!isValid || isTesting || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-void-800 hover:bg-void-700 disabled:bg-void-900 disabled:text-void-600 text-void-100 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-forge-orange hover:bg-forge-orange/90 disabled:bg-void-900 disabled:text-void-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed ml-auto"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default WebhookConfigForm;
