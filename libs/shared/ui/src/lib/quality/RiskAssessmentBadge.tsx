import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface BlockingIssue {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning';
}

export interface RiskFactors {
  plagiarism?: {
    score: number;
    threshold: number;
    sources?: string[];
  };
  aiDetection?: {
    score: number;
    threshold: number;
    confidence: number;
  };
  factualAccuracy?: {
    score: number;
    unverifiedClaims: number;
  };
  brandCompliance?: {
    score: number;
    violations: string[];
  };
}

interface RiskAssessmentBadgeProps {
  riskLevel: RiskLevel;
  riskFactors?: RiskFactors;
  blockingIssues?: BlockingIssue[];
  showDetails?: boolean;
  className?: string;
}

export default function RiskAssessmentBadge({
  riskLevel,
  riskFactors,
  blockingIssues = [],
  showDetails = false,
  className = '',
}: RiskAssessmentBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRiskConfig = (level: RiskLevel) => {
    const configs = {
      low: {
        icon: ShieldCheck,
        label: 'Low Risk',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
      },
      medium: {
        icon: Shield,
        label: 'Medium Risk',
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
      },
      high: {
        icon: ShieldAlert,
        label: 'High Risk',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
      },
      critical: {
        icon: ShieldAlert,
        label: 'Critical Risk',
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-400/20',
      },
    };
    return configs[level];
  };

  const config = getRiskConfig(riskLevel);
  const Icon = config.icon;
  const hasDetails = riskFactors || blockingIssues.length > 0;

  return (
    <div className={`glass-card border ${config.border} ${className}`}>
      {/* Header */}
      <div
        className={`p-4 flex items-center justify-between ${
          hasDetails && showDetails ? 'cursor-pointer hover:bg-void-800/30' : ''
        } transition-colors`}
        onClick={() => hasDetails && showDetails && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${config.bg}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-void-100">{config.label}</h3>
            {blockingIssues.length > 0 && (
              <p className="text-xs text-void-400 mt-0.5">
                {blockingIssues.length} blocking issue(s)
              </p>
            )}
          </div>
        </div>

        {hasDetails && showDetails && (
          <button className="text-void-400 hover:text-void-100 transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="border-t border-void-700/50 p-4 bg-void-900/30 space-y-4">
          {/* Blocking issues */}
          {blockingIssues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-void-100 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Blocking Issues
              </h4>
              <div className="space-y-2">
                {blockingIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-void-900/50 rounded-lg border border-void-700/30"
                  >
                    <h5 className="text-sm font-medium text-void-100">
                      {issue.title}
                    </h5>
                    <p className="text-xs text-void-400 mt-1">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {riskFactors && (
            <div>
              <h4 className="text-sm font-medium text-void-100 mb-3">
                Risk Factors
              </h4>
              <div className="space-y-3">
                {/* Plagiarism */}
                {riskFactors.plagiarism && (
                  <div className="p-3 bg-void-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-void-300">Plagiarism Detection</span>
                      <span
                        className={`text-sm font-medium ${
                          riskFactors.plagiarism.score > riskFactors.plagiarism.threshold
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {riskFactors.plagiarism.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-void-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          riskFactors.plagiarism.score > riskFactors.plagiarism.threshold
                            ? 'bg-red-400'
                            : 'bg-green-400'
                        }`}
                        style={{ width: `${riskFactors.plagiarism.score}%` }}
                      />
                    </div>
                    {riskFactors.plagiarism.sources && riskFactors.plagiarism.sources.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-void-500 mb-1">Potential sources:</p>
                        <ul className="text-xs text-void-400 space-y-0.5">
                          {riskFactors.plagiarism.sources.slice(0, 3).map((source, i) => (
                            <li key={i} className="truncate">• {source}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Detection */}
                {riskFactors.aiDetection && (
                  <div className="p-3 bg-void-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-void-300">AI Detection</span>
                      <span
                        className={`text-sm font-medium ${
                          riskFactors.aiDetection.score > riskFactors.aiDetection.threshold
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {riskFactors.aiDetection.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-void-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          riskFactors.aiDetection.score > riskFactors.aiDetection.threshold
                            ? 'bg-red-400'
                            : 'bg-green-400'
                        }`}
                        style={{ width: `${riskFactors.aiDetection.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-void-500 mt-2">
                      Confidence: {riskFactors.aiDetection.confidence}%
                    </p>
                  </div>
                )}

                {/* Factual Accuracy */}
                {riskFactors.factualAccuracy && (
                  <div className="p-3 bg-void-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-void-300">Factual Accuracy</span>
                      <span
                        className={`text-sm font-medium ${
                          riskFactors.factualAccuracy.score < 70
                            ? 'text-red-400'
                            : riskFactors.factualAccuracy.score < 85
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        {riskFactors.factualAccuracy.score}%
                      </span>
                    </div>
                    {riskFactors.factualAccuracy.unverifiedClaims > 0 && (
                      <p className="text-xs text-void-500">
                        {riskFactors.factualAccuracy.unverifiedClaims} unverified claim(s)
                      </p>
                    )}
                  </div>
                )}

                {/* Brand Compliance */}
                {riskFactors.brandCompliance && (
                  <div className="p-3 bg-void-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-void-300">Brand Compliance</span>
                      <span
                        className={`text-sm font-medium ${
                          riskFactors.brandCompliance.score < 70
                            ? 'text-red-400'
                            : riskFactors.brandCompliance.score < 85
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        {riskFactors.brandCompliance.score}%
                      </span>
                    </div>
                    {riskFactors.brandCompliance.violations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-void-500 mb-1">Violations:</p>
                        <ul className="text-xs text-void-400 space-y-0.5">
                          {riskFactors.brandCompliance.violations.map((violation, i) => (
                            <li key={i}>• {violation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
