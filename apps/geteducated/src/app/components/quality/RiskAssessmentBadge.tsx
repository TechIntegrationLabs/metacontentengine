import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskAssessmentBadgeProps {
  level: RiskLevel;
  score?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const riskConfig: Record<RiskLevel, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
  label: string;
  description: string;
}> = {
  LOW: {
    icon: ShieldCheck,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    label: 'Low Risk',
    description: 'Safe to auto-publish',
  },
  MEDIUM: {
    icon: Shield,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Medium Risk',
    description: 'Review recommended',
  },
  HIGH: {
    icon: ShieldAlert,
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    label: 'High Risk',
    description: 'Manual review required',
  },
  CRITICAL: {
    icon: ShieldX,
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    label: 'Critical Risk',
    description: 'Cannot publish - blocking issues',
  },
};

const RiskAssessmentBadge: React.FC<RiskAssessmentBadgeProps> = ({
  level,
  score,
  showLabel = true,
  size = 'md',
  onClick,
}) => {
  const config = riskConfig[level];
  const Icon = config.icon;

  const sizes = {
    sm: { icon: 'w-4 h-4', padding: 'px-2 py-1', text: 'text-xs' },
    md: { icon: 'w-5 h-5', padding: 'px-3 py-1.5', text: 'text-sm' },
    lg: { icon: 'w-6 h-6', padding: 'px-4 py-2', text: 'text-base' },
  };

  const sizeConfig = sizes[size];

  return (
    <div
      className={[
        'inline-flex items-center space-x-2 rounded-lg border',
        config.bg,
        config.border,
        sizeConfig.padding,
        onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : '',
      ].join(' ')}
      onClick={onClick}
      title={config.description}
    >
      <Icon className={[sizeConfig.icon, config.text].join(' ')} />
      {showLabel && (
        <span className={[sizeConfig.text, 'font-medium', config.text].join(' ')}>
          {config.label}
        </span>
      )}
      {score !== undefined && (
        <span className={['font-mono opacity-70', sizeConfig.text, config.text].join(' ')}>
          ({score})
        </span>
      )}
    </div>
  );
};

export default RiskAssessmentBadge;

// Additional component for detailed risk breakdown
export interface RiskFactors {
  aiDetectionRisk: number;
  complianceViolations: number;
  qualityDeficits: number;
  structuralIssues: number;
}

export interface BlockingIssue {
  id: string;
  category: 'ai_detection' | 'compliance' | 'quality' | 'structure';
  severity: 'error' | 'critical';
  message: string;
  resolution: string;
}

interface RiskAssessmentDetailProps {
  level: RiskLevel;
  score: number;
  factors: RiskFactors;
  blockingIssues: BlockingIssue[];
  autoPublishEligible: boolean;
  onResolve?: (issueId: string) => void;
}

export const RiskAssessmentDetail: React.FC<RiskAssessmentDetailProps> = ({
  level,
  score,
  factors,
  blockingIssues,
  autoPublishEligible,
  onResolve,
}) => {
  const config = riskConfig[level];

  const factorLabels: Record<keyof RiskFactors, { label: string; max: number }> = {
    aiDetectionRisk: { label: 'AI Detection Risk', max: 40 },
    complianceViolations: { label: 'Compliance Violations', max: 30 },
    qualityDeficits: { label: 'Quality Deficits', max: 20 },
    structuralIssues: { label: 'Structural Issues', max: 10 },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <RiskAssessmentBadge level={level} score={score} size="lg" />
        <div className="flex items-center space-x-2">
          {autoPublishEligible ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Auto-publish eligible</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm flex items-center space-x-1">
              <XCircle className="w-4 h-4" />
              <span>Manual review required</span>
            </span>
          )}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-void-900/50 rounded-xl border border-white/5 p-4 space-y-3">
        <h4 className="text-sm font-medium text-white mb-3">Risk Breakdown</h4>
        {Object.entries(factors).map(([key, value]) => {
          const factorKey = key as keyof RiskFactors;
          const { label, max } = factorLabels[factorKey];
          const percentage = (value / max) * 100;
          const color = percentage > 70 ? 'bg-red-500' : percentage > 40 ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-mono">{value}/{max}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={[color, 'h-full rounded-full transition-all'].join(' ')}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Blocking Issues */}
      {blockingIssues.length > 0 && (
        <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-4">
          <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Blocking Issues ({blockingIssues.length})</span>
          </h4>
          <div className="space-y-2">
            {blockingIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 bg-void-950/50 rounded-lg border border-red-500/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white">{issue.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{issue.resolution}</p>
                  </div>
                  {onResolve && (
                    <button
                      onClick={() => onResolve(issue.id)}
                      className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
