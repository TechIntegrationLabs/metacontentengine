import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Tag,
  Info,
  TrendingUp,
} from 'lucide-react';
import type { MonetizationResult, CategoryMatch, ShortcodeSlot } from '@content-engine/generation';
import { Button } from '../primitives/Button';
import { ShortcodeSlotCard } from './ShortcodeSlotCard';

interface ShortcodeInspectorProps {
  result: MonetizationResult | null;
  onAddShortcode?: () => void;
  onAutoInsert?: () => void;
  onPreviewSlot?: (slot: ShortcodeSlot) => void;
  onEditSlot?: (slot: ShortcodeSlot) => void;
  onRemoveSlot?: (slotId: string) => void;
  isLoading?: boolean;
  maxCategoriesDisplay?: number;
  className?: string;
}

export function ShortcodeInspector({
  result,
  onAddShortcode,
  onAutoInsert,
  onPreviewSlot,
  onEditSlot,
  onRemoveSlot,
  isLoading = false,
  maxCategoriesDisplay = 5,
  className = '',
}: ShortcodeInspectorProps) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [shortcodesExpanded, setShortcodesExpanded] = useState(true);

  const shortcodesCount = result?.insertedSlots.length || 0;
  const categoriesCount = result?.matchedCategories.length || 0;
  const avgMatchScore =
    result && result.matchedCategories.length > 0
      ? Math.round(
          result.matchedCategories.reduce((sum, cat) => sum + cat.matchScore, 0) /
            result.matchedCategories.length
        )
      : 0;

  const displayedCategories = categoriesExpanded
    ? result?.matchedCategories || []
    : (result?.matchedCategories || []).slice(0, maxCategoriesDisplay);

  const hasMoreCategories = categoriesCount > maxCategoriesDisplay;

  return (
    <div className={`glass-panel p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-green-500/10">
          <DollarSign className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-void-100">Monetization</h3>
          <p className="text-sm text-void-400 mt-0.5">
            {categoriesCount > 0
              ? `${categoriesCount} matching ${categoriesCount === 1 ? 'category' : 'categories'} detected`
              : 'No matches found'}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-void-700 border-t-green-400 mb-3" />
            <p className="text-sm text-void-300">Analyzing monetization opportunities...</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!isLoading && result && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-void-900/30 rounded-lg border border-void-700/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-xs text-void-400">Shortcodes</span>
            </div>
            <p className="text-2xl font-bold text-void-100">{shortcodesCount}</p>
          </div>

          <div className="p-4 bg-void-900/30 rounded-lg border border-void-700/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-void-400">Avg Match</span>
            </div>
            <p className="text-2xl font-bold text-void-100">{avgMatchScore}%</p>
          </div>

          <div className="p-4 bg-void-900/30 rounded-lg border border-void-700/30">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-void-400">Categories</span>
            </div>
            <p className="text-2xl font-bold text-void-100">{categoriesCount}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !result && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-void-800/50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-void-600" />
          </div>
          <p className="text-void-300 mb-2">No monetization data available</p>
          <p className="text-sm text-void-500">
            Analyze content to find monetization opportunities
          </p>
        </div>
      )}

      {/* Detected Categories Section */}
      {!isLoading && result && categoriesCount > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-void-900/30 hover:bg-void-900/50 border border-void-700/30 transition-colors mb-3"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-void-200">Detected Categories</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                {categoriesCount}
              </span>
            </div>
            {categoriesExpanded ? (
              <ChevronUp className="w-4 h-4 text-void-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-void-400" />
            )}
          </button>

          <AnimatePresence>
            {categoriesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  {displayedCategories.map((match, index) => (
                    <CategoryMatchCard key={match.category.id} match={match} index={index} />
                  ))}

                  {!categoriesExpanded && hasMoreCategories && (
                    <button
                      onClick={() => setCategoriesExpanded(true)}
                      className="w-full p-3 rounded-lg border border-dashed border-void-700 text-void-400 hover:text-void-200 hover:border-void-600 transition-colors text-sm"
                    >
                      +{categoriesCount - maxCategoriesDisplay} more{' '}
                      {categoriesCount - maxCategoriesDisplay === 1 ? 'category' : 'categories'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Inserted Shortcodes Section */}
      {!isLoading && result && (
        <div className="mb-6">
          <button
            onClick={() => setShortcodesExpanded(!shortcodesExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-void-900/30 hover:bg-void-900/50 border border-void-700/30 transition-colors mb-3"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-void-200">Inserted Shortcodes</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                {shortcodesCount}
              </span>
            </div>
            {shortcodesExpanded ? (
              <ChevronUp className="w-4 h-4 text-void-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-void-400" />
            )}
          </button>

          <AnimatePresence>
            {shortcodesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {shortcodesCount > 0 ? (
                  <div className="space-y-3">
                    {result.insertedSlots.map((slot, index) => (
                      <ShortcodeSlotCard
                        key={slot.id}
                        slot={slot}
                        index={index}
                        onPreview={onPreviewSlot}
                        onEdit={onEditSlot}
                        onRemove={onRemoveSlot}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 border border-dashed border-void-700 rounded-lg">
                    <Sparkles className="w-12 h-12 text-void-600 mx-auto mb-3" />
                    <p className="text-void-300 mb-2">No shortcodes inserted yet</p>
                    <p className="text-sm text-void-500 mb-4">
                      Add shortcodes manually or use auto-insert to optimize placement
                    </p>
                    {onAutoInsert && categoriesCount > 0 && (
                      <Button
                        variant="forge"
                        size="md"
                        onClick={onAutoInsert}
                        leftIcon={<Sparkles className="w-4 h-4" />}
                      >
                        Auto-Insert Optimal Shortcodes
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons */}
      {!isLoading && result && shortcodesCount > 0 && (
        <div className="flex gap-3">
          {onAddShortcode && (
            <Button
              variant="secondary"
              size="md"
              onClick={onAddShortcode}
              leftIcon={<Plus className="w-4 h-4" />}
              fullWidth
            >
              Add Shortcode
            </Button>
          )}
          {onAutoInsert && (
            <Button
              variant="primary"
              size="md"
              onClick={onAutoInsert}
              leftIcon={<Sparkles className="w-4 h-4" />}
              fullWidth
            >
              Auto-Insert
            </Button>
          )}
        </div>
      )}

      {/* Info Box */}
      {!isLoading && result && (
        <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-1">About Shortcodes</h4>
              <p className="text-xs text-void-400 leading-relaxed">
                Shortcodes are dynamic content placeholders that get replaced with monetization
                elements when published. They're automatically matched to your content based on
                category, keywords, and topics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Category Match Card Component
function CategoryMatchCard({ match, index }: { match: CategoryMatch; index: number }) {
  const { category, matchScore, matchedKeywords, matchedTopics } = match;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-void-900/30 rounded-lg border border-void-700/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-void-100 mb-1">{category.category}</h4>
          {category.subCategory && (
            <p className="text-xs text-void-400">{category.subCategory}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-void-500">Match Score</div>
            <div
              className={`text-lg font-bold ${
                matchScore >= 80
                  ? 'text-green-400'
                  : matchScore >= 60
                  ? 'text-yellow-400'
                  : 'text-orange-400'
              }`}
            >
              {matchScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Match Score Bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
            className={`h-full ${
              matchScore >= 80
                ? 'bg-green-500'
                : matchScore >= 60
                ? 'bg-yellow-500'
                : 'bg-orange-500'
            }`}
          />
        </div>
      </div>

      {/* Matched Keywords/Topics */}
      {(matchedKeywords.length > 0 || matchedTopics.length > 0) && (
        <div className="space-y-2">
          {matchedKeywords.length > 0 && (
            <div>
              <div className="text-xs text-void-500 mb-1.5">Matched Keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.slice(0, 5).map((keyword, i) => (
                  <span
                    key={i}
                    className="inline-flex px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20"
                  >
                    {keyword}
                  </span>
                ))}
                {matchedKeywords.length > 5 && (
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-void-800 text-void-400 text-xs">
                    +{matchedKeywords.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {matchedTopics.length > 0 && (
            <div>
              <div className="text-xs text-void-500 mb-1.5">Matched Topics</div>
              <div className="flex flex-wrap gap-1.5">
                {matchedTopics.slice(0, 5).map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20"
                  >
                    {topic}
                  </span>
                ))}
                {matchedTopics.length > 5 && (
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-void-800 text-void-400 text-xs">
                    +{matchedTopics.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default ShortcodeInspector;
