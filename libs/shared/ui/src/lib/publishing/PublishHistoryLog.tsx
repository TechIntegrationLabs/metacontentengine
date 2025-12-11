import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Zap,
} from 'lucide-react';

export interface PublishLogEntry {
  id: string;
  articleId: string;
  articleTitle: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  statusCode?: number;
  responseTime?: number;
  retryCount?: number;
  maxRetries?: number;
  errorMessage?: string;
  publishedAt: Date;
  publishedBy?: {
    id: string;
    name: string;
    email: string;
  };
  webhookUrl?: string;
  payload?: Record<string, unknown>;
  response?: unknown;
}

interface PublishHistoryLogProps {
  entries: PublishLogEntry[];
  onRetry?: (entryId: string) => void;
  onViewArticle?: (articleId: string) => void;
  maxHeight?: string;
}

const PublishHistoryLog: React.FC<PublishHistoryLogProps> = ({
  entries,
  onRetry,
  onViewArticle,
  maxHeight = '600px',
}) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const getStatusConfig = (entry: PublishLogEntry) => {
    switch (entry.status) {
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          label: 'Success',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'Failed',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-forge-indigo',
          bgColor: 'bg-forge-indigo/10',
          borderColor: 'border-forge-indigo/30',
          label: 'Pending',
        };
      case 'retrying':
        return {
          icon: RotateCw,
          color: 'text-forge-orange',
          bgColor: 'bg-forge-orange/10',
          borderColor: 'border-forge-orange/30',
          label: `Retrying (${entry.retryCount}/${entry.maxRetries})`,
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-void-400',
          bgColor: 'bg-void-800',
          borderColor: 'border-void-700',
          label: 'Unknown',
        };
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-void-500">
        <Clock className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No publish history yet</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 overflow-y-auto pr-2 custom-scrollbar"
      style={{ maxHeight }}
    >
      {entries.map((entry) => {
        const isExpanded = expandedEntries.has(entry.id);
        const statusConfig = getStatusConfig(entry);
        const StatusIcon = statusConfig.icon;

        return (
          <div
            key={entry.id}
            className={`bg-void-900/50 border ${statusConfig.borderColor} rounded-lg overflow-hidden transition-all`}
          >
            {/* Header */}
            <div
              className="flex items-start gap-3 p-4 cursor-pointer hover:bg-void-800/30 transition-colors"
              onClick={() => toggleExpanded(entry.id)}
            >
              <div className={`p-2 rounded ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-void-100 truncate">
                    {entry.articleTitle}
                  </h4>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-void-500">
                  <span>{formatTimestamp(entry.publishedAt)}</span>
                  {entry.statusCode && (
                    <span className="flex items-center gap-1">
                      <span
                        className={
                          entry.statusCode >= 200 && entry.statusCode < 300
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        {entry.statusCode}
                      </span>
                    </span>
                  )}
                  {entry.responseTime !== undefined && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {entry.responseTime}ms
                    </span>
                  )}
                  {entry.publishedBy && (
                    <span>by {entry.publishedBy.name}</span>
                  )}
                </div>
              </div>

              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-void-400 flex-shrink-0 mt-1" />
              ) : (
                <ChevronRight className="w-4 h-4 text-void-400 flex-shrink-0 mt-1" />
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-void-700 p-4 space-y-4">
                {/* Error Message */}
                {entry.errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-red-300 mb-1">
                          Error Details
                        </h5>
                        <p className="text-xs text-red-200/80">
                          {entry.errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Webhook URL */}
                {entry.webhookUrl && (
                  <div>
                    <h5 className="text-xs font-medium text-void-400 mb-1">
                      Webhook URL
                    </h5>
                    <p className="text-xs text-void-300 font-mono break-all">
                      {entry.webhookUrl}
                    </p>
                  </div>
                )}

                {/* Retry Info */}
                {entry.retryCount !== undefined && entry.retryCount > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-void-400 mb-1">
                      Retry Attempts
                    </h5>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-void-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-forge-orange h-full transition-all"
                          style={{
                            width: `${
                              ((entry.retryCount || 0) /
                                (entry.maxRetries || 3)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-void-400">
                        {entry.retryCount} / {entry.maxRetries || 3}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payload Preview */}
                {entry.payload && (
                  <div>
                    <h5 className="text-xs font-medium text-void-400 mb-1">
                      Request Payload
                    </h5>
                    <pre className="bg-void-950 border border-void-700 rounded p-2 text-xs text-void-300 overflow-x-auto max-h-40">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Preview */}
                {entry.response && (
                  <div>
                    <h5 className="text-xs font-medium text-void-400 mb-1">
                      Response
                    </h5>
                    <pre className="bg-void-950 border border-void-700 rounded p-2 text-xs text-void-300 overflow-x-auto max-h-40">
                      {typeof entry.response === 'string'
                        ? entry.response
                        : JSON.stringify(entry.response, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {onViewArticle && (
                    <button
                      onClick={() => onViewArticle(entry.articleId)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-void-800 hover:bg-void-700 text-void-100 text-xs rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Article
                    </button>
                  )}
                  {onRetry && entry.status === 'failed' && (
                    <button
                      onClick={() => onRetry(entry.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-forge-orange hover:bg-forge-orange/90 text-white text-xs rounded transition-colors"
                    >
                      <RotateCw className="w-3 h-3" />
                      Retry Publish
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(26, 28, 36, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(115, 115, 128, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(115, 115, 128, 0.7);
        }
      `}</style>
    </div>
  );
};

export default PublishHistoryLog;
