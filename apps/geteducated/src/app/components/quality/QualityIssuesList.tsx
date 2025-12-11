import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Wand2,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';

export type IssueSeverity = 'info' | 'warning' | 'error';
export type IssueType = 'readability' | 'seo' | 'ai_detected' | 'structure' | 'voice' | 'grammar' | 'compliance';

export interface QualityIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  location?: {
    start: number;
    end: number;
    text: string;
  };
  suggestion?: string;
  autoFixable: boolean;
}

export interface AutoFixSuggestion {
  issueId: string;
  original: string;
  replacement: string;
  confidence: number;
  explanation: string;
}

interface QualityIssuesListProps {
  issues: QualityIssue[];
  autoFixes?: AutoFixSuggestion[];
  onApplyFix?: (fix: AutoFixSuggestion) => void;
  onDismissIssue?: (issueId: string) => void;
  onJumpToIssue?: (issue: QualityIssue) => void;
}

const severityConfig: Record<IssueSeverity, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }> = {
  error: {
    icon: AlertCircle,
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
};

const typeLabels: Record<IssueType, string> = {
  readability: 'Readability',
  seo: 'SEO',
  ai_detected: 'AI Detection',
  structure: 'Structure',
  voice: 'Voice',
  grammar: 'Grammar',
  compliance: 'Compliance',
};

const QualityIssuesList: React.FC<QualityIssuesListProps> = ({
  issues,
  autoFixes = [],
  onApplyFix,
  onDismissIssue,
  onJumpToIssue,
}) => {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');

  const filteredIssues = issues.filter((issue) => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (filterType !== 'all' && issue.type !== filterType) return false;
    return true;
  });

  const issuesByType = filteredIssues.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<IssueSeverity, QualityIssue[]>);

  const getAutoFix = (issueId: string) => autoFixes.find((f) => f.issueId === issueId);

  const counts = {
    error: issues.filter((i) => i.severity === 'error').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-400">{issues.length} issues found</span>
          <div className="flex items-center space-x-2">
            {counts.error > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs">
                {counts.error} errors
              </span>
            )}
            {counts.warning > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                {counts.warning} warnings
              </span>
            )}
            {counts.info > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                {counts.info} info
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as IssueSeverity | 'all')}
            className="px-3 py-1.5 bg-void-950/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Severities</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as IssueType | 'all')}
            className="px-3 py-1.5 bg-void-950/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All Types</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400">No issues found</p>
          <p className="text-sm text-slate-500">Your content looks great!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue) => {
            const config = severityConfig[issue.severity];
            const Icon = config.icon;
            const isExpanded = expandedIssue === issue.id;
            const autoFix = getAutoFix(issue.id);

            return (
              <div
                key={issue.id}
                className={[
                  'rounded-lg border transition-all',
                  config.border,
                  isExpanded ? 'bg-void-900/50' : 'bg-void-950/50 hover:bg-void-900/30',
                ].join(' ')}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={['p-1.5 rounded', config.bg].join(' ')}>
                      <Icon className={['w-4 h-4', config.text].join(' ')} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={['text-sm font-medium', config.text].join(' ')}>
                          {typeLabels[issue.type]}
                        </span>
                        {issue.autoFixable && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px]">
                            Auto-fix
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white mt-1">{issue.message}</p>
                      {issue.location && (
                        <p className="text-xs text-slate-500 mt-1 font-mono truncate">
                          "{issue.location.text}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {onJumpToIssue && issue.location && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToIssue(issue);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Jump to location"
                        >
                          <ChevronUp className="w-4 h-4 rotate-45" />
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

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-white/5 mt-2 pt-3">
                    {issue.suggestion && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Suggestion:</p>
                        <p className="text-sm text-slate-300">{issue.suggestion}</p>
                      </div>
                    )}

                    {autoFix && onApplyFix && (
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-indigo-400 mb-2 flex items-center space-x-1">
                              <Wand2 className="w-3 h-3" />
                              <span>Auto-fix available ({autoFix.confidence}% confidence)</span>
                            </p>
                            <div className="text-sm space-y-1">
                              <p className="text-slate-500">
                                <span className="line-through">{autoFix.original}</span>
                              </p>
                              <p className="text-emerald-400">{autoFix.replacement}</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{autoFix.explanation}</p>
                          </div>
                          <button
                            onClick={() => onApplyFix(autoFix)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm flex items-center space-x-1 transition-colors"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>Apply</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {onDismissIssue && (
                      <button
                        onClick={() => onDismissIssue(issue.id)}
                        className="mt-3 text-xs text-slate-500 hover:text-slate-400 flex items-center space-x-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Dismiss this issue</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QualityIssuesList;
