/**
 * Internal Link Suggester Component
 *
 * Displays intelligent internal link suggestions in a sidebar panel.
 * Shows relevance scores, matched topics/keywords, and allows one-click insertion.
 */

import React, { useState, useEffect } from 'react';
import { Link2, TrendingUp, Calendar, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import type { LinkSuggestion } from '@content-engine/generation';

interface InternalLinkSuggesterProps {
  articleTitle: string;
  articleContent: string;
  articleTopics: string[];
  articleKeywords: string[];
  onInsertLink?: (suggestion: LinkSuggestion) => void;
  onAutoInsert?: (suggestions: LinkSuggestion[]) => void;
  currentLinkCount?: number;
  targetLinkCount?: { min: number; max: number };
  className?: string;
}

export function InternalLinkSuggester({
  articleTitle,
  articleContent,
  articleTopics,
  articleKeywords,
  onInsertLink,
  onAutoInsert,
  currentLinkCount = 0,
  targetLinkCount = { min: 3, max: 5 },
  className = '',
}: InternalLinkSuggesterProps) {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertedLinks, setInsertedLinks] = useState<Set<string>>(new Set());

  // Fetch suggestions when article context changes
  useEffect(() => {
    if (articleTitle && articleContent) {
      fetchSuggestions();
    }
  }, [articleTitle, articleTopics, articleKeywords]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call to Edge Function
      // This would call a Supabase Edge Function that uses InternalLinkService
      const mockSuggestions: LinkSuggestion[] = [
        {
          id: '1',
          targetUrl: '/best-online-mba-programs-2024',
          targetTitle: 'Best Online MBA Programs 2024',
          targetExcerpt: 'Comprehensive rankings of top online MBA programs...',
          anchorText: 'top MBA programs',
          relevanceScore: 92,
          scoreBreakdown: {
            titleOverlap: 30,
            topicMatch: 30,
            keywordMatch: 20,
            recencyBonus: 10,
            linkEquityPenalty: 2,
          },
          alreadyLinked: false,
          matchedTopics: ['MBA', 'online education', 'business'],
          matchedKeywords: ['online degree', 'business', 'MBA'],
        },
        {
          id: '2',
          targetUrl: '/how-to-choose-accredited-online-school',
          targetTitle: 'How to Choose an Accredited Online School',
          targetExcerpt: 'Learn what to look for when selecting an accredited online program...',
          anchorText: 'accredited online programs',
          relevanceScore: 78,
          scoreBreakdown: {
            titleOverlap: 20,
            topicMatch: 20,
            keywordMatch: 15,
            recencyBonus: 7,
            linkEquityPenalty: -10,
          },
          alreadyLinked: false,
          matchedTopics: ['accreditation', 'online education'],
          matchedKeywords: ['online', 'accredited'],
        },
        {
          id: '3',
          targetUrl: '/financial-aid-guide-online-students',
          targetTitle: 'Financial Aid Guide for Online Students',
          targetExcerpt: 'Everything you need to know about paying for your online degree...',
          anchorText: 'financial aid options',
          relevanceScore: 65,
          scoreBreakdown: {
            titleOverlap: 10,
            topicMatch: 20,
            keywordMatch: 10,
            recencyBonus: 10,
            linkEquityPenalty: 0,
          },
          alreadyLinked: false,
          matchedTopics: ['financial aid', 'online education'],
          matchedKeywords: ['online'],
        },
      ];

      setSuggestions(mockSuggestions);
    } catch (err) {
      setError('Failed to fetch link suggestions');
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertLink = (suggestion: LinkSuggestion) => {
    setInsertedLinks((prev) => new Set(prev).add(suggestion.id));
    onInsertLink?.(suggestion);
  };

  const handleAutoInsert = () => {
    const topSuggestions = suggestions
      .filter((s) => !insertedLinks.has(s.id))
      .slice(0, targetLinkCount.max - currentLinkCount);

    topSuggestions.forEach((s) => {
      setInsertedLinks((prev) => new Set(prev).add(s.id));
    });

    onAutoInsert?.(topSuggestions);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    return 'text-orange-400';
  };

  const getScoreBarColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const linkProgress = Math.min((currentLinkCount / targetLinkCount.min) * 100, 100);

  return (
    <div className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-forge-orange" />
          <h3 className="text-lg font-display font-semibold text-white">
            Internal Link Suggestions
          </h3>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Link Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">
            Target: {targetLinkCount.min}-{targetLinkCount.max} internal links
          </span>
          <span className={currentLinkCount >= targetLinkCount.min ? 'text-emerald-400' : 'text-orange-400'}>
            Current: {currentLinkCount}
          </span>
        </div>
        <div className="h-2 bg-void-950 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              currentLinkCount >= targetLinkCount.min ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
            style={{ width: `${linkProgress}%` }}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-forge-orange animate-spin" />
          <span className="ml-2 text-gray-400">Finding relevant links...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && !error && suggestions.length > 0 && (
        <>
          <div className="space-y-4 mb-4">
            {suggestions.map((suggestion) => {
              const isInserted = insertedLinks.has(suggestion.id);

              return (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isInserted
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-void-900/50 border-white/5 hover:border-forge-orange/30'
                  }`}
                >
                  {/* Title and Score */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white flex-1 line-clamp-2">
                      {suggestion.targetTitle}
                    </h4>
                    <span
                      className={`text-xs font-semibold ml-2 ${getScoreColor(
                        suggestion.relevanceScore
                      )}`}
                    >
                      {suggestion.relevanceScore}%
                    </span>
                  </div>

                  {/* Excerpt */}
                  {suggestion.targetExcerpt && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      {suggestion.targetExcerpt}
                    </p>
                  )}

                  {/* Score Bar */}
                  <div className="h-1 bg-void-950 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all ${getScoreBarColor(
                        suggestion.relevanceScore
                      )}`}
                      style={{ width: `${suggestion.relevanceScore}%` }}
                    />
                  </div>

                  {/* Match Details */}
                  <div className="space-y-2 mb-3">
                    {suggestion.matchedTopics.length > 0 && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-3 h-3 text-forge-indigo mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Matched Topics:</p>
                          <p className="text-xs text-gray-300">
                            {suggestion.matchedTopics.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    {suggestion.matchedKeywords.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3 h-3 text-forge-purple mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Matched Keywords:</p>
                          <p className="text-xs text-gray-300">
                            {suggestion.matchedKeywords.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anchor Text */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Suggested anchor text:</p>
                    <code className="text-xs bg-void-950 px-2 py-1 rounded text-forge-orange">
                      {suggestion.anchorText}
                    </code>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInsertLink(suggestion)}
                      disabled={isInserted}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isInserted
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                          : 'bg-forge-orange/10 hover:bg-forge-orange/20 text-forge-orange'
                      }`}
                    >
                      {isInserted ? 'Link Inserted' : 'Insert Link'}
                    </button>
                    <a
                      href={suggestion.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Preview article"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-Insert Button */}
          {suggestions.filter((s) => !insertedLinks.has(s.id)).length > 0 &&
            currentLinkCount < targetLinkCount.max && (
              <button
                onClick={handleAutoInsert}
                className="w-full px-4 py-3 rounded-lg bg-forge-orange/10 hover:bg-forge-orange/20 text-forge-orange font-medium text-sm transition-all border border-forge-orange/30"
              >
                Auto-Insert Best {Math.min(targetLinkCount.max - currentLinkCount, 3)} Links
              </button>
            )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && suggestions.length === 0 && (
        <div className="text-center py-8">
          <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-2">No suggestions available</p>
          <p className="text-gray-500 text-xs">
            Add topics and keywords to get relevant link suggestions
          </p>
        </div>
      )}
    </div>
  );
}

export default InternalLinkSuggester;
