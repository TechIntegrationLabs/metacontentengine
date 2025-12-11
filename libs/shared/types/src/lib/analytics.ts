/**
 * Analytics & Metrics Types
 */

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  period: 'day' | 'week' | 'month';
}

export interface ArticleMetrics {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  averageQualityScore: number;
  totalWordsGenerated: number;
}

export interface ChartDataPoint {
  date: string;
  articles: number;
  words: number;
  quality: number;
}

export interface AnalyticsContributorStats {
  id: string;
  name: string;
  articles: number;
  avgQuality: number;
  totalWords: number;
}

export interface CategoryPerformance {
  name: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  metrics: ArticleMetrics;
  chartData: ChartDataPoint[];
  topContributors: AnalyticsContributorStats[];
  topCategories: CategoryPerformance[];
}

export type DateRangePreset = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: Date;
  endDate?: Date;
}
