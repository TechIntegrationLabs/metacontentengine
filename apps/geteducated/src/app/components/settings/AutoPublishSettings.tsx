/**
 * AutoPublishSettings Component
 *
 * Configuration panel for auto-publish scheduling settings.
 * Allows tenants to enable/disable auto-publish and configure rules.
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Shield,
  Sparkles,
  Calendar,
  Bell,
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import type { AutoPublishConfig, RiskLevel, PublishingWindow } from '@content-engine/publishing';
import { DEFAULT_AUTO_PUBLISH_CONFIG } from '@content-engine/publishing';

interface AutoPublishSettingsProps {
  config: Partial<AutoPublishConfig> | null;
  enabled: boolean;
  onSave: (enabled: boolean, config: AutoPublishConfig) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const RISK_LEVELS: { value: RiskLevel; label: string; description: string }[] = [
  { value: 'LOW', label: 'Low Only', description: 'Most restrictive - only auto-publish very safe content' },
  { value: 'MEDIUM', label: 'Medium & Below', description: 'Allow medium-risk content with review' },
  { value: 'HIGH', label: 'High & Below', description: 'Less restrictive - manual review recommended' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
];

export function AutoPublishSettings({
  config: initialConfig,
  enabled: initialEnabled,
  onSave,
  isLoading = false,
  className = '',
}: AutoPublishSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [config, setConfig] = useState<AutoPublishConfig>({
    ...DEFAULT_AUTO_PUBLISH_CONFIG,
    ...initialConfig,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setEnabled(initialEnabled);
    setConfig({ ...DEFAULT_AUTO_PUBLISH_CONFIG, ...initialConfig });
    setHasChanges(false);
  }, [initialEnabled, initialConfig]);

  const handleChange = (updates: Partial<AutoPublishConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleEnabledChange = (value: boolean) => {
    setEnabled(value);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const toggleWindow = (dayOfWeek: number) => {
    const existingWindow = config.publishingWindows.find((w) => w.dayOfWeek === dayOfWeek);
    let newWindows: PublishingWindow[];

    if (existingWindow) {
      newWindows = config.publishingWindows.filter((w) => w.dayOfWeek !== dayOfWeek);
    } else {
      newWindows = [
        ...config.publishingWindows,
        { dayOfWeek, startHour: 9, endHour: 17 },
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    }

    handleChange({ publishingWindows: newWindows });
  };

  const updateWindowHours = (dayOfWeek: number, startHour: number, endHour: number) => {
    const newWindows = config.publishingWindows.map((w) =>
      w.dayOfWeek === dayOfWeek ? { ...w, startHour, endHour } : w
    );
    handleChange({ publishingWindows: newWindows });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await onSave(enabled, config);
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save auto-publish settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_AUTO_PUBLISH_CONFIG);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  if (isLoading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-700 rounded-lg" />
          <div className="flex-1">
            <div className="h-5 w-48 bg-gray-700 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Toggle */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-forge-orange/10 rounded-xl">
              <Clock className="w-6 h-6 text-forge-orange" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Auto-Publish Scheduling</h3>
              <p className="text-sm text-gray-400 mt-1">
                Automatically publish approved articles based on quality and risk thresholds
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forge-orange"></div>
          </label>
        </div>

        {!enabled && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Info className="w-4 h-4" />
              <span>Auto-publish is disabled. All articles must be published manually.</span>
            </div>
          </div>
        )}
      </div>

      {enabled && (
        <>
          {/* Quality & Risk Thresholds */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-forge-indigo" />
              <h4 className="font-semibold text-white">Quality & Risk Thresholds</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Minimum Quality Score */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Quality Score
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={config.minimumQualityScore}
                    onChange={(e) => handleChange({ minimumQualityScore: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-forge-orange"
                  />
                  <span className="w-12 text-center text-lg font-semibold text-white">
                    {config.minimumQualityScore}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Articles must score at least this to auto-publish
                </p>
              </div>

              {/* Maximum Risk Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Risk Level
                </label>
                <select
                  value={config.maximumRiskLevel}
                  onChange={(e) => handleChange({ maximumRiskLevel: e.target.value as RiskLevel })}
                  className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
                >
                  {RISK_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {RISK_LEVELS.find((l) => l.value === config.maximumRiskLevel)?.description}
                </p>
              </div>
            </div>

            {/* Human Review Toggle */}
            <div className="mt-6 p-4 bg-void-950/50 rounded-lg">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-white">Require Human Review</p>
                  <p className="text-sm text-gray-400">
                    Articles must be manually approved before auto-publishing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.requireHumanReview}
                  onChange={(e) => handleChange({ requireHumanReview: e.target.checked })}
                  className="w-5 h-5 rounded bg-void-900 border-gray-600 text-forge-orange focus:ring-forge-orange/50"
                />
              </label>
            </div>
          </div>

          {/* Timing Settings */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-forge-purple" />
              <h4 className="font-semibold text-white">Timing & Schedule</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Days After Ready */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Days After Ready
                </label>
                <select
                  value={config.defaultDaysAfterReady}
                  onChange={(e) => handleChange({ defaultDaysAfterReady: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
                >
                  {[1, 2, 3, 5, 7, 14].map((days) => (
                    <option key={days} value={days}>
                      {days} day{days > 1 ? 's' : ''} after marked ready
                    </option>
                  ))}
                </select>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={config.timezone}
                  onChange={(e) => handleChange({ timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Publishing Windows */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Publishing Windows
              </label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const window = config.publishingWindows.find((w) => w.dayOfWeek === day.value);
                  const isActive = !!window;

                  return (
                    <div key={day.value} className="text-center">
                      <button
                        onClick={() => toggleWindow(day.value)}
                        className={`w-full px-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-forge-orange/20 text-forge-orange border border-forge-orange/30'
                            : 'bg-void-950/50 text-gray-500 border border-white/5 hover:border-white/20'
                        }`}
                      >
                        {day.short}
                      </button>
                      {isActive && window && (
                        <div className="mt-2 space-y-1">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={window.startHour}
                            onChange={(e) =>
                              updateWindowHours(day.value, parseInt(e.target.value), window.endHour)
                            }
                            className="w-full px-1 py-1 text-xs bg-void-900 border border-white/10 rounded text-center text-white"
                            title="Start hour"
                          />
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={window.endHour}
                            onChange={(e) =>
                              updateWindowHours(day.value, window.startHour, parseInt(e.target.value))
                            }
                            className="w-full px-1 py-1 text-xs bg-void-900 border border-white/10 rounded text-center text-white"
                            title="End hour"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select active publishing days and set hours (24h format)
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-400" />
              <h4 className="font-semibold text-white">Notifications</h4>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-white">Pre-Publish Notification</p>
                  <p className="text-sm text-gray-400">
                    Send notification before auto-publishing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notifyBeforePublish}
                  onChange={(e) => handleChange({ notifyBeforePublish: e.target.checked })}
                  className="w-5 h-5 rounded bg-void-900 border-gray-600 text-forge-orange focus:ring-forge-orange/50"
                />
              </label>

              {config.notifyBeforePublish && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notify Hours Before
                  </label>
                  <select
                    value={config.notifyHoursBeforePublish}
                    onChange={(e) =>
                      handleChange({ notifyHoursBeforePublish: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
                  >
                    {[1, 2, 4, 6, 12, 24, 48].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} hour{hours > 1 ? 's' : ''} before
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset to Defaults
        </button>

        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Failed to save
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2 bg-forge-orange hover:bg-forge-orange/90 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AutoPublishSettings;
