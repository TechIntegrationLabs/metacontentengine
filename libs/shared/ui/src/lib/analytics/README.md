# Analytics Components

Real-time analytics dashboard for the Meta Content Engine platform.

## Components

### AnalyticsDashboard
Main dashboard component that displays all analytics data.

```tsx
import { AnalyticsDashboard } from '@content-engine/ui';
import { useAnalytics } from '@content-engine/hooks';
import { supabase } from './lib/supabase';

function AnalyticsPage() {
  const { data, isLoading, dateRange, updateDateRange } = useAnalytics({
    supabase
  });

  return (
    <AnalyticsDashboard
      data={data}
      dateRange={dateRange}
      onDateRangeChange={updateDateRange}
      isLoading={isLoading}
    />
  );
}
```

### MetricCard
Individual metric display with trend indicator.

```tsx
import { MetricCard } from '@content-engine/ui';
import { FileText } from 'lucide-react';

<MetricCard
  title="Total Articles"
  value="1,234"
  subtitle="All content pieces"
  icon={<FileText className="w-4 h-4 text-indigo-400" />}
  trend={12.5}
  trendLabel="vs last period"
  colorClass="indigo"
/>
```

### PerformanceChart
Line or bar chart for visualizing data over time.

```tsx
import { PerformanceChart } from '@content-engine/ui';

<PerformanceChart
  data={chartData}
  type="line"
  title="Article Production"
  height={320}
  showArticles={true}
  showWords={false}
  showQuality={false}
/>
```

### DateRangePicker
Date range selector with presets.

```tsx
import { DateRangePicker } from '@content-engine/ui';

<DateRangePicker
  value={dateRange}
  onChange={(range) => console.log(range)}
/>
```

## Hook: useAnalytics

Fetches real analytics data from Supabase.

```tsx
import { useAnalytics } from '@content-engine/hooks';
import { supabase } from './lib/supabase';

const {
  data,           // AnalyticsData | null
  isLoading,      // boolean
  error,          // Error | null
  dateRange,      // DateRangeFilter
  updateDateRange, // (range: DateRangeFilter, refetch?: boolean) => void
  refetch,        // () => Promise<void>
} = useAnalytics({
  supabase,
  autoFetch: true, // optional, default true
});
```

## Data Structure

### AnalyticsData
```typescript
interface AnalyticsData {
  metrics: ArticleMetrics;
  chartData: ChartDataPoint[];
  topContributors: AnalyticsContributorStats[];
  topCategories: CategoryPerformance[];
}
```

### ArticleMetrics
```typescript
interface ArticleMetrics {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  averageQualityScore: number;
  totalWordsGenerated: number;
}
```

### ChartDataPoint
```typescript
interface ChartDataPoint {
  date: string;
  articles: number;
  words: number;
  quality: number;
}
```

## Date Range Presets

- **week**: Last 7 days (grouped by day)
- **month**: Last 30 days (grouped by day)
- **quarter**: Last 90 days (grouped by week)
- **year**: Last 365 days (grouped by month)
- **custom**: User-defined date range

## Styling

Components follow the "Kinetic Modernism" design system with:
- Dark void backgrounds (#02040a to #1a1c24)
- Forge accent colors (orange, indigo, purple)
- Glass-morphism effects with subtle transparency
- Smooth animations and transitions

All components use the global `glass-card` and `glass-panel` CSS classes from the theme.
