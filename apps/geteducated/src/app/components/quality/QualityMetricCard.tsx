import React from 'react';
import {
  BookOpen,
  Search,
  Bot,
  LayoutList,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export type MetricType = 'readability' | 'seo' | 'humanness' | 'structure' | 'voice';

interface QualityMetricCardProps {
  type: MetricType;
  score: number;
  details?: Record<string, string | number>;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const metricConfig: Record<MetricType, { icon: React.ComponentType<{ className?: string }>; label: string; description: string }> = {
  readability: {
    icon: BookOpen,
    label: 'Readability',
    description: 'How easy the content is to read and understand',
  },
  seo: {
    icon: Search,
    label: 'SEO',
    description: 'Search engine optimization factors',
  },
  humanness: {
    icon: Bot,
    label: 'Humanness',
    description: 'AI detection avoidance and natural writing patterns',
  },
  structure: {
    icon: LayoutList,
    label: 'Structure',
    description: 'Content organization and formatting',
  },
  voice: {
    icon: Mic,
    label: 'Voice',
    description: 'Tone consistency and brand voice matching',
  },
};

const QualityMetricCard: React.FC<QualityMetricCardProps> = ({
  type,
  score,
  details,
  isExpanded = false,
  onToggle,
}) => {
  const config = metricConfig[type];
  const Icon = config.icon;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (score >= 60) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
  };

  const colors = getScoreColor(score);

  const formatValue = (key: string, value: string | number) => {
    if (typeof value === 'number') {
      if (key.includes('percent') || key.includes('Percent')) {
        return `${value.toFixed(1)}%`;
      }
      return value.toFixed(1);
    }
    return value;
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div
      className={[
        'bg-void-900/50 rounded-xl border p-4 transition-all',
        colors.border,
        onToggle ? 'cursor-pointer hover:border-white/10' : '',
      ].join(' ')}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={['w-10 h-10 rounded-lg flex items-center justify-center', colors.bg].join(' ')}>
            <Icon className={['w-5 h-5', colors.text].join(' ')} />
          </div>
          <div>
            <h4 className="font-medium text-white">{config.label}</h4>
            <p className="text-xs text-slate-500">{config.description}</p>
          </div>
        </div>
        <div className={['text-2xl font-bold', colors.text].join(' ')}>
          {Math.round(score)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={['h-full rounded-full transition-all duration-500', colors.bg.replace('/10', '')].join(' ')}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Expanded details */}
      {isExpanded && details && Object.keys(details).length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{formatLabel(key)}</span>
              <span className="text-white font-mono">{formatValue(key, value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QualityMetricCard;
