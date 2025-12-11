import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  colorClass?: 'indigo' | 'amber' | 'emerald' | 'purple' | 'orange';
  isLoading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  colorClass = 'indigo',
  isLoading = false,
  className = '',
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend !== undefined && trend === 0;

  const colorMap = {
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'bg-indigo-500/5' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'bg-amber-500/5' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'bg-emerald-500/5' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'bg-purple-500/5' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'bg-orange-500/5' },
  };

  const colors = colorMap[colorClass];

  if (isLoading) {
    return (
      <div className={['glass-card rounded-2xl p-6 relative overflow-hidden', className].join(' ')}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-700 rounded-lg" />
            <div className="h-3 bg-slate-700 rounded w-24" />
          </div>
          <div className="h-8 bg-slate-700 rounded w-32" />
          {subtitle && <div className="h-2 bg-slate-700 rounded w-20" />}
        </div>
      </div>
    );
  }

  return (
    <div className={['glass-card rounded-2xl p-6 relative group overflow-hidden', className].join(' ')}>
      {/* Glow effect */}
      <div
        className={[
          'absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none',
          colors.glow,
        ].join(' ')}
      />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          {/* Header with icon */}
          <div className="flex items-center space-x-2 mb-2">
            <div className={['p-1.5 rounded-lg border', colors.bg, colors.border].join(' ')}>
              {icon}
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              {title}
            </p>
          </div>

          {/* Value */}
          <h3 className="text-3xl font-display font-bold text-white mb-1 tracking-tight">
            {value}
          </h3>

          {/* Subtitle */}
          {subtitle && <p className="text-xs text-slate-500 font-mono">{subtitle}</p>}
        </div>

        {/* Trend indicator */}
        {trend !== undefined && (
          <div
            className={[
              'flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full border shrink-0',
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : isNegative
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
            ].join(' ')}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isNeutral && <Minus className="w-3 h-3" />}
            <span>
              {isPositive ? '+' : ''}
              {trend}%
            </span>
          </div>
        )}
      </div>

      {/* Trend label */}
      {trendLabel && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">{trendLabel}</p>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
