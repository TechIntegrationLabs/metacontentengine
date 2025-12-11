import { useState } from 'react';
import { AlertTriangle, RotateCcw, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArticleRevision } from '@content-engine/types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../primitives/Button';

interface RestoreConfirmDialogProps {
  revision: ArticleRevision;
  currentVersion: number;
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isRestoring?: boolean;
}

export function RestoreConfirmDialog({
  revision,
  currentVersion,
  isOpen,
  onConfirm,
  onCancel,
  isRestoring = false,
}: RestoreConfirmDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  const versionsDiff = currentVersion - revision.version;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl"
            >
              <GlassCard className="relative">
                {/* Close button */}
                <button
                  onClick={onCancel}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  disabled={isRestoring}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        Restore Previous Version?
                      </h3>
                      <p className="text-slate-300">
                        This will restore your article to{' '}
                        <strong className="text-white">
                          Version {revision.version}
                        </strong>{' '}
                        from {formatDate(revision.createdAt)}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Warning box */}
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-slate-300">
                        <p className="font-medium text-yellow-400 mb-1">
                          Important Information
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            Your current version will be saved automatically before
                            restoring
                          </li>
                          <li>
                            You will lose {versionsDiff} version
                            {versionsDiff !== 1 ? 's' : ''} of changes
                          </li>
                          <li>You can restore again if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Version comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-xs text-slate-400 mb-1">Current Version</div>
                      <div className="text-2xl font-bold text-white">
                        {currentVersion}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <div className="text-xs text-slate-400 mb-1">
                        Restoring to Version
                      </div>
                      <div className="text-2xl font-bold text-indigo-400">
                        {revision.version}
                      </div>
                    </div>
                  </div>

                  {/* Revision details */}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-left text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {showDetails ? 'Hide' : 'Show'} revision details
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Title</div>
                            <div className="text-sm text-white font-medium">
                              {revision.title}
                            </div>
                          </div>

                          {revision.changeSummary && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">
                                Change Summary
                              </div>
                              <div className="text-sm text-slate-300">
                                {revision.changeSummary}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">
                                Created By
                              </div>
                              <div className="text-sm text-white">
                                {revision.createdByName || 'Unknown'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-slate-400 mb-1">
                                Word Count
                              </div>
                              <div className="text-sm text-white">
                                {revision.content
                                  .trim()
                                  .split(/\s+/)
                                  .filter(Boolean)
                                  .length.toLocaleString()}{' '}
                                words
                              </div>
                            </div>
                          </div>

                          {revision.excerpt && (
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Excerpt</div>
                              <div className="text-sm text-slate-300 line-clamp-2">
                                {revision.excerpt}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isRestoring}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="forge"
                    onClick={handleConfirm}
                    isLoading={isRestoring}
                    leftIcon={!isRestoring && <RotateCcw className="w-4 h-4" />}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore Version'}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
