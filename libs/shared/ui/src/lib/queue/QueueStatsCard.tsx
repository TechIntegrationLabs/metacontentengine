import { Activity, Clock, CheckCircle2, XCircle, AlertCircle, Play, Calendar } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import type { QueueStats } from '@content-engine/generation';

interface QueueStatsCardProps {
  stats: QueueStats | null;
  isLoading?: boolean;
  className?: string;
}

export function QueueStatsCard({ stats, isLoading = false, className = '' }: QueueStatsCardProps) {
  if (isLoading) {
    return (
      <GlassCard variant="panel" hover={false} className={className}>
        <div className="p-6 space-y-4">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
              <div className="space-y-2">
                <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
                <div className="w-32 h-3 rounded bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-full h-3 rounded bg-white/5 animate-pulse" />
                <div className="w-12 h-6 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!stats) {
    return null;
  }

  const totalItems = stats.pending + stats.scheduled + stats.processing + stats.completed + stats.failed;

  const formatTime = (ms?: number): string => {
    if (!ms || ms < 60000) return 'Less than a minute';
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `~${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `~${hours}h ${remainingMins}m` : `~${hours}h`;
  };

  const statItems = [
    {
      label: 'Pending',
      count: stats.pending,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Scheduled',
      count: stats.scheduled,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Processing',
      count: stats.processing,
      icon: Play,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Completed',
      count: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Failed',
      count: stats.failed,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
  ];

  return (
    <GlassCard variant="panel" hover={false} className={className}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">Queue Activity</h3>
              {stats.estimatedWaitTime !== undefined && stats.pending > 0 && (
                <p className="text-xs text-slate-400 font-mono">
                  Est. wait: {formatTime(stats.estimatedWaitTime)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4">
          {statItems.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={['p-2 rounded-lg border mb-2', stat.bgColor, stat.borderColor].join(' ')}>
                  <Icon className={['w-4 h-4', stat.color].join(' ')} />
                </div>
                <span className="text-xs text-slate-400 mb-1 font-medium">{stat.label}</span>
                <span className={['text-2xl font-display font-bold', stat.color].join(' ')}>
                  {stat.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Last Hour</p>
                <p className="text-sm font-bold text-emerald-400">{stats.itemsLastHour}</p>
              </div>
            </div>

            {stats.avgProcessingTime !== undefined && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Avg. Time</p>
                  <p className="text-sm font-bold text-amber-400">
                    {formatTime(stats.avgProcessingTime)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Total Items</p>
            <p className="text-xl font-display font-bold text-white">{totalItems}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default QueueStatsCard;
