import { useState } from 'react';
import { Clock, User, FileText, RotateCcw, GitBranch, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RevisionListItem } from '@content-engine/types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../primitives/Button';

interface RevisionHistoryProps {
  revisions: RevisionListItem[];
  currentVersion?: number;
  onCompare?: (fromId: string, toId: string) => void;
  onRestore?: (revisionId: string) => void;
  isLoading?: boolean;
}

const changeTypeColors = {
  auto: 'text-slate-400',
  manual: 'text-blue-400',
  publish: 'text-green-400',
  restore: 'text-purple-400',
};

const changeTypeLabels = {
  auto: 'Auto-saved',
  manual: 'Manual save',
  publish: 'Published',
  restore: 'Restored',
};

export function RevisionHistory({
  revisions,
  currentVersion,
  onCompare,
  onRestore,
  isLoading = false,
}: RevisionHistoryProps) {
  const [selectedRevisions, setSelectedRevisions] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSelectRevision = (id: string) => {
    if (selectedRevisions.includes(id)) {
      setSelectedRevisions(selectedRevisions.filter((r) => r !== id));
    } else if (selectedRevisions.length < 2) {
      setSelectedRevisions([...selectedRevisions, id]);
    } else {
      // Replace oldest selection
      setSelectedRevisions([selectedRevisions[1], id]);
    }
  };

  const handleCompare = () => {
    if (selectedRevisions.length === 2 && onCompare) {
      onCompare(selectedRevisions[0], selectedRevisions[1]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Revision History</h3>
          <span className="text-sm text-slate-400">
            ({revisions.length} version{revisions.length !== 1 ? 's' : ''})
          </span>
        </div>

        {selectedRevisions.length === 2 && onCompare && (
          <Button variant="secondary" size="sm" onClick={handleCompare}>
            Compare Selected
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-indigo-500/20 to-transparent" />

        <div className="space-y-3">
          {isLoading ? (
            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                <span className="text-slate-400">Loading revisions...</span>
              </div>
            </GlassCard>
          ) : revisions.length === 0 ? (
            <GlassCard className="p-6">
              <p className="text-slate-400 text-center">No revisions found</p>
            </GlassCard>
          ) : (
            <AnimatePresence>
              {revisions.map((revision, index) => {
                const isSelected = selectedRevisions.includes(revision.id);
                const isCurrent = revision.version === currentVersion;
                const isExpanded = expandedId === revision.id;

                return (
                  <motion.div
                    key={revision.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard
                      className={`relative transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5'
                          : 'hover:bg-white/5'
                      } ${isCurrent ? 'border-l-2 border-green-500' : ''}`}
                    >
                      <div className="p-4">
                        {/* Timeline node */}
                        <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-void-950 border-2 border-indigo-500 shadow-glow-subtle z-10" />

                        <div className="ml-8">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">
                                  Version {revision.version}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                                    Current
                                  </span>
                                )}
                                <span
                                  className={`text-xs font-medium ${
                                    changeTypeColors[revision.changeType]
                                  }`}
                                >
                                  {changeTypeLabels[revision.changeType]}
                                </span>
                              </div>

                              {revision.changeSummary && (
                                <p className="text-sm text-slate-300 mb-2">
                                  {revision.changeSummary}
                                </p>
                              )}

                              {/* Metadata */}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(revision.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {revision.createdByName}
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {revision.wordCount.toLocaleString()} words
                                </div>
                                {revision.wordCountDelta !== 0 && (
                                  <div
                                    className={`flex items-center gap-1 ${
                                      revision.wordCountDelta > 0
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    }`}
                                  >
                                    {revision.wordCountDelta > 0 ? (
                                      <TrendingUp className="w-3 h-3" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3" />
                                    )}
                                    {revision.wordCountDelta > 0 ? '+' : ''}
                                    {revision.wordCountDelta}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {onCompare && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectRevision(revision.id)}
                                  className={
                                    isSelected ? 'bg-indigo-500/20 text-indigo-400' : ''
                                  }
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </Button>
                              )}

                              {!isCurrent && onRestore && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => onRestore(revision.id)}
                                  leftIcon={<RotateCcw className="w-3 h-3" />}
                                >
                                  Restore
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer instructions */}
      {revisions.length > 0 && onCompare && (
        <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <p className="text-xs text-slate-400">
            <strong className="text-indigo-400">Tip:</strong> Select two versions to
            compare changes, or restore any previous version to undo recent edits.
          </p>
        </div>
      )}
    </div>
  );
}
