import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Edit2,
  Trash2,
  Check,
  Code2,
} from 'lucide-react';
import type { ShortcodeSlot, ShortcodePosition } from '@content-engine/generation';
import { Button } from '../primitives/Button';

interface ShortcodeSlotCardProps {
  slot: ShortcodeSlot;
  index: number;
  onPreview?: (slot: ShortcodeSlot) => void;
  onEdit?: (slot: ShortcodeSlot) => void;
  onRemove?: (slotId: string) => void;
  className?: string;
}

const POSITION_COLORS: Record<ShortcodePosition, { bg: string; text: string; border: string }> = {
  after_intro: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  mid_content: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  before_conclusion: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  sidebar: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
};

const POSITION_LABELS: Record<ShortcodePosition, string> = {
  after_intro: 'After Introduction',
  mid_content: 'Mid-Content',
  before_conclusion: 'Before Conclusion',
  sidebar: 'Sidebar',
};

export function ShortcodeSlotCard({
  slot,
  index,
  onPreview,
  onEdit,
  onRemove,
  className = '',
}: ShortcodeSlotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const positionColor = POSITION_COLORS[slot.position];
  const positionLabel = POSITION_LABELS[slot.position];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(slot.shortcode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const truncateShortcode = (shortcode: string, maxLength: number = 60) => {
    if (shortcode.length <= maxLength) return shortcode;
    return shortcode.slice(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`glass-card p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Index Badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-forge-purple/10 border border-forge-purple/30 flex items-center justify-center">
          <span className="text-sm font-bold text-forge-purple">{index + 1}</span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Shortcode Preview */}
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-void-400 flex-shrink-0" />
            <code className="text-sm text-void-200 font-mono truncate flex-1">
              {truncateShortcode(slot.shortcode)}
            </code>
          </div>

          {/* Position and Category */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${positionColor.bg} ${positionColor.text} ${positionColor.border}`}
            >
              {positionLabel}
            </span>
            <span className="text-xs text-void-400">•</span>
            <span className="text-xs text-void-300">{slot.categoryName}</span>
          </div>

          {/* Match Score */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-void-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${slot.matchScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${
                  slot.matchScore >= 80
                    ? 'bg-green-500'
                    : slot.matchScore >= 60
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
                }`}
              />
            </div>
            <span className="text-xs font-semibold text-void-300 w-10 text-right">
              {slot.matchScore}%
            </span>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-void-700/30 space-y-3">
                  {/* Full Shortcode */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-void-400">
                        Full Shortcode
                      </label>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-void-800/50 hover:bg-void-800 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-void-400" />
                            <span className="text-xs text-void-400">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 bg-void-950 rounded-lg border border-void-800">
                      <code className="text-xs text-void-200 font-mono break-all">
                        {slot.shortcode}
                      </code>
                    </div>
                  </div>

                  {/* Parameters */}
                  {Object.keys(slot.params).length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-void-400 mb-2 block">
                        Parameters
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(slot.params).map(([key, value]) => (
                          <div
                            key={key}
                            className="p-2 bg-void-900/30 rounded-lg border border-void-700/30"
                          >
                            <div className="text-xs text-void-500 mb-0.5">{key}</div>
                            <div className="text-xs text-void-200 font-medium truncate">
                              {String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-800/50 hover:bg-void-800 text-void-300 hover:text-void-100 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="text-xs">Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="text-xs">More</span>
                </>
              )}
            </button>

            {onPreview && (
              <button
                onClick={() => onPreview(slot)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs">Preview</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(slot)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/30 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="text-xs">Edit</span>
              </button>
            )}

            {onRemove && (
              <button
                onClick={() => onRemove(slot.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ShortcodeSlotCard;
