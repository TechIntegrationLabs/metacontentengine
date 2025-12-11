import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type MetricType = 'readability' | 'seo' | 'engagement' | 'originality' | 'accuracy';

interface MetricDetail {
  label: string;
  value: string | number;
  status?: 'good' | 'warning' | 'error';
}

interface QualityMetricCardProps {
  type: MetricType;
  score: number;
  label: string;
  description?: string;
  details?: MetricDetail[];
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

const defaultIcons: Record<MetricType, React.ComponentType<{ className?: string }>> = {
  readability: ({ className }) => <Info className={className} />,
  seo: ({ className }) => <Info className={className} />,
  engagement: ({ className }) => <Info className={className} />,
  originality: ({ className }) => <Info className={className} />,
  accuracy: ({ className }) => <Info className={className} />,
};

export default function QualityMetricCard({
  type,
  score,
  label,
  description,
  details = [],
  icon: Icon,
  className = '',
}: QualityMetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = Icon || defaultIcons[type];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-400/10';
    if (score >= 60) return 'bg-yellow-400/10';
    return 'bg-orange-400/10';
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return 'border-green-400/20';
    if (score >= 60) return 'border-yellow-400/20';
    return 'border-orange-400/20';
  };

  const getStatusIcon = (status?: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`glass-card border ${getScoreBorder(score)} ${className}`}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-void-800/30 transition-colors"
        onClick={() => details.length > 0 && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2.5 rounded-lg ${getScoreBg(score)}`}>
            <IconComponent className={`w-5 h-5 ${getScoreColor(score)}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-void-100">{label}</h3>
            {description && (
              <p className="text-xs text-void-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {Math.round(score)}
          </span>
          {details.length > 0 && (
            <button className="text-void-400 hover:text-void-100 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {isExpanded && details.length > 0 && (
        <div className="border-t border-void-700/50 p-4 bg-void-900/30">
          <div className="space-y-3">
            {details.map((detail, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(detail.status)}
                  <span className="text-void-300">{detail.label}</span>
                </div>
                <span className="text-void-100 font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
