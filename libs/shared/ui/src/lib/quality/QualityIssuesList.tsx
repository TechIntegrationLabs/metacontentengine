import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Filter,
  Search,
  CheckCircle,
} from 'lucide-react';

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueType = 'readability' | 'seo' | 'grammar' | 'plagiarism' | 'factual' | 'tone';

export interface AutoFixSuggestion {
  description: string;
  confidence: number;
  preview?: string;
}

export interface QualityIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  location?: string;
  autoFix?: AutoFixSuggestion;
  isFixed?: boolean;
}

interface QualityIssuesListProps {
  issues: QualityIssue[];
  onFixIssue?: (issueId: string) => void;
  onDismissIssue?: (issueId: string) => void;
  showFilters?: boolean;
  className?: string;
}

export default function QualityIssuesList({
  issues,
  onFixIssue,
  onDismissIssue,
  showFilters = true,
  className = '',
}: QualityIssuesListProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | 'all'>('all');
  const [selectedType, setSelectedType] = useState<IssueType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getSeverityConfig = (severity: IssueSeverity) => {
    const configs = {
      error: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-400/20',
      },
      warning: {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
      },
      info: {
        icon: Info,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
      },
    };
    return configs[severity];
  };

  const filteredIssues = issues.filter((issue) => {
    if (issue.isFixed) return false;
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    if (selectedType !== 'all' && issue.type !== selectedType) return false;
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !issue.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const issuesByType = filteredIssues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<IssueType, number>);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-void-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-void-900/50 border border-void-700/50 rounded-lg text-void-100 placeholder-void-500 focus:outline-none focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange/50"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Severity filter */}
            {(['all', 'error', 'warning', 'info'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setSelectedSeverity(severity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedSeverity === severity
                    ? 'bg-forge-orange text-white'
                    : 'bg-void-800/50 text-void-400 hover:bg-void-700/50'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Type filter */}
            {(['all', 'readability', 'seo', 'grammar', 'plagiarism', 'factual', 'tone'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-forge-indigo text-white'
                    : 'bg-void-800/50 text-void-400 hover:bg-void-700/50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && issuesByType[type as IssueType] > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-void-900/50 rounded text-[10px]">
                    {issuesByType[type as IssueType]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Issues list */}
      <div className="space-y-2">
        {filteredIssues.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-void-300">No issues found</p>
            <p className="text-sm text-void-500 mt-1">
              {issues.filter(i => i.isFixed).length > 0
                ? `${issues.filter(i => i.isFixed).length} issue(s) fixed`
                : 'Your content looks great!'}
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const config = getSeverityConfig(issue.severity);
            const Icon = config.icon;

            return (
              <div
                key={issue.id}
                className={`glass-card border ${config.border} p-4 hover:border-opacity-40 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-void-100">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-void-400 mt-1">
                          {issue.description}
                        </p>
                        {issue.location && (
                          <p className="text-xs text-void-500 mt-1">
                            Location: {issue.location}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.color} font-medium`}>
                          {issue.type}
                        </span>
                      </div>
                    </div>

                    {/* Auto-fix suggestion */}
                    {issue.autoFix && onFixIssue && (
                      <div className="mt-3 p-3 bg-void-900/50 rounded-lg border border-void-700/30">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-forge-purple flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-void-300">
                              {issue.autoFix.description}
                            </p>
                            {issue.autoFix.preview && (
                              <div className="mt-2 p-2 bg-void-950/50 rounded text-xs text-void-400 font-mono">
                                {issue.autoFix.preview}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => onFixIssue(issue.id)}
                                className="px-3 py-1.5 bg-forge-purple hover:bg-forge-purple/80 text-white text-xs rounded-lg transition-colors"
                              >
                                Apply Fix
                              </button>
                              <span className="text-xs text-void-500">
                                Confidence: {Math.round(issue.autoFix.confidence)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dismiss button */}
                    {onDismissIssue && (
                      <button
                        onClick={() => onDismissIssue(issue.id)}
                        className="mt-2 text-xs text-void-500 hover:text-void-300 transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
