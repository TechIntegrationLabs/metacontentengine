import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link2,
  Ban,
  Check,
  Star,
} from 'lucide-react';
import type { DomainRule } from '@content-engine/generation';
import { DEFAULT_BLOCKED_DOMAINS, DEFAULT_ALLOWED_DOMAINS } from '@content-engine/generation';

interface DomainRulesSettingsProps {
  tenantId: string;
  onRulesChanged?: () => void;
}

/**
 * Domain Rules Settings Component
 * Manage tenant-specific domain blocking and whitelisting
 *
 * Features:
 * - Add/remove blocked domains
 * - Add/remove allowed domains
 * - Mark competitor domains
 * - Import/export domain lists
 * - View default domains
 */
export default function DomainRulesSettings({
  tenantId,
  onRulesChanged,
}: DomainRulesSettingsProps) {
  const [domainRules, setDomainRules] = useState<DomainRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [newRuleType, setNewRuleType] = useState<'blocked' | 'allowed' | 'competitor' | 'trusted'>(
    'blocked'
  );
  const [newReason, setNewReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'blocked' | 'allowed' | 'competitor'>('all');
  const [showDefaults, setShowDefaults] = useState(false);

  // Load domain rules on mount
  useEffect(() => {
    loadDomainRules();
  }, [tenantId]);

  const loadDomainRules = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual service call
      // const service = createLinkComplianceService(supabaseUrl, supabaseKey, tenantId);
      // const rules = await service.getDomainRules();
      // setDomainRules(rules);
      setDomainRules([]);
    } catch (error) {
      console.error('Error loading domain rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(newDomain.trim())) {
      alert('Invalid domain format. Please enter a valid domain (e.g., example.com)');
      return;
    }

    try {
      // TODO: Replace with actual service call
      // const service = createLinkComplianceService(supabaseUrl, supabaseKey, tenantId);
      // await service.addDomainRule(newDomain.trim(), newRuleType, newReason.trim());

      // Reload rules
      await loadDomainRules();

      // Reset form
      setNewDomain('');
      setNewReason('');

      onRulesChanged?.();
    } catch (error) {
      console.error('Error adding domain rule:', error);
      alert('Failed to add domain rule. Please try again.');
    }
  };

  const handleRemoveDomain = async (ruleId: string) => {
    if (!confirm('Are you sure you want to remove this domain rule?')) return;

    try {
      // TODO: Replace with actual service call
      // const service = createLinkComplianceService(supabaseUrl, supabaseKey, tenantId);
      // await service.removeDomainRule(ruleId);

      // Reload rules
      await loadDomainRules();

      onRulesChanged?.();
    } catch (error) {
      console.error('Error removing domain rule:', error);
      alert('Failed to remove domain rule. Please try again.');
    }
  };

  const handleImportDomains = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        let domains: string[] = [];

        if (file.name.endsWith('.json')) {
          domains = JSON.parse(text);
        } else {
          domains = text.split('\n').map((line) => line.trim()).filter(Boolean);
        }

        // TODO: Batch import domains
        console.log('Importing domains:', domains);
        alert(`Would import ${domains.length} domains`);
      } catch (error) {
        console.error('Error importing domains:', error);
        alert('Failed to import domains. Please check the file format.');
      }
    };
    input.click();
  };

  const handleExportDomains = () => {
    const data = JSON.stringify(
      domainRules.map((rule) => ({
        domain: rule.domain,
        rule_type: rule.rule_type,
        reason: rule.reason,
      })),
      null,
      2
    );

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domain-rules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRules =
    filter === 'all'
      ? domainRules
      : domainRules.filter((rule) => rule.rule_type === filter);

  const getRuleIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'blocked':
        return <Ban className="w-4 h-4 text-red-600" />;
      case 'competitor':
        return <XCircle className="w-4 h-4 text-orange-600" />;
      case 'allowed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'trusted':
        return <Star className="w-4 h-4 text-blue-600" />;
      default:
        return <Link2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRuleColor = (ruleType: string) => {
    switch (ruleType) {
      case 'blocked':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'competitor':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'allowed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'trusted':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-forge-orange" />
            Domain Rules
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage blocked and allowed domains for link compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportDomains}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExportDomains}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={domainRules.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Add New Rule */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Domain Rule</h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Domain</label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-orange"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Rule Type</label>
            <select
              value={newRuleType}
              onChange={(e) =>
                setNewRuleType(
                  e.target.value as 'blocked' | 'allowed' | 'competitor' | 'trusted'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-orange"
            >
              <option value="blocked">Blocked</option>
              <option value="competitor">Competitor</option>
              <option value="allowed">Allowed</option>
              <option value="trusted">Trusted</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Why this domain is blocked/allowed"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forge-orange"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleAddDomain}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-forge-orange rounded-lg hover:bg-forge-orange-dark"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {['all', 'blocked', 'competitor', 'allowed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as typeof filter)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              filter === tab
                ? 'border-forge-orange text-forge-orange'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
            {tab !== 'all' && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                {domainRules.filter((r) => r.rule_type === tab).length}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowDefaults(!showDefaults)}
          className="ml-auto px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {showDefaults ? 'Hide' : 'Show'} Defaults
        </button>
      </div>

      {/* Default Domains (if shown) */}
      {showDefaults && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Default Rules</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-blue-800 mb-2">
                Blocked Domains ({DEFAULT_BLOCKED_DOMAINS.length})
              </h5>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {DEFAULT_BLOCKED_DOMAINS.map((domain) => (
                  <div
                    key={domain}
                    className="text-xs text-blue-700 px-2 py-1 bg-blue-100 rounded"
                  >
                    {domain}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-green-800 mb-2">
                Allowed Domains ({DEFAULT_ALLOWED_DOMAINS.length})
              </h5>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {DEFAULT_ALLOWED_DOMAINS.map((domain) => (
                  <div
                    key={domain}
                    className="text-xs text-green-700 px-2 py-1 bg-green-100 rounded"
                  >
                    {domain}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Rules List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Custom Domain Rules ({filteredRules.length})
          </h4>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading domain rules...</div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No custom domain rules yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getRuleColor(
                    rule.rule_type
                  )}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getRuleIcon(rule.rule_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rule.domain}</p>
                      {rule.reason && (
                        <p className="text-xs opacity-75 truncate">{rule.reason}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize">
                      {rule.rule_type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveDomain(rule.id)}
                    className="ml-3 p-2 text-gray-600 hover:text-red-600 hover:bg-white hover:bg-opacity-50 rounded"
                    title="Remove rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          How Domain Rules Work
        </h4>
        <ul className="text-xs text-gray-600 space-y-1 ml-6 list-disc">
          <li>
            <strong>Blocked:</strong> Links to these domains will prevent content from being
            published
          </li>
          <li>
            <strong>Competitor:</strong> Special type of blocked domain, marked for competitive
            analysis
          </li>
          <li>
            <strong>Allowed:</strong> Links to these domains are permitted and encouraged
          </li>
          <li>
            <strong>Trusted:</strong> Premium allowed domains (government, BLS, .edu authorities)
          </li>
          <li>Rules automatically match subdomains (e.g., www.example.com matches example.com)</li>
          <li>Custom rules override default rules</li>
        </ul>
      </div>
    </div>
  );
}
