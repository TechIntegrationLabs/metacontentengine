/**
 * ShortcodeInspector Component
 *
 * Panel for viewing and managing monetization shortcodes in an article.
 * Shows matched categories, inserted shortcodes, and allows manual insertion.
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Sparkles,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Zap,
  Info,
} from 'lucide-react';
import type {
  ShortcodeSlot,
  CategoryMatch,
  MonetizationResult,
} from '@content-engine/generation';
import { ShortcodeSlotCard } from './ShortcodeSlotCard';

interface ShortcodeInspectorProps {
  result: MonetizationResult | null;
  isAnalyzing?: boolean;
  onAnalyze: () => void;
  onAddShortcode: () => void;
  onAutoInsert: () => void;
  onEditSlot: (slot: ShortcodeSlot) => void;
  onRemoveSlot: (slotId: string) => void;
  onPreviewSlot: (slot: ShortcodeSlot) => void;
  className?: string;
}

export function ShortcodeInspector({
  result,
  isAnalyzing = false,
  onAnalyze,
  onAddShortcode,
  onAutoInsert,
  onEditSlot,
  onRemoveSlot,
  onPreviewSlot,
  className = '',
}: ShortcodeInspectorProps) {
  const [showCategories, setShowCategories] = useState(true);
  const [showShortcodes, setShowShortcodes] = useState(true);

  const stats = useMemo(() => {
    if (!result) return null;

    return {
      totalMatches: result.totalMatches,
      insertedCount: result.insertedSlots.length,
      avgMatchScore:
        result.matchedCategories.length > 0
          ? Math.round(
              result.matchedCategories.reduce((sum, m) => sum + m.matchScore, 0) /
                result.matchedCategories.length
            )
          : 0,
      topCategory: result.matchedCategories[0]?.category.category || null,
    };
  }, [result]);

  if (isAnalyzing) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center gap-3 justify-center py-8">
          <Sparkles className="w-6 h-6 text-forge-orange animate-pulse" />
          <span className="text-gray-300">Analyzing content for monetization...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            No Monetization Analysis
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Analyze your content to find monetization opportunities
          </p>
          <button
            onClick={onAnalyze}
            className="px-4 py-2 bg-forge-orange hover:bg-forge-orange/90 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-forge-orange/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-forge-orange" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Monetization</h3>
              <p className="text-xs text-gray-400">
                {stats?.totalMatches || 0} categories matched
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAnalyze}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Re-analyze"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-void-950/50 rounded-lg text-center">
              <p className="text-xl font-bold text-white">{stats.insertedCount}</p>
              <p className="text-xs text-gray-500">Shortcodes</p>
            </div>
            <div className="p-3 bg-void-950/50 rounded-lg text-center">
              <p className="text-xl font-bold text-emerald-400">{stats.avgMatchScore}%</p>
              <p className="text-xs text-gray-500">Avg Match</p>
            </div>
            <div className="p-3 bg-void-950/50 rounded-lg text-center">
              <p className="text-xl font-bold text-white">{stats.totalMatches}</p>
              <p className="text-xs text-gray-500">Categories</p>
            </div>
          </div>
        )}
      </div>

      {/* Matched Categories */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowCategories(!showCategories)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-white">
              Detected Categories ({result.matchedCategories.length})
            </span>
          </div>
          {showCategories ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showCategories && (
          <div className="px-4 pb-4 space-y-2">
            {result.matchedCategories.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                No matching categories found
              </div>
            ) : (
              result.matchedCategories.slice(0, 5).map((match) => (
                <div
                  key={match.category.id}
                  className="p-3 bg-void-950/50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">
                        {match.category.category}
                      </p>
                      {match.category.subCategory && (
                        <p className="text-xs text-gray-500">
                          {match.category.subCategory}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        match.matchScore >= 80
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : match.matchScore >= 60
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {match.matchScore}% match
                    </div>
                  </div>

                  {(match.matchedKeywords.length > 0 || match.matchedTopics.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded"
                        >
                          {kw}
                        </span>
                      ))}
                      {match.matchedTopics.map((topic) => (
                        <span
                          key={topic}
                          className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {result.matchedCategories.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                +{result.matchedCategories.length - 5} more categories
              </p>
            )}
          </div>
        )}
      </div>

      {/* Inserted Shortcodes */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setShowShortcodes(!showShortcodes)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-white">
              Inserted Shortcodes ({result.insertedSlots.length})
            </span>
          </div>
          {showShortcodes ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showShortcodes && (
          <div className="px-4 pb-4 space-y-3">
            {result.insertedSlots.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-gray-500 text-sm mb-3">
                  No shortcodes inserted yet
                </p>
                <button
                  onClick={onAutoInsert}
                  disabled={result.matchedCategories.length === 0}
                  className="px-4 py-2 bg-forge-orange/20 hover:bg-forge-orange/30 text-forge-orange rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Auto-Insert Optimal
                </button>
              </div>
            ) : (
              result.insertedSlots.map((slot, index) => (
                <ShortcodeSlotCard
                  key={slot.id}
                  slot={slot}
                  index={index}
                  onEdit={onEditSlot}
                  onRemove={onRemoveSlot}
                  onPreview={onPreviewSlot}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAddShortcode}
          className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Shortcode
        </button>
        <button
          onClick={onAutoInsert}
          disabled={result.matchedCategories.length === 0}
          className="flex-1 px-4 py-2 bg-forge-orange/20 hover:bg-forge-orange/30 text-forge-orange rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Auto-Insert
        </button>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Shortcodes will be rendered as interactive elements (degree tables, CTAs, etc.)
            when the article is published to WordPress.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShortcodeInspector;
