import { useCallback, useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from './useTenant';
import type {
  AnalyticsData,
  ArticleMetrics,
  ChartDataPoint,
  AnalyticsContributorStats,
  CategoryPerformance,
  DateRangeFilter,
  DateRangePreset,
} from '@content-engine/types';

interface UseAnalyticsProps {
  supabase: SupabaseClient;
  autoFetch?: boolean;
}

/**
 * Hook for fetching real analytics data from Supabase
 * Supports date range filtering and provides formatted data for charts
 */
export function useAnalytics({ supabase, autoFetch = true }: UseAnalyticsProps) {
  const { tenantId } = useTenant();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    preset: 'month',
  });

  /**
   * Calculate date range based on preset
   */
  const getDateRange = useCallback((filter: DateRangeFilter): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;

    if (filter.preset === 'custom' && filter.startDate && filter.endDate) {
      return {
        start: filter.startDate,
        end: filter.endDate,
      };
    }

    switch (filter.preset) {
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, []);

  /**
   * Fetch analytics data from Supabase
   */
  const fetchAnalytics = useCallback(
    async (customDateRange?: DateRangeFilter) => {
      if (!tenantId) {
        setData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const activeRange = customDateRange || dateRange;
        const { start, end } = getDateRange(activeRange);

        // Fetch all articles within date range
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select(
            `
            id,
            status,
            word_count,
            quality_score,
            created_at,
            published_at,
            contributor_id,
            category_ids,
            contributors:contributor_id (
              id,
              name,
              display_name
            )
          `
          )
          .eq('tenant_id', tenantId)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        if (articlesError) throw articlesError;

        // Calculate metrics
        const metrics: ArticleMetrics = {
          totalArticles: articles?.length || 0,
          publishedCount: articles?.filter((a) => a.status === 'published').length || 0,
          draftCount:
            articles?.filter((a) =>
              ['idea', 'outline', 'drafting', 'humanizing', 'review'].includes(a.status)
            ).length || 0,
          scheduledCount: articles?.filter((a) => a.status === 'scheduled').length || 0,
          averageQualityScore:
            articles && articles.length > 0
              ? articles.reduce((sum, a) => sum + (a.quality_score || 0), 0) / articles.length
              : 0,
          totalWordsGenerated:
            articles?.reduce((sum, a) => sum + (a.word_count || 0), 0) || 0,
        };

        // Generate chart data (grouped by day/week/month based on range)
        const chartData: ChartDataPoint[] = generateChartData(articles || [], start, end, activeRange.preset);

        // Calculate top contributors
        const contributorMap = new Map<string, AnalyticsContributorStats>();
        articles?.forEach((article) => {
          if (!article.contributor_id) return;

          const existing = contributorMap.get(article.contributor_id);
          const contributorName =
            (article.contributors as any)?.display_name ||
            (article.contributors as any)?.name ||
            'Unknown';

          if (existing) {
            existing.articles += 1;
            existing.totalWords += article.word_count || 0;
            existing.avgQuality =
              (existing.avgQuality * (existing.articles - 1) + (article.quality_score || 0)) /
              existing.articles;
          } else {
            contributorMap.set(article.contributor_id, {
              id: article.contributor_id,
              name: contributorName,
              articles: 1,
              avgQuality: article.quality_score || 0,
              totalWords: article.word_count || 0,
            });
          }
        });

        const topContributors = Array.from(contributorMap.values())
          .sort((a, b) => b.articles - a.articles)
          .slice(0, 5);

        // Calculate top categories
        const categoryMap = new Map<string, number>();
        articles?.forEach((article) => {
          article.category_ids?.forEach((catId: string) => {
            categoryMap.set(catId, (categoryMap.get(catId) || 0) + 1);
          });
        });

        // Fetch category names
        const categoryIds = Array.from(categoryMap.keys());
        let topCategories: CategoryPerformance[] = [];

        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);

          if (categories) {
            topCategories = categories
              .map((cat) => ({
                name: cat.name,
                count: categoryMap.get(cat.id) || 0,
                percentage: ((categoryMap.get(cat.id) || 0) / metrics.totalArticles) * 100,
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
          }
        }

        setData({
          metrics,
          chartData,
          topContributors,
          topCategories,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, tenantId, dateRange, getDateRange]
  );

  /**
   * Update date range and optionally refetch
   */
  const updateDateRange = useCallback(
    (newRange: DateRangeFilter, refetch = true) => {
      setDateRange(newRange);
      if (refetch) {
        fetchAnalytics(newRange);
      }
    },
    [fetchAnalytics]
  );

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (autoFetch && tenantId) {
      fetchAnalytics();
    }
  }, [autoFetch, tenantId, fetchAnalytics]);

  return {
    data,
    isLoading,
    error,
    dateRange,
    updateDateRange,
    refetch: fetchAnalytics,
  };
}

/**
 * Generate chart data points grouped by period
 */
function generateChartData(
  articles: any[],
  start: Date,
  end: Date,
  preset: DateRangePreset
): ChartDataPoint[] {
  const dataMap = new Map<string, { articles: number; words: number; qualityScores: number[] }>();

  // Determine grouping function based on preset
  const getGroupKey = (date: Date): string => {
    if (preset === 'week' || preset === 'month') {
      // Group by day
      return date.toISOString().split('T')[0];
    } else if (preset === 'quarter') {
      // Group by week
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return weekStart.toISOString().split('T')[0];
    } else {
      // Year - group by month
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };

  // Group articles by period
  articles.forEach((article) => {
    const date = new Date(article.created_at);
    const key = getGroupKey(date);

    const existing = dataMap.get(key);
    if (existing) {
      existing.articles += 1;
      existing.words += article.word_count || 0;
      if (article.quality_score) {
        existing.qualityScores.push(article.quality_score);
      }
    } else {
      dataMap.set(key, {
        articles: 1,
        words: article.word_count || 0,
        qualityScores: article.quality_score ? [article.quality_score] : [],
      });
    }
  });

  // Generate continuous date range
  const chartData: ChartDataPoint[] = [];
  const current = new Date(start);

  while (current <= end) {
    const key = getGroupKey(current);
    const data = dataMap.get(key) || { articles: 0, words: 0, qualityScores: [] };

    const avgQuality =
      data.qualityScores.length > 0
        ? data.qualityScores.reduce((sum, score) => sum + score, 0) / data.qualityScores.length
        : 0;

    chartData.push({
      date: formatDateLabel(new Date(key + 'T00:00:00'), preset),
      articles: data.articles,
      words: data.words,
      quality: Math.round(avgQuality * 10) / 10,
    });

    // Increment based on grouping
    if (preset === 'week' || preset === 'month') {
      current.setDate(current.getDate() + 1);
    } else if (preset === 'quarter') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return chartData;
}

/**
 * Format date labels for chart
 */
function formatDateLabel(date: Date, preset: DateRangePreset): string {
  if (preset === 'week' || preset === 'month') {
    // Show month/day
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (preset === 'quarter') {
    // Show week of year
    const weekNum = Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return `W${weekNum}`;
  } else {
    // Show month
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
}

export default useAnalytics;
