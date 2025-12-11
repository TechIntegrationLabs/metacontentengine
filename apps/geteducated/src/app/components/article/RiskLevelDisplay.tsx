/**
 * RiskLevelDisplay Component
 *
 * Visual display of article risk assessment for the editor sidebar.
 * Shows risk level, score breakdown, and blocking issues.
 */

import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  FileWarning,
  Link2,
  Loader2,
} from 'lucide-react';
import type { RiskAssessment, RiskLevel, RiskFactors } from '@content-engine/quality';

interface RiskLevelDisplayProps {
  assessment: RiskAssessment | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const levelConfig: Record<
  RiskLevel,
  {
    icon: React.ElementType;
    label: string;
    bg: string;
    text: string;
    border: string;
    description: string;
  }
> = {
  LOW: {
    icon: CheckCircle,
    label: 'Low Risk',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    description: 'Safe to publish - Auto-publish eligible',
  },
  MEDIUM: {
    icon: AlertCircle,
    label: 'Medium Risk',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    description: 'Review recommended before publishing',
  },
  HIGH: {
    icon: AlertTriangle,
    label: 'High Risk',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    description: 'Manual review required',
  },
  CRITICAL: {
    icon: XCircle,
    label: 'Critical Risk',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    description: 'Cannot publish - Issues must be resolved',
  },
};

const factorConfig: Record<
  keyof RiskFactors,
  { label: string; icon: React.ElementType; maxPoints: number }
> = {
  aiDetectionRisk: {
    label: 'AI Detection',
    icon: Zap,
    maxPoints: 40,
  },
  complianceViolations: {
    label: 'Compliance',
    icon: Shield,
    maxPoints: 30,
  },
  qualityDeficits: {
    label: 'Quality',
    icon: FileWarning,
    maxPoints: 20,
  },
  structuralIssues: {
    label: 'Structure',
    icon: Link2,
    maxPoints: 10,
  },
};

export function RiskLevelDisplay({
  assessment,
  isLoading = false,
  onRefresh,
  className = '',
}: RiskLevelDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className={`glass-card p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-400">Analyzing risk...</span>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className={`glass-card p-4 ${className}`}>
        <div className="text-center py-4">
          <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No risk assessment available</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 text-xs text-forge-orange hover:underline"
            >
              Run assessment
            </button>
          )}
        </div>
      </div>
    );
  }

  const config = levelConfig[assessment.level];
  const Icon = config.icon;

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`p-4 ${config.bg} border-b ${config.border} cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${config.text}`} />
            <div>
              <h3 className={`font-semibold ${config.text}`}>{config.label}</h3>
              <p className="text-xs text-gray-400">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-2xl font-bold ${config.text}`}>
                {assessment.score}
              </p>
              <p className="text-xs text-gray-500">Risk Score</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Auto-publish indicator */}
        {assessment.autoPublishEligible && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Eligible for auto-publish</span>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Risk Factor Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Risk Factors
            </h4>
            <div className="space-y-3">
              {(Object.keys(assessment.factors) as (keyof RiskFactors)[]).map(
                (factor) => {
                  const factorCfg = factorConfig[factor];
                  const value = assessment.factors[factor];
                  const percentage = (value / factorCfg.maxPoints) * 100;
                  const FactorIcon = factorCfg.icon;

                  return (
                    <div key={factor}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <FactorIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-300">
                            {factorCfg.label}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {value}/{factorCfg.maxPoints}
                        </span>
                      </div>
                      <div className="h-1.5 bg-void-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentage > 60
                              ? 'bg-red-500'
                              : percentage > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Blocking Issues */}
          {assessment.blockingIssues.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase mb-3">
                Blocking Issues ({assessment.blockingIssues.length})
              </h4>
              <div className="space-y-2">
                {assessment.blockingIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-sm text-red-300">{issue.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {issue.resolution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {assessment.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Recommendations
              </h4>
              <div className="space-y-2">
                {assessment.recommendations.slice(0, 3).map((rec, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      rec.priority === 'high'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          rec.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400'
                            : rec.priority === 'medium'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <p className="text-sm text-gray-300 flex-1">
                        {rec.message}
                      </p>
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">
                      Expected improvement: -{rec.expectedImprovement} points
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Scores Summary */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
              Quality Scores
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Overall', value: assessment.analysis.qualityScores.overall },
                { label: 'Humanness', value: assessment.analysis.qualityScores.humanness },
                { label: 'SEO', value: assessment.analysis.qualityScores.seo },
                { label: 'Readability', value: assessment.analysis.qualityScores.readability },
                { label: 'Structure', value: assessment.analysis.qualityScores.structure },
                { label: 'Voice', value: assessment.analysis.qualityScores.voice },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-2 bg-void-950/50 rounded-lg text-center"
                >
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
            >
              Refresh Assessment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
