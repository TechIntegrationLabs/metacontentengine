import { useState } from 'react';
import {
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RevisionComparison, RevisionDiff } from '@content-engine/types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../primitives/Button';

interface RevisionDiffViewProps {
  comparison: RevisionComparison;
  viewMode?: 'side-by-side' | 'unified';
  onClose?: () => void;
}

const diffTypeColors = {
  added: 'bg-green-500/10 border-green-500/30 text-green-400',
  removed: 'bg-red-500/10 border-red-500/30 text-red-400',
  modified: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

const diffTypeIcons = {
  added: Plus,
  removed: Minus,
  modified: Edit3,
};

export function RevisionDiffView({
  comparison,
  viewMode: initialViewMode = 'unified',
  onClose,
}: RevisionDiffViewProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>(
    initialViewMode
  );
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleField = (field: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(field)) {
      newExpanded.delete(field);
    } else {
      newExpanded.add(field);
    }
    setExpandedFields(newExpanded);
  };

  // Group diffs by field
  const groupedDiffs = comparison.diffs.reduce((acc, diff) => {
    const baseField = diff.field.split('(')[0].trim();
    if (!acc[baseField]) {
      acc[baseField] = [];
    }
    acc[baseField].push(diff);
    return acc;
  }, {} as Record<string, RevisionDiff[]>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderDiffValue = (
    value: string | undefined,
    type: 'old' | 'new',
    diffType: RevisionDiff['type']
  ) => {
    if (!value) return null;

    const shouldHighlight =
      (type === 'old' && diffType !== 'added') ||
      (type === 'new' && diffType !== 'removed');

    return (
      <div
        className={`p-3 rounded-lg font-mono text-xs ${
          shouldHighlight
            ? type === 'old'
              ? 'bg-red-500/5 border border-red-500/20'
              : 'bg-green-500/5 border border-green-500/20'
            : 'bg-white/5 border border-white/10'
        }`}
      >
        <pre className="whitespace-pre-wrap break-words text-slate-300">
          {value.length > 500 ? value.substring(0, 500) + '...' : value}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Version Comparison</h3>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div>
              <span className="font-medium text-white">
                Version {comparison.fromVersion}
              </span>
              <span className="mx-2">→</span>
              <span className="font-medium text-white">
                Version {comparison.toVersion}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div>{formatDate(comparison.toRevision.createdAt)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'unified'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Side by Side
            </button>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Total Changes</div>
          <div className="text-2xl font-bold text-white">
            {comparison.diffs.length}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-green-400 mb-1">
            <Plus className="w-4 h-4" />
            Additions
          </div>
          <div className="text-2xl font-bold text-white">{comparison.additions}</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-red-400 mb-1">
            <Minus className="w-4 h-4" />
            Deletions
          </div>
          <div className="text-2xl font-bold text-white">{comparison.deletions}</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Word Count</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            {comparison.wordCountChange > 0 ? '+' : ''}
            {comparison.wordCountChange}
          </div>
        </GlassCard>
      </div>

      {/* Diffs by field */}
      <div className="space-y-4">
        {Object.entries(groupedDiffs).map(([field, diffs]) => {
          const isExpanded = expandedFields.has(field);
          const primaryDiff = diffs[0];
          const Icon = diffTypeIcons[primaryDiff.type];

          return (
            <GlassCard key={field} className="overflow-hidden">
              {/* Field header */}
              <button
                onClick={() => toggleField(field)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}

                  <div
                    className={`p-1.5 rounded-lg border ${
                      diffTypeColors[primaryDiff.type]
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="text-left">
                    <div className="font-semibold text-white">{field}</div>
                    <div className="text-xs text-slate-400">
                      {diffs.length} change{diffs.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  {primaryDiff.type === 'added' && 'Added'}
                  {primaryDiff.type === 'removed' && 'Removed'}
                  {primaryDiff.type === 'modified' && 'Modified'}
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {diffs.map((diff, idx) => (
                        <div key={idx} className="space-y-2">
                          {diff.field !== field && (
                            <div className="text-xs text-slate-400 font-mono">
                              {diff.field}
                            </div>
                          )}

                          {viewMode === 'side-by-side' ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                  <Minus className="w-3 h-3 text-red-400" />
                                  Version {comparison.fromVersion}
                                </div>
                                {renderDiffValue(diff.oldValue, 'old', diff.type)}
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                  <Plus className="w-3 h-3 text-green-400" />
                                  Version {comparison.toVersion}
                                </div>
                                {renderDiffValue(diff.newValue, 'new', diff.type)}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {diff.oldValue && (
                                <div>
                                  <div className="text-xs text-red-400 mb-1 flex items-center gap-1">
                                    <Minus className="w-3 h-3" />
                                    Before
                                  </div>
                                  {renderDiffValue(diff.oldValue, 'old', diff.type)}
                                </div>
                              )}

                              {diff.oldValue && diff.newValue && (
                                <div className="flex justify-center">
                                  <ArrowRight className="w-4 h-4 text-slate-600" />
                                </div>
                              )}

                              {diff.newValue && (
                                <div>
                                  <div className="text-xs text-green-400 mb-1 flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    After
                                  </div>
                                  {renderDiffValue(diff.newValue, 'new', diff.type)}
                                </div>
                              )}
                            </div>
                          )}

                          {diff.context && (
                            <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                              <div className="text-xs text-slate-500 mb-1">Context:</div>
                              <pre className="text-xs text-slate-400 whitespace-pre-wrap">
                                {diff.context}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>

      {comparison.diffs.length === 0 && (
        <GlassCard className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-white mb-2">No Changes Found</h4>
          <p className="text-slate-400">
            These two versions are identical in content.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
