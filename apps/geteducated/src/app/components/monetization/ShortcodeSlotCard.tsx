/**
 * ShortcodeSlotCard Component
 *
 * Displays a single shortcode slot with preview, edit, and remove actions.
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Code,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MapPin,
} from 'lucide-react';
import type { ShortcodeSlot, ShortcodePosition } from '@content-engine/generation';

interface ShortcodeSlotCardProps {
  slot: ShortcodeSlot;
  index: number;
  onEdit?: (slot: ShortcodeSlot) => void;
  onRemove?: (slotId: string) => void;
  onPreview?: (slot: ShortcodeSlot) => void;
  className?: string;
}

const positionLabels: Record<ShortcodePosition, string> = {
  after_intro: 'After Introduction',
  mid_content: 'Mid-Content',
  before_conclusion: 'Before Conclusion',
  sidebar: 'Sidebar',
};

const positionColors: Record<ShortcodePosition, { bg: string; text: string }> = {
  after_intro: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  mid_content: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  before_conclusion: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  sidebar: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
};

export function ShortcodeSlotCard({
  slot,
  index,
  onEdit,
  onRemove,
  onPreview,
  className = '',
}: ShortcodeSlotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const position = positionColors[slot.position];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(slot.shortcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-forge-orange/20 text-forge-orange font-bold text-sm">
              {index + 1}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-gray-400" />
                <code className="text-sm text-gray-300 font-mono truncate max-w-[300px]">
                  {slot.shortcode.slice(0, 50)}
                  {slot.shortcode.length > 50 && '...'}
                </code>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className={`px-2 py-0.5 rounded ${position.bg} ${position.text}`}>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {positionLabels[slot.position]}
                </span>
                <span className="text-gray-500">
                  Category: <span className="text-gray-400">{slot.categoryName}</span>
                </span>
                <span className="text-gray-500">
                  Match: <span className="text-emerald-400">{slot.matchScore}%</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          {/* Full Shortcode */}
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">
              Full Shortcode
            </label>
            <div className="relative">
              <pre className="p-3 bg-void-950 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto">
                {slot.shortcode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Copy shortcode"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Parameters */}
          {Object.keys(slot.params).length > 0 && (
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-400 uppercase mb-2 block">
                Parameters
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(slot.params).map(([key, value]) => (
                  <div key={key} className="p-2 bg-void-950 rounded-lg">
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-sm text-gray-300 truncate">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
            {onPreview && (
              <button
                onClick={() => onPreview(slot)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(slot)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(slot.id)}
                className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShortcodeSlotCard;
