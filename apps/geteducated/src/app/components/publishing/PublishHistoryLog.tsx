import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface PublishLogEntry {
  id: string;
  articleId: string;
  articleTitle: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  statusCode?: number;
  timestamp: Date;
  responseTime?: number;
  error?: string;
  retryCount?: number;
  webhookUrl: string;
}

interface PublishHistoryLogProps {
  entries: PublishLogEntry[];
  onRetry?: (entryId: string) => void;
  onViewArticle?: (articleId: string) => void;
  maxEntries?: number;
}

const PublishHistoryLog: React.FC<PublishHistoryLogProps> = ({
  entries,
  onRetry,
  onViewArticle,
  maxEntries = 20,
}) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getStatusConfig = (status: PublishLogEntry['status']) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          label: 'Published',
        };
      case 'failed':
        return {
          icon: XCircle,
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          label: 'Failed',
        };
      case 'pending':
        return {
          icon: Clock,
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          label: 'Pending',
        };
      case 'retrying':
        return {
          icon: RefreshCw,
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          label: 'Retrying',
        };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const displayedEntries = entries.slice(0, maxEntries);
  const hasMore = entries.length > maxEntries;

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No publish history yet</p>
        <p className="text-sm text-slate-500">Published articles will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedEntries.map((entry) => {
        const config = getStatusConfig(entry.status);
        const Icon = config.icon;
        const isExpanded = expanded.has(entry.id);

        return (
          <div
            key={entry.id}
            className={[
              'rounded-lg border transition-all',
              entry.status === 'failed' ? 'border-red-500/20' : 'border-white/5',
              isExpanded ? 'bg-void-900/50' : 'bg-void-950/50 hover:bg-void-900/30',
            ].join(' ')}
          >
            <div
              className="p-3 cursor-pointer"
              onClick={() => toggleExpanded(entry.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={['p-1.5 rounded', config.bg].join(' ')}>
                    <Icon className={[
                      'w-4 h-4',
                      config.text,
                      entry.status === 'retrying' ? 'animate-spin' : '',
                    ].join(' ')} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium truncate max-w-[300px]">
                      {entry.articleTitle}
                    </p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={config.text}>{config.label}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500">{formatTime(entry.timestamp)}</span>
                      {entry.statusCode && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 font-mono">{entry.statusCode}</span>
                        </>
                      )}
                      {entry.responseTime && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">{entry.responseTime}ms</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {entry.status === 'failed' && onRetry && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetry(entry.id);
                      }}
                      className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      Retry
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-white/5 mt-2 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Webhook URL</span>
                  <span className="text-slate-300 font-mono text-xs truncate max-w-[250px]">
                    {entry.webhookUrl}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="text-slate-300">
                    {entry.timestamp.toLocaleString()}
                  </span>
                </div>
                {entry.retryCount !== undefined && entry.retryCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Retry Attempts</span>
                    <span className="text-slate-300">{entry.retryCount}</span>
                  </div>
                )}
                {entry.error && (
                  <div className="mt-2 p-2 bg-red-500/5 rounded-lg">
                    <p className="text-xs text-red-400">{entry.error}</p>
                  </div>
                )}
                {onViewArticle && (
                  <button
                    onClick={() => onViewArticle(entry.articleId)}
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm flex items-center justify-center space-x-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Article</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <p className="text-center text-sm text-slate-500 py-2">
          Showing {maxEntries} of {entries.length} entries
        </p>
      )}
    </div>
  );
};

export default PublishHistoryLog;
