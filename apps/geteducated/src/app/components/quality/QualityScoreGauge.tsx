import React from 'react';

interface QualityScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const QualityScoreGauge: React.FC<QualityScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  label = 'Quality Score',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return { stroke: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    if (score >= 80) return { stroke: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-400' };
    if (score >= 70) return { stroke: '#eab308', bg: 'bg-amber-500/10', text: 'text-amber-400' };
    if (score >= 60) return { stroke: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400' };
    return { stroke: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400' };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    if (score >= 60) return 'Needs Work';
    return 'Poor';
  };

  const sizes = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl' },
  };

  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        {/* Background circle */}
        <svg
          className="absolute transform -rotate-90"
          width={width}
          height={width}
        >
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        {/* Score value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={[fontSize, 'font-bold', colors.text].join(' ')}>
            {Math.round(score)}
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-slate-500 mt-1">{getScoreLabel(score)}</span>
          )}
        </div>
      </div>

      {showLabel && (
        <span className="text-sm text-slate-400 mt-2">{label}</span>
      )}
    </div>
  );
};

export default QualityScoreGauge;
