import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  colorClass?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  colorClass = 'indigo',
  className = '',
}: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const bgColor = colorClass === 'indigo' ? 'bg-indigo-500/10' : 
                  colorClass === 'amber' ? 'bg-amber-500/10' :
                  colorClass === 'emerald' ? 'bg-emerald-500/10' :
                  colorClass === 'purple' ? 'bg-purple-500/10' : 'bg-indigo-500/10';

  const borderColor = colorClass === 'indigo' ? 'border-indigo-500/20' : 
                      colorClass === 'amber' ? 'border-amber-500/20' :
                      colorClass === 'emerald' ? 'border-emerald-500/20' :
                      colorClass === 'purple' ? 'border-purple-500/20' : 'border-indigo-500/20';

  return (
    <div className={['glass-card rounded-2xl p-6 relative group overflow-hidden', className].join(' ')}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className={['p-1.5 rounded-lg border', bgColor, borderColor].join(' ')}>
              {icon}
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
          </div>
          <h3 className="text-3xl font-display font-bold text-white mb-1 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 font-mono">{subtitle}</p>
          )}
        </div>
        {trend !== undefined && (
          <div className={[
            'flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full border',
            isPositive 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : isNegative 
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
          ].join(' ')}>
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
